"""
FastAPI main application for StudyFlow
"""
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
import logging
import traceback
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure a module-level logger (uvicorn will usually pick this up)
logging.basicConfig(level=logging.INFO)
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List
import PyPDF2
import io
from datetime import datetime, timedelta, time
import uuid
import requests

from models import (
    Task, TimeBlock, PlanRequest, ExtractDeadlinesResponse,
    PlanWeekResponse, TodayTasksResponse, NextActionResponse,
    Course, CoursesResponse, CourseResponse,
    ProfileResponse, Profile, DocumentResponse, Document,
    TasksResponse, MoodleSyncRequest, IcsSyncRequest, SyncResponse
)
from pydantic import BaseModel
from typing import Optional, Any
from icalendar import Calendar
from auth import get_current_user_id
from db import db_pool
from extract import parse_tasks_from_text, extract_tasks_with_llm
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
# =========================
# Courses CRUD Endpoints
# =========================

@app.get("/v1/courses", response_model=CoursesResponse)
async def list_courses(user_id: Optional[str] = None, current_user_id: Optional[str] = Depends(get_current_user_id)):
    if current_user_id:
        user_id = current_user_id
    try:
        query = """
            SELECT id, user_id, name, code, color, professor, credits,
                   semester, description, created_at, updated_at
            FROM courses
            WHERE user_id = $1
            ORDER BY name ASC
        """
        rows = await db_pool.fetch(query, user_id)
        courses = [Course(
            id=row['id'],
            user_id=row['user_id'],
            name=row['name'],
            code=row.get('code'),
            color=row.get('color'),
            professor=row.get('professor'),
            credits=row.get('credits'),
            semester=row.get('semester'),
            description=row.get('description'),
            created_at=row.get('created_at'),
            updated_at=row.get('updated_at')
        ) for row in rows]
        return CoursesResponse(courses=courses, count=len(courses))
    except Exception as e:
        logging.error("Error listing courses user_id=%s: %s", user_id, e)
        raise HTTPException(status_code=500, detail=f"Error listing courses: {e}")


class CreateCoursePayload(BaseModel):
    user_id: str
    name: str
    code: Optional[str] = None
    color: Optional[str] = None
    professor: Optional[str] = None
    credits: Optional[int] = None
    semester: Optional[str] = None
    description: Optional[str] = None


@app.post("/v1/courses", response_model=CourseResponse)
async def create_course(payload: CreateCoursePayload, current_user_id: Optional[str] = Depends(get_current_user_id)):
    if current_user_id:
        payload.user_id = current_user_id
    try:
        course_id = str(uuid.uuid4())
        query = """
            INSERT INTO courses (id, user_id, name, code, color, professor, credits, semester, description)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            RETURNING id, user_id, name, code, color, professor, credits,
                      semester, description, created_at, updated_at
        """
        row = await db_pool.fetchrow(query, course_id, payload.user_id, payload.name, payload.code, payload.color, payload.professor, payload.credits, payload.semester, payload.description)
        course = Course(
            id=row['id'],
            user_id=row['user_id'],
            name=row['name'],
            code=row.get('code'),
            color=row.get('color'),
            professor=row.get('professor'),
            credits=row.get('credits'),
            semester=row.get('semester'),
            description=row.get('description'),
            created_at=row.get('created_at'),
            updated_at=row.get('updated_at')
        )
        return CourseResponse(course=course)
    except Exception as e:
        logging.error("Error creating course user_id=%s name=%s: %s", payload.user_id, payload.name, e)
        raise HTTPException(status_code=500, detail=f"Error creating course: {e}")


