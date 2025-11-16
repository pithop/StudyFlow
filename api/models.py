"""
Pydantic models for StudyFlow API
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, time


class Task(BaseModel):
    """Task model representing an academic task"""
    id: Optional[str] = None
    user_id: str
    course_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    task_type: str = Field(default="homework", pattern="^(homework|exam|project|reading|other)$")
    priority: str = Field(default="medium", pattern="^(low|medium|high|urgent)$")
    status: str = Field(default="todo", pattern="^(todo|in_progress|completed|cancelled)$")
    due_date: Optional[datetime] = None
    estimated_duration: Optional[int] = None  # in minutes
    actual_duration: Optional[int] = None  # in minutes
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class TimeBlock(BaseModel):
    """Time block model for scheduled study sessions"""
    id: Optional[str] = None
    user_id: str
    task_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    block_type: str = Field(default="study", pattern="^(study|break|exam|class|other)$")
    is_completed: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Availability(BaseModel):
    """User availability for planning"""
    start_time: time
    end_time: time
    days: List[str] = Field(default=["monday", "tuesday", "wednesday", "thursday", "friday"])


class PlanRequest(BaseModel):
    """Request model for generating a weekly plan"""
    user_id: str
    tasks: List[Task]
    availability: Availability
    study_hours_per_day: int = Field(default=4, ge=1, le=12)


class ExtractDeadlinesResponse(BaseModel):
    """Response model for extract deadlines endpoint"""
    tasks: List[Task]
    count: int


class PlanWeekResponse(BaseModel):
    """Response model for plan week endpoint"""
    time_blocks: List[TimeBlock]
    count: int


class TodayTasksResponse(BaseModel):
    """Response model for today's tasks"""
    tasks: List[Task]
    time_blocks: List[TimeBlock]
    count: int


class NextActionResponse(BaseModel):
    """Response model for next action"""
    task: Optional[Task] = None
    time_block: Optional[TimeBlock] = None
