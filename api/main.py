"""
FastAPI main application for StudyFlow
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List
import PyPDF2
import io
from datetime import datetime, timedelta
import uuid

from models import (
    Task, TimeBlock, PlanRequest, ExtractDeadlinesResponse,
    PlanWeekResponse, TodayTasksResponse, NextActionResponse
)
from db import db_pool
from extract import parse_tasks_from_text
from planning import generate_plan


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown"""
    # Startup
    await db_pool.connect()
    yield
    # Shutdown
    await db_pool.disconnect()


app = FastAPI(
    title="StudyFlow API",
    description="API for intelligent task planning for students",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "StudyFlow API is running", "version": "1.0.0"}


@app.post("/v1/extract-deadlines", response_model=ExtractDeadlinesResponse)
async def extract_deadlines(file: UploadFile = File(...), user_id: str = "demo"):
    """
    Extract deadlines from a PDF file and insert tasks into the database.
    
    Args:
        file: Uploaded PDF file
        user_id: User ID to associate with tasks
    
    Returns:
        ExtractDeadlinesResponse with extracted and inserted tasks
    """
    try:
        # Read PDF content
        pdf_content = await file.read()
        pdf_file = io.BytesIO(pdf_content)
        
        # Extract text from PDF
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        
        # Parse tasks from text
        tasks = parse_tasks_from_text(text, user_id=user_id)
        
        # Insert tasks into database
        inserted_tasks = []
        for task in tasks:
            task_id = str(uuid.uuid4())
            
            query = """
                INSERT INTO tasks (
                    id, user_id, title, task_type, priority, status,
                    due_date, estimated_duration
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, user_id, title, task_type, priority, status,
                          due_date, estimated_duration, created_at, updated_at
            """
            
            result = await db_pool.fetchrow(
                query,
                task_id,
                task.user_id,
                task.title,
                task.task_type,
                task.priority,
                task.status,
                task.due_date,
                task.estimated_duration
            )
            
            if result:
                inserted_task = Task(
                    id=str(result['id']),
                    user_id=result['user_id'],
                    title=result['title'],
                    task_type=result['task_type'],
                    priority=result['priority'],
                    status=result['status'],
                    due_date=result['due_date'],
                    estimated_duration=result['estimated_duration'],
                    created_at=result['created_at'],
                    updated_at=result['updated_at']
                )
                inserted_tasks.append(inserted_task)
        
        return ExtractDeadlinesResponse(tasks=inserted_tasks, count=len(inserted_tasks))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting deadlines: {str(e)}")


@app.post("/v1/plan-week", response_model=PlanWeekResponse)
async def plan_week(plan_request: PlanRequest):
    """
    Generate a weekly plan and insert time blocks into the database.
    
    Args:
        plan_request: PlanRequest with tasks and availability
    
    Returns:
        PlanWeekResponse with generated time blocks
    """
    try:
        # Generate time blocks using planning algorithm
        time_blocks = generate_plan(plan_request)
        
        # Insert time blocks into database
        inserted_blocks = []
        for block in time_blocks:
            block_id = str(uuid.uuid4())
            
            query = """
                INSERT INTO time_blocks (
                    id, user_id, task_id, title, description,
                    start_time, end_time, block_type, is_completed
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id, user_id, task_id, title, description,
                          start_time, end_time, block_type, is_completed,
                          created_at, updated_at
            """
            
            result = await db_pool.fetchrow(
                query,
                block_id,
                block.user_id,
                block.task_id,
                block.title,
                block.description,
                block.start_time,
                block.end_time,
                block.block_type,
                block.is_completed
            )
            
            if result:
                inserted_block = TimeBlock(
                    id=str(result['id']),
                    user_id=result['user_id'],
                    task_id=str(result['task_id']) if result['task_id'] else None,
                    title=result['title'],
                    description=result['description'],
                    start_time=result['start_time'],
                    end_time=result['end_time'],
                    block_type=result['block_type'],
                    is_completed=result['is_completed'],
                    created_at=result['created_at'],
                    updated_at=result['updated_at']
                )
                inserted_blocks.append(inserted_block)
        
        return PlanWeekResponse(time_blocks=inserted_blocks, count=len(inserted_blocks))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error planning week: {str(e)}")