class UpdateCoursePayload(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    color: Optional[str] = None
    professor: Optional[str] = None
    credits: Optional[int] = None
    semester: Optional[str] = None
    description: Optional[str] = None


@app.put("/v1/courses/{course_id}", response_model=CourseResponse)
async def update_course(course_id: str, payload: UpdateCoursePayload, current_user_id: Optional[str] = Depends(get_current_user_id)):
    try:
        # Build dynamic update set
        fields = []
        values = []
        idx = 1
        for key, value in payload.dict(exclude_unset=True).items():
            fields.append(f"{key} = ${idx}")
            values.append(value)
            idx += 1
        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        # Append course_id
        values.append(course_id)
        query = f"""
            UPDATE courses SET {', '.join(fields)} WHERE id = ${idx}
            RETURNING id, user_id, name, code, color, professor, credits,
                      semester, description, created_at, updated_at
        """
        row = await db_pool.fetchrow(query, *values)
        if not row:
            raise HTTPException(status_code=404, detail="Course not found")
        course = Course(
            id=row['id'],
            user_id=row['user_id'],
            name=row['name'],
            code=row.get('code'),
            color=row.get('color'),
            professor=row.get('professor'),
            credits=row.get('credits'),
            semester=row.get('semester'),
            description=row.get('description'),
            created_at=row.get('created_at'),
            updated_at=row.get('updated_at')
        )
        return CourseResponse(course=course)
    except HTTPException:
        raise
    except Exception as e:
        logging.error("Error updating course id=%s: %s", course_id, e)
        raise HTTPException(status_code=500, detail=f"Error updating course: {e}")


@app.delete("/v1/courses/{course_id}")
async def delete_course(course_id: str, current_user_id: Optional[str] = Depends(get_current_user_id)):
    try:
        query = "DELETE FROM courses WHERE id = $1 RETURNING id"
        row = await db_pool.fetchrow(query, course_id)
        if not row:
            raise HTTPException(status_code=404, detail="Course not found")
        return {"deleted": True, "id": course_id}
    except HTTPException:
        raise
    except Exception as e:
        logging.error("Error deleting course id=%s: %s", course_id, e)
        raise HTTPException(status_code=500, detail=f"Error deleting course: {e}")

# =========================
# Profile Endpoints
# =========================

@app.get("/v1/profile", response_model=ProfileResponse)
async def get_profile(current_user_id: Optional[str] = Depends(get_current_user_id), user_id: Optional[str] = None):
    if current_user_id:
        user_id = current_user_id
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")
    try:
        query = """
            SELECT id, email, full_name, avatar_url, timezone, study_hours_per_day,
                   preferred_study_start_time, preferred_study_end_time,
                   created_at, updated_at
            FROM profiles WHERE id = $1
        """
        row = await db_pool.fetchrow(query, user_id)
        if not row:
            # Seed a default profile if none exists
            try:
                insert_q = """
                    INSERT INTO profiles (id, study_hours_per_day, preferred_study_start_time, preferred_study_end_time)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id, email, full_name, avatar_url, timezone, study_hours_per_day,
                              preferred_study_start_time, preferred_study_end_time, created_at, updated_at
                """
                row = await db_pool.fetchrow(insert_q, user_id, 4, time(hour=9, minute=0), time(hour=17, minute=0))
            except Exception:
                # If insert fails (permissions/constraints), fall back to 404
                raise HTTPException(status_code=404, detail="Profile not found")
        profile = Profile(
            id=row['id'], email=row.get('email'), full_name=row.get('full_name'),
            avatar_url=row.get('avatar_url'), timezone=row.get('timezone'),
            study_hours_per_day=row.get('study_hours_per_day'),
            preferred_study_start_time=row.get('preferred_study_start_time'),
            preferred_study_end_time=row.get('preferred_study_end_time'),
            created_at=row.get('created_at'), updated_at=row.get('updated_at')
        )
        return ProfileResponse(profile=profile)
    except HTTPException:
        raise
    except Exception as e:
        logging.error("Error fetching profile user_id=%s: %s", user_id, e)
        raise HTTPException(status_code=500, detail="Error fetching profile")

class UpdateProfilePayload(BaseModel):
    # Allow passing user_id in body for development (no-auth)
    user_id: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    timezone: Optional[str] = None
    study_hours_per_day: Optional[int] = None
    # Accept either "HH:MM"/"HH:MM:SS" strings or time objects
    preferred_study_start_time: Optional[Any] = None
    preferred_study_end_time: Optional[Any] = None

@app.patch("/v1/profile", response_model=ProfileResponse)
async def update_profile(payload: UpdateProfilePayload, current_user_id: Optional[str] = Depends(get_current_user_id), user_id: Optional[str] = None):
    # Determine effective user_id: token > query > payload
    effective_user_id = current_user_id or user_id or payload.user_id
    if not effective_user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")
    try:
        def to_time(val):
            if val is None:
                return None
            if isinstance(val, time):
                return val
            if isinstance(val, datetime):
                return val.time()
            if isinstance(val, str):
                # Try HH:MM[:SS]
                try:
                    parts = val.strip()
                    if len(parts) <= 8 and parts.count(':') >= 1:
                        # Basic time string
                        return datetime.strptime(parts, "%H:%M" if len(parts) == 5 else "%H:%M:%S").time()
                except Exception:
                    pass
                # Try ISO datetime (e.g., 1970-01-01T09:00:00Z)
                try:
                    iso = val.replace('Z', '+00:00')
                    dt = datetime.fromisoformat(iso)
                    return dt.time()
                except Exception:
                    raise HTTPException(status_code=422, detail=f"Invalid time format: {val}")
            # Unknown type
            raise HTTPException(status_code=422, detail="Invalid time value type")

        fields = []
        values = []
        idx = 1
        data = payload.dict(exclude_unset=True)
        # Remove user_id from update set (we don't update the primary key)
        if 'user_id' in data:
            data.pop('user_id')
        # Coerce time fields if present
        if 'preferred_study_start_time' in data:
            data['preferred_study_start_time'] = to_time(data['preferred_study_start_time'])
        if 'preferred_study_end_time' in data:
            data['preferred_study_end_time'] = to_time(data['preferred_study_end_time'])

        for k, v in data.items():
            fields.append(f"{k} = ${idx}")
            values.append(v)
            idx += 1
        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        values.append(effective_user_id)
        query = f"""
            UPDATE profiles SET {', '.join(fields)} WHERE id = ${idx}
            RETURNING id, email, full_name, avatar_url, timezone, study_hours_per_day,
                      preferred_study_start_time, preferred_study_end_time, created_at, updated_at
        """
        row = await db_pool.fetchrow(query, *values)
        if not row:
            raise HTTPException(status_code=404, detail="Profile not found")
        profile = Profile(
            id=row['id'], email=row.get('email'), full_name=row.get('full_name'),
            avatar_url=row.get('avatar_url'), timezone=row.get('timezone'),
            study_hours_per_day=row.get('study_hours_per_day'),
            preferred_study_start_time=row.get('preferred_study_start_time'),
            preferred_study_end_time=row.get('preferred_study_end_time'),
            created_at=row.get('created_at'), updated_at=row.get('updated_at')
        )
        return ProfileResponse(profile=profile)
    except HTTPException:
        raise
    except Exception as e:
        logging.error("Error updating profile user_id=%s: %s", user_id, e)
        raise HTTPException(status_code=500, detail="Error updating profile")

# =========================
# Tasks Manual CRUD
# =========================

class CreateTaskPayload(BaseModel):
    user_id: Optional[str] = None
    course_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    type: str
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_duration: Optional[int] = None

@app.post("/v1/tasks", response_model=Task)
async def create_task(payload: CreateTaskPayload, current_user_id: Optional[str] = Depends(get_current_user_id)):
    if current_user_id:
        payload.user_id = current_user_id
    if not payload.user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")
    try:
        task_id = str(uuid.uuid4())
        query = """
            INSERT INTO tasks (id, user_id, course_id, title, description, "type", priority, status, due_date, estimated_duration)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            RETURNING id,user_id,course_id,title,description,"type",priority,status,due_date,estimated_duration,actual_duration,completed_at,created_at,updated_at
        """
        row = await db_pool.fetchrow(query, task_id, payload.user_id, payload.course_id, payload.title, payload.description, payload.type, payload.priority, payload.status, payload.due_date, payload.estimated_duration)
        task = Task(
            id=row['id'], user_id=row['user_id'], course_id=row.get('course_id'), title=row['title'], description=row.get('description'),
            type=row.get('type') if row.get('type') is not None else row.get('task_type'), priority=row.get('priority'), status=row.get('status'),
            due_date=row.get('due_date'), estimated_duration=row.get('estimated_duration'), actual_duration=row.get('actual_duration'),
            completed_at=row.get('completed_at'), created_at=row.get('created_at'), updated_at=row.get('updated_at')
        )
        return task
    except Exception as e:
        logging.error("Error creating task user_id=%s title=%s: %s", payload.user_id, payload.title, e)
        raise HTTPException(status_code=500, detail="Error creating task")

class UpdateTaskPayload(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_duration: Optional[int] = None
    course_id: Optional[str] = None

@app.patch("/v1/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, payload: UpdateTaskPayload, current_user_id: Optional[str] = Depends(get_current_user_id)):
    try:
        # Build dynamic update set
        fields = []
        values = []
        idx = 1
        mapping = {"type": '"type"'}
        for key, value in payload.dict(exclude_unset=True).items():
            column = mapping.get(key, key)
            fields.append(f"{column} = ${idx}")
            values.append(value)
            idx += 1
        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        values.append(task_id)
        query = f"""
            UPDATE tasks SET {', '.join(fields)} WHERE id = ${idx}
            RETURNING id,user_id,course_id,title,description,"type",priority,status,due_date,estimated_duration,actual_duration,completed_at,created_at,updated_at
        """
        row = await db_pool.fetchrow(query, *values)
        if not row:
            raise HTTPException(status_code=404, detail="Task not found")
        task = Task(
            id=row['id'], user_id=row['user_id'], course_id=row.get('course_id'), title=row['title'], description=row.get('description'),
            type=row.get('type') if row.get('type') is not None else row.get('task_type'), priority=row.get('priority'), status=row.get('status'),
            due_date=row.get('due_date'), estimated_duration=row.get('estimated_duration'), actual_duration=row.get('actual_duration'),
            completed_at=row.get('completed_at'), created_at=row.get('created_at'), updated_at=row.get('updated_at')
        )
        return task
    except HTTPException:
        raise
    except Exception as e:
        logging.error("Error updating task id=%s: %s", task_id, e)
        raise HTTPException(status_code=500, detail="Error updating task")

@app.delete("/v1/tasks/{task_id}")
async def delete_task(task_id: str):
    try:
        query = "DELETE FROM tasks WHERE id = $1 RETURNING id"
        row = await db_pool.fetchrow(query, task_id)
        if not row:
            raise HTTPException(status_code=404, detail="Task not found")
        return {"deleted": True, "id": task_id}
    except HTTPException:
        raise
    except Exception as e:
        logging.error("Error deleting task id=%s: %s", task_id, e)
        raise HTTPException(status_code=500, detail="Error deleting task")

class TaskStatusPayload(BaseModel):
    status: str

@app.patch("/v1/tasks/{task_id}/status", response_model=Task)
async def update_task_status(task_id: str, payload: TaskStatusPayload):
    try:
        extra = "completed_at = NOW()," if payload.status == 'completed' else "completed_at = NULL," if payload.status == 'todo' else ""
        query = f"""
            UPDATE tasks SET status = $1, {extra} updated_at = NOW()
            WHERE id = $2
            RETURNING id,user_id,course_id,title,description,"type",priority,status,due_date,estimated_duration,actual_duration,completed_at,created_at,updated_at
        """
        row = await db_pool.fetchrow(query, payload.status, task_id)
        if not row:
            raise HTTPException(status_code=404, detail="Task not found")
        task = Task(
            id=row['id'], user_id=row['user_id'], course_id=row.get('course_id'), title=row['title'], description=row.get('description'),
            type=row.get('type') if row.get('type') is not None else row.get('task_type'), priority=row.get('priority'), status=row.get('status'),
            due_date=row.get('due_date'), estimated_duration=row.get('estimated_duration'), actual_duration=row.get('actual_duration'),
            completed_at=row.get('completed_at'), created_at=row.get('created_at'), updated_at=row.get('updated_at')
        )
        return task
    except HTTPException:
        raise
    except Exception as e:
        logging.error("Error updating task status id=%s: %s", task_id, e)
        raise HTTPException(status_code=500, detail="Error updating task status")

# List tasks endpoint
@app.get("/v1/tasks", response_model=TasksResponse)
async def list_tasks(user_id: Optional[str] = None, current_user_id: Optional[str] = Depends(get_current_user_id), limit: int = 100, offset: int = 0):
    if current_user_id:
        user_id = current_user_id
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")
    try:
        query = """
            SELECT id,user_id,course_id,title,description,"type",priority,status,due_date,estimated_duration,
                   actual_duration,completed_at,created_at,updated_at
            FROM tasks
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        """
        rows = await db_pool.fetch(query, user_id, limit, offset)
        tasks = [Task(
            id=r['id'], user_id=r['user_id'], course_id=r.get('course_id'), title=r['title'], description=r.get('description'),
            type=r.get('type') if r.get('type') is not None else r.get('task_type'), priority=r.get('priority'), status=r.get('status'),
            due_date=r.get('due_date'), estimated_duration=r.get('estimated_duration'), actual_duration=r.get('actual_duration'),
            completed_at=r.get('completed_at'), created_at=r.get('created_at'), updated_at=r.get('updated_at')
        ) for r in rows]
        return TasksResponse(tasks=tasks, count=len(tasks))
    except Exception as e:
        logging.error("Error listing tasks user_id=%s: %s", user_id, e)
        raise HTTPException(status_code=500, detail="Error listing tasks")


# =========================
# Documents Upload Metadata
# =========================

class UploadDocumentPayload(BaseModel):
    user_id: Optional[str] = None
    course_id: Optional[str] = None
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    document_type: Optional[str] = None
    description: Optional[str] = None

@app.post("/v1/documents", response_model=DocumentResponse)
async def upload_document(payload: UploadDocumentPayload, current_user_id: Optional[str] = Depends(get_current_user_id)):
    if current_user_id:
        payload.user_id = current_user_id
    if not payload.user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")
    try:
        doc_id = str(uuid.uuid4())
        query = """
            INSERT INTO documents (id,user_id,course_id,file_name,file_path,file_size,file_type,document_type,description)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            RETURNING id,user_id,course_id,file_name,file_path,file_size,file_type,document_type,description,upload_date,created_at,updated_at
        """
        row = await db_pool.fetchrow(query, doc_id, payload.user_id, payload.course_id, payload.file_name, payload.file_path, payload.file_size, 'application/pdf', payload.document_type, payload.description)
        document = Document(
            id=row['id'], user_id=row['user_id'], course_id=row.get('course_id'), file_name=row['file_name'], file_path=row['file_path'],
            file_size=row.get('file_size'), file_type=row.get('file_type'), document_type=row.get('document_type'), description=row.get('description'),
            upload_date=row.get('upload_date'), created_at=row.get('created_at'), updated_at=row.get('updated_at')
        )
        # If syllabus, optionally trigger extraction (future enhancement)
        return DocumentResponse(document=document)
    except Exception as e:
        logging.error("Error uploading document user_id=%s file_name=%s: %s", payload.user_id, payload.file_name, e)
        raise HTTPException(status_code=500, detail="Error uploading document")

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


@app.post("/v1/import-ics", response_model=ExtractDeadlinesResponse)
async def import_ics(file: UploadFile = File(...), current_user_id: Optional[str] = Depends(get_current_user_id)):
    """
    Import tasks from a .ics calendar file (VEVENT/VTODO) and insert as tasks.
    For VEVENT, we map summary to title and use dtstart as due_date. For VTODO, if DUE exists, we use it.
    """
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    user_id = current_user_id
    logging.info(f"Import ICS for user {user_id}, filename: {file.filename}")
    try:
        content = await file.read()
        logging.info(f"Read {len(content)} bytes from file")
        cal = Calendar.from_ical(content)
        logging.info(f"Parsed calendar successfully")
        inserted_tasks = []

        for component in cal.walk():
            try:
                if component.name not in ("VEVENT", "VTODO"):
                    continue
                summary = component.get('summary')
                if not summary:
                    continue
                # Get a due-like datetime
                due_dt = None
                if component.name == 'VTODO':
                    due = component.get('due')
                    if due is not None:
                        due_dt = getattr(due, 'dt', None)
                if due_dt is None:
                    dtstart = component.get('dtstart')
                    if dtstart is not None:
                        due_dt = getattr(dtstart, 'dt', None)
                # Normalize date-only to datetime at 09:00
                if due_dt is not None and not isinstance(due_dt, datetime):
                    try:
                        # date object
                        due_dt = datetime.combine(due_dt, time(hour=9, minute=0))
                    except Exception:
                        due_dt = None

                task_id = str(uuid.uuid4())
                query = """
                    INSERT INTO tasks (
                        id, user_id, title, "type", priority, status, due_date
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING id, user_id, title, "type", priority, status, due_date, estimated_duration, created_at, updated_at
                """
                row = await db_pool.fetchrow(
                    query,
                    task_id,
                    user_id,
                    str(summary),
                    'other',  # Use 'other' instead of 'calendar' - it's an accepted value
                    'low',
                    'todo',
                    due_dt
                )
                if row:
                    inserted_tasks.append(Task(
                        id=row['id'], user_id=row['user_id'], title=row['title'],
                        description=None, type=row.get('type') if row.get('type') is not None else row.get('task_type'),
                        priority=row.get('priority'), status=row.get('status'),
                        due_date=row.get('due_date'), estimated_duration=row.get('estimated_duration'),
                        created_at=row.get('created_at'), updated_at=row.get('updated_at')
                    ))
            except Exception as inner:
                logging.warning("Skipping calendar component due to error: %s", inner)

        return ExtractDeadlinesResponse(tasks=inserted_tasks, count=len(inserted_tasks))
    except Exception as e:
        logging.error(f"Error in import_ics: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error importing ICS: {str(e)}")
@app.post("/v1/extract-deadlines", response_model=ExtractDeadlinesResponse)
async def extract_deadlines(file: UploadFile = File(...), current_user_id: Optional[str] = Depends(get_current_user_id)):
    """
    Extract deadlines from a PDF file and insert tasks into the database.
    
    Args:
        file: Uploaded PDF file
        current_user_id: User ID extracted from JWT token
    
    Returns:
        ExtractDeadlinesResponse with extracted and inserted tasks
    """
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    user_id = current_user_id
    logging.info(f"Extract deadlines for user {user_id}, filename: {file.filename}")
    try:
        # Read PDF content
        pdf_content = await file.read()
        logging.info(f"Read {len(pdf_content)} bytes from PDF")
        pdf_file = io.BytesIO(pdf_content)
        
        # Extract text from PDF
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        logging.info(f"PDF has {len(pdf_reader.pages)} pages")
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        
        logging.info(f"Extracted {len(text)} characters from PDF")
        
        # Parse tasks from text using LLM (with fallback to regex)
        tasks = await extract_tasks_with_llm(text, user_id=user_id)
        logging.info(f"Parsed {len(tasks)} tasks from text using LLM")
        
        # Insert tasks into database
        inserted_tasks = []
        for task in tasks:
            task_id = str(uuid.uuid4())
            
            query = """
                INSERT INTO tasks (
                    id, user_id, title, "type", priority, status,
                    due_date, estimated_duration
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, user_id, title, "type", priority, status,
                          due_date, estimated_duration, created_at, updated_at
            """
            
            result = await db_pool.fetchrow(
                query,
                task_id,
                task.user_id,
                task.title,
                task.type,
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
                    description=result.get('description'),
                    type=result['type'] if 'type' in result else result.get('task_type'),
                    priority=result['priority'],
                    status=result['status'],
                    due_date=result['due_date'],
                    estimated_duration=result['estimated_duration'] if 'estimated_duration' in result else result.get('estimated_minutes'),
                )
                inserted_tasks.append(inserted_task)
        
        logging.info(f"Successfully inserted {len(inserted_tasks)} tasks from PDF")
        return ExtractDeadlinesResponse(tasks=inserted_tasks, count=len(inserted_tasks))
    
    except Exception as e:
        logging.error(f"Error in extract_deadlines: {str(e)}", exc_info=True)
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
async def get_tasks_today(current_user_id: Optional[str] = Depends(get_current_user_id)):
    """
    Get today's tasks based on time blocks scheduled for today.
    
    Args:
        current_user_id: User ID extracted from JWT token
    
    Returns:
        TodayTasksResponse with tasks and time blocks for today
    """
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    user_id = current_user_id
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
                SELECT id, user_id, title, description,
                       "type", priority, status, due_date,
                       estimated_duration
                FROM tasks
                WHERE id = ANY($1::uuid[])
                ORDER BY priority DESC, due_date ASC
            """
            
            tasks_result = await db_pool.fetch(tasks_query, list(task_ids))
            
            for row in tasks_result:
                task = Task(
                    id=row['id'],
                    user_id=row['user_id'],
                    title=row['title'],
                    description=row.get('description'),
                    type=row.get('type') if row.get('type') is not None else row.get('task_type'),
                    priority=row.get('priority'),
                    status=row.get('status'),
                    due_date=row.get('due_date'),
                    estimated_duration=row.get('estimated_duration') if row.get('estimated_duration') is not None else row.get('estimated_minutes'),
                )
                tasks.append(task)
        
        return TodayTasksResponse(
            tasks=tasks,
            time_blocks=time_blocks,
            count=len(time_blocks)
        )
    
    except Exception as e:
        logging.error("Error in /v1/tasks/today for user_id=%s: %s\n%s", user_id, e, traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error fetching today's tasks: {str(e)}")


@app.get("/v1/next-action", response_model=NextActionResponse)
async def get_next_action(current_user_id: Optional[str] = Depends(get_current_user_id)):
    """
    Get the next most important task to work on.
    Prioritizes by: 1) Current time block, 2) Highest priority incomplete task
    
    Args:
        current_user_id: User ID extracted from JWT token
    
    Returns:
        NextActionResponse with the next task and time block
    """
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    user_id = current_user_id
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
                           "type", priority, status, due_date,
                           estimated_duration
                    FROM tasks
                    WHERE id = $1
                """
                task_row = await db_pool.fetchrow(task_query, current_block['task_id'])
                
                if task_row:
                    task = Task(
                        id=str(task_row['id']),
                        user_id=task_row['user_id'],
                        title=task_row['title'],
                        description=task_row.get('description'),
                        type=task_row.get('type') if task_row.get('type') is not None else task_row.get('task_type'),
                        priority=task_row.get('priority'),
                        status=task_row.get('status'),
                        due_date=task_row.get('due_date'),
                        estimated_duration=task_row.get('estimated_duration') if task_row.get('estimated_duration') is not None else task_row.get('estimated_minutes'),
                    )
            
            return NextActionResponse(task=task, time_block=time_block)
        
        # If no current block, find the highest priority incomplete task
        priority_task_query = """
            SELECT id, user_id, course_id, title, description,
                   "type", priority, status, due_date,
                   estimated_duration
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
                title=task_row['title'],
                description=task_row.get('description'),
                type=task_row.get('type') if task_row.get('type') is not None else task_row.get('task_type'),
                priority=task_row.get('priority'),
                status=task_row.get('status'),
                due_date=task_row.get('due_date'),
                estimated_duration=task_row.get('estimated_duration') if task_row.get('estimated_duration') is not None else task_row.get('estimated_minutes'),
            )
            
            return NextActionResponse(task=task, time_block=None)
        
        # No tasks found
        return NextActionResponse(task=None, time_block=None)
    
    except Exception as e:
        logging.error("Error in /v1/next-action for user_id=%s: %s\n%s", user_id, e, traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error fetching next action: {str(e)}")


# ========== PHASE 2: INTELLIGENCE & IMPORTS ==========

@app.post("/v1/moodle/sync", response_model=SyncResponse)
async def sync_moodle(payload: MoodleSyncRequest, current_user_id: Optional[str] = Depends(get_current_user_id)):
    """
    Synchronize tasks from Moodle using REST API.
    Calls mod_assign_get_assignments and core_calendar_get_calendar_events.
    """
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        tasks_created = 0
        tasks_updated = 0
        
        # Prepare Moodle API request
        moodle_url = payload.moodle_url.rstrip('/')
        
        logging.info(f"Moodle sync started for user {current_user_id}, URL: {moodle_url}")
        
        # 1. Get assignments
        assignments_endpoint = f"{moodle_url}/webservice/rest/server.php"
        assignments_params = {
            'wstoken': payload.token,
            'wsfunction': 'mod_assign_get_assignments',
            'moodlewsrestformat': 'json'
        }
        
        logging.info(f"Calling Moodle assignments API: {assignments_endpoint}")
        assignments_response = requests.get(assignments_endpoint, params=assignments_params, timeout=10)
        assignments_response.raise_for_status()
        assignments_data = assignments_response.json()
        
        logging.info(f"Moodle API response: {assignments_data}")
        
        # Check for error in response
        if 'exception' in assignments_data or 'errorcode' in assignments_data:
            error_msg = assignments_data.get('message', assignments_data.get('errorcode', 'Unknown Moodle error'))
            logging.error(f"Moodle API error: {error_msg}")
            raise HTTPException(
                status_code=400, 
                detail=f"Moodle error: {error_msg}. Vérifiez que les webservices sont activés et que vous utilisez un token webservice (pas un token de sécurité)."
            )
        
        # Parse assignments
        if 'courses' in assignments_data:
            for course in assignments_data['courses']:
                course_name = course.get('shortname', 'Unknown Course')
                
                # Get or create course
                course_query = """
                    INSERT INTO courses (id, user_id, name, code)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (user_id, code) DO UPDATE SET name = EXCLUDED.name
                    RETURNING id
                """
                course_id = str(uuid.uuid4())
                course_code = course.get('shortname', 'UNKNOWN')
                course_row = await db_pool.fetchrow(course_query, course_id, current_user_id, course_name, course_code)
                course_id = str(course_row['id'])
                
                # Process assignments
                for assignment in course.get('assignments', []):
                    title = assignment.get('name', 'Untitled Assignment')
                    due_timestamp = assignment.get('duedate', 0)
                    
                    if due_timestamp > 0:
                        due_date = datetime.fromtimestamp(due_timestamp)
                    else:
                        due_date = None
                    
                    # Check if task already exists (by title and course)
                    existing_task = await db_pool.fetchrow(
                        "SELECT id FROM tasks WHERE user_id=$1 AND title=$2 AND course_id=$3",
                        current_user_id, title, course_id
                    )
                    
                    if existing_task:
                        # Update existing task
                        await db_pool.execute(
                            """UPDATE tasks SET due_date=$1, updated_at=NOW() 
                               WHERE id=$2""",
                            due_date, str(existing_task['id'])
                        )
                        tasks_updated += 1
                    else:
                        # Create new task
                        task_id = str(uuid.uuid4())
                        await db_pool.execute(
                            """INSERT INTO tasks (id, user_id, course_id, title, type, priority, status, due_date, estimated_duration)
                               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)""",
                            task_id, current_user_id, course_id, title, 'homework', 'medium', 'todo', due_date, 120
                        )
                        tasks_created += 1
        
        # 2. Get calendar events
        events_params = {
            'wstoken': payload.token,
            'wsfunction': 'core_calendar_get_calendar_events',
            'moodlewsrestformat': 'json'
        }
        
        events_response = requests.get(assignments_endpoint, params=events_params, timeout=10)
        events_response.raise_for_status()
        events_data = events_response.json()
        
        # Parse events (exams, quizzes)
        if 'events' in events_data:
            for event in events_data['events']:
                event_name = event.get('name', 'Event')
                event_type = event.get('modulename', 'event')
                
                # Only import quiz and exam events
                if event_type in ['quiz', 'exam']:
                    due_timestamp = event.get('timestart', 0)
                    due_date = datetime.fromtimestamp(due_timestamp) if due_timestamp > 0 else None
                    
                    # Get course
                    course_id = None
                    course_name = event.get('course', {}).get('shortname') if isinstance(event.get('course'), dict) else None
                    if course_name:
                        course_query = "SELECT id FROM courses WHERE user_id=$1 AND code=$2"
                        course_row = await db_pool.fetchrow(course_query, current_user_id, course_name)
                        if course_row:
                            course_id = str(course_row['id'])
                    
                    # Check if task exists
                    existing_task = await db_pool.fetchrow(
                        "SELECT id FROM tasks WHERE user_id=$1 AND title=$2",
                        current_user_id, event_name
                    )
                    
                    if not existing_task:
                        task_id = str(uuid.uuid4())
                        task_type = 'exam' if event_type == 'quiz' else 'quiz'
                        await db_pool.execute(
                            """INSERT INTO tasks (id, user_id, course_id, title, type, priority, status, due_date, estimated_duration)
                               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)""",
                            task_id, current_user_id, course_id, event_name, task_type, 'urgent', 'todo', due_date, 180
                        )
                        tasks_created += 1
        
        return SyncResponse(
            success=True,
            tasks_created=tasks_created,
            tasks_updated=tasks_updated,
            time_blocks_created=0,
            message=f"Moodle sync complete: {tasks_created} created, {tasks_updated} updated"
        )
    
    except requests.RequestException as e:
        logging.error(f"Moodle API error: {e}")
        raise HTTPException(status_code=502, detail=f"Moodle API error: {str(e)}")
    except Exception as e:
        logging.error(f"Moodle sync error: {e}")
        raise HTTPException(status_code=500, detail=f"Sync error: {str(e)}")


@app.post("/v1/ics/sync", response_model=SyncResponse)
async def sync_ics(payload: IcsSyncRequest, current_user_id: Optional[str] = Depends(get_current_user_id)):
    """
    Synchronize schedule from ICS calendar URL.
    Creates time_blocks for schedule blocking (classes, labs, etc).
    """
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        from icalendar import Calendar
        import recurring_ical_events
        from datetime import datetime, timedelta
        
        time_blocks_created = 0
        
        # Fetch ICS file
        response = requests.get(payload.ics_url, timeout=10)
        response.raise_for_status()
        
        # Parse ICS
        cal = Calendar.from_ical(response.content)
        
        # Get events for next 3 months
        start_date = datetime.now()
        end_date = start_date + timedelta(days=90)
        
        events = recurring_ical_events.of(cal).between(start_date, end_date)
        
        for event in events:
            summary = str(event.get('summary', 'Class'))
            dtstart = event.get('dtstart').dt
            dtend = event.get('dtend').dt
            location = str(event.get('location', ''))
            description = str(event.get('description', ''))
            
            # Convert to datetime if date only
            if not isinstance(dtstart, datetime):
                dtstart = datetime.combine(dtstart, datetime.min.time())
            if not isinstance(dtend, datetime):
                dtend = datetime.combine(dtend, datetime.min.time())
            
            # Check if time_block already exists
            existing_block = await db_pool.fetchrow(
                """SELECT id FROM time_blocks 
                   WHERE user_id=$1 AND start_time=$2 AND end_time=$3""",
                current_user_id, dtstart, dtend
            )
            
            if not existing_block:
                block_id = str(uuid.uuid4())
                await db_pool.execute(
                    """INSERT INTO time_blocks (id, user_id, title, type, start_time, end_time, location, description)
                       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)""",
                    block_id, current_user_id, summary, 'class', dtstart, dtend, location, description
                )
                time_blocks_created += 1
        
        return SyncResponse(
            success=True,
            tasks_created=0,
            tasks_updated=0,
            time_blocks_created=time_blocks_created,
            message=f"ICS sync complete: {time_blocks_created} classes imported"
        )
    
    except requests.RequestException as e:
        logging.error(f"ICS fetch error: {e}")
        raise HTTPException(status_code=502, detail=f"ICS fetch error: {str(e)}")
    except Exception as e:
        logging.error(f"ICS sync error: {e}")
        raise HTTPException(status_code=500, detail=f"Sync error: {str(e)}")


if __name__ == "__main__":

    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