@app.get("/v1/tasks/today", response_model=TodayTasksResponse)
async def get_tasks_today(user_id: str = "demo"):
    """
    Get today's tasks based on time blocks scheduled for today.
    
    Args:
        user_id: User ID to filter tasks
    
    Returns:
        TodayTasksResponse with tasks and time blocks for today
    """
    try:
        # Get today's date range
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        # Query time blocks for today
        blocks_query = """
            SELECT id, user_id, task_id, title, description,
                   start_time, end_time, block_type, is_completed,
                   created_at, updated_at
            FROM time_blocks
            WHERE user_id = $1
              AND start_time >= $2
              AND start_time < $3
            ORDER BY start_time ASC
        """
        
        blocks_result = await db_pool.fetch(blocks_query, user_id, today_start, today_end)
        
        time_blocks = []
        task_ids = set()
        
        for row in blocks_result:
            time_block = TimeBlock(
                id=str(row['id']),
                user_id=row['user_id'],
                task_id=str(row['task_id']) if row['task_id'] else None,
                title=row['title'],
                description=row['description'],
                start_time=row['start_time'],
                end_time=row['end_time'],
                block_type=row['block_type'],
                is_completed=row['is_completed'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            )
            time_blocks.append(time_block)
            
            if row['task_id']:
                task_ids.add(str(row['task_id']))
        
        # Query tasks for these time blocks
        tasks = []
        if task_ids:
            tasks_query = """
                SELECT id, user_id, course_id, title, description,
                       task_type, priority, status, due_date,
                       estimated_duration, actual_duration, completed_at,
                       created_at, updated_at
                FROM tasks
                WHERE id = ANY($1::uuid[])
                ORDER BY priority DESC, due_date ASC
            """
            
            tasks_result = await db_pool.fetch(tasks_query, list(task_ids))
            
            for row in tasks_result:
                task = Task(
                    id=str(row['id']),
                    user_id=row['user_id'],
                    course_id=str(row['course_id']) if row['course_id'] else None,
                    title=row['title'],
                    description=row['description'],
                    task_type=row['task_type'],
                    priority=row['priority'],
                    status=row['status'],
                    due_date=row['due_date'],
                    estimated_duration=row['estimated_duration'],
                    actual_duration=row['actual_duration'],
                    completed_at=row['completed_at'],
                    created_at=row['created_at'],
                    updated_at=row['updated_at']
                )
                tasks.append(task)
        
        return TodayTasksResponse(
            tasks=tasks,
            time_blocks=time_blocks,
            count=len(time_blocks)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching today's tasks: {str(e)}")


@app.get("/v1/next-action", response_model=NextActionResponse)
async def get_next_action(user_id: str = "demo"):
    """
    Get the next most important task to work on.
    Prioritizes by: 1) Current time block, 2) Highest priority incomplete task
    
    Args:
        user_id: User ID to filter tasks
    
    Returns:
        NextActionResponse with the next task and time block
    """
    try:
        now = datetime.now()
        
        # First, check if there's a current time block
        current_block_query = """
            SELECT id, user_id, task_id, title, description,
                   start_time, end_time, block_type, is_completed,
                   created_at, updated_at
            FROM time_blocks
            WHERE user_id = $1
              AND start_time <= $2
              AND end_time > $2
              AND is_completed = false
            ORDER BY start_time ASC
            LIMIT 1
        """
        
        current_block = await db_pool.fetchrow(current_block_query, user_id, now)
        
        if current_block:
            time_block = TimeBlock(
                id=str(current_block['id']),
                user_id=current_block['user_id'],
                task_id=str(current_block['task_id']) if current_block['task_id'] else None,
                title=current_block['title'],
                description=current_block['description'],
                start_time=current_block['start_time'],
                end_time=current_block['end_time'],
                block_type=current_block['block_type'],
                is_completed=current_block['is_completed'],
                created_at=current_block['created_at'],
                updated_at=current_block['updated_at']
            )
            
            # Get associated task if exists
            task = None
            if current_block['task_id']:
                task_query = """
                    SELECT id, user_id, course_id, title, description,
                           task_type, priority, status, due_date,
                           estimated_duration, actual_duration, completed_at,
                           created_at, updated_at
                    FROM tasks
                    WHERE id = $1
                """
                task_row = await db_pool.fetchrow(task_query, current_block['task_id'])
                
                if task_row:
                    task = Task(
                        id=str(task_row['id']),
                        user_id=task_row['user_id'],
                        course_id=str(task_row['course_id']) if task_row['course_id'] else None,
                        title=task_row['title'],
                        description=task_row['description'],
                        task_type=task_row['task_type'],
                        priority=task_row['priority'],
                        status=task_row['status'],
                        due_date=task_row['due_date'],
                        estimated_duration=task_row['estimated_duration'],
                        actual_duration=task_row['actual_duration'],
                        completed_at=task_row['completed_at'],
                        created_at=task_row['created_at'],
                        updated_at=task_row['updated_at']
                    )
            
            return NextActionResponse(task=task, time_block=time_block)
        
        # If no current block, find the highest priority incomplete task
        priority_task_query = """
            SELECT id, user_id, course_id, title, description,
                   task_type, priority, status, due_date,
                   estimated_duration, actual_duration, completed_at,
                   created_at, updated_at
            FROM tasks
            WHERE user_id = $1
              AND status != 'completed'
              AND status != 'cancelled'
            ORDER BY
                CASE priority
                    WHEN 'urgent' THEN 4
                    WHEN 'high' THEN 3
                    WHEN 'medium' THEN 2
                    WHEN 'low' THEN 1
                END DESC,
                due_date ASC NULLS LAST
            LIMIT 1
        """
        
        task_row = await db_pool.fetchrow(priority_task_query, user_id)
        
        if task_row:
            task = Task(
                id=str(task_row['id']),
                user_id=task_row['user_id'],
                course_id=str(task_row['course_id']) if task_row['course_id'] else None,
                title=task_row['title'],
                description=task_row['description'],
                task_type=task_row['task_type'],
                priority=task_row['priority'],
                status=task_row['status'],
                due_date=task_row['due_date'],
                estimated_duration=task_row['estimated_duration'],
                actual_duration=task_row['actual_duration'],
                completed_at=task_row['completed_at'],
                created_at=task_row['created_at'],
                updated_at=task_row['updated_at']
            )
            
            return NextActionResponse(task=task, time_block=None)
        
        # No tasks found
        return NextActionResponse(task=None, time_block=None)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching next action: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
