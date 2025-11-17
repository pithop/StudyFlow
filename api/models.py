"""
Pydantic models for StudyFlow API
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, time
from uuid import UUID


class Task(BaseModel):
    """Task model representing an academic task (matches DB schema)

    Columns: id (UUID), user_id (UUID), title, description, type, priority,
    status, due_date, estimated_duration
    """
    id: Optional[UUID] = None
    user_id: UUID
    course_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    type: str
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_duration: Optional[int] = None
    actual_duration: Optional[int] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Course(BaseModel):
    """Course model representing a user's academic course/subject"""
    id: Optional[UUID] = None
    user_id: UUID
    name: str
    code: Optional[str] = None
    color: Optional[str] = None
    professor: Optional[str] = None
    credits: Optional[int] = None
    semester: Optional[str] = None
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class TimeBlock(BaseModel):
    """Time block model for scheduled study sessions"""
    id: Optional[UUID] = None
    user_id: UUID
    task_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    block_type: str = Field(default="study", pattern="^(study|break|exam|class|other)$")
    is_completed: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Profile(BaseModel):
    """User profile settings"""
    id: UUID
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    timezone: Optional[str] = None
    study_hours_per_day: Optional[int] = None
    preferred_study_start_time: Optional[time] = None
    preferred_study_end_time: Optional[time] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Availability(BaseModel):
    """User availability for planning"""
    # Accept string times to work around curl/JSON issues (e.g. "09:00" or "09:00:00")
    start_time: str
    end_time: str
    days: List[str] = Field(default=["monday", "tuesday", "wednesday", "thursday", "friday"])


class PlanRequest(BaseModel):
    """Request model for generating a weekly plan"""
    user_id: str
    tasks: List[Task]
    # Accept a list of availability objects
    availability: List[Availability]
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


class CoursesResponse(BaseModel):
    """Response listing multiple courses"""
    courses: List[Course]
    count: int


class CourseResponse(BaseModel):
    """Single course response"""
    course: Course


class ProfileResponse(BaseModel):
    profile: Profile


class Document(BaseModel):
    id: Optional[UUID] = None
    user_id: UUID
    course_id: Optional[UUID] = None
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    document_type: Optional[str] = None
    description: Optional[str] = None
    upload_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class DocumentResponse(BaseModel):
    document: Document


class TasksResponse(BaseModel):
    """General tasks list response"""
    tasks: List[Task]
    count: int


# ============================================
# Phase 2: Intelligence & Imports Models
# ============================================

class MoodleSyncRequest(BaseModel):
    """Request model for Moodle synchronization"""
    moodle_url: str
    token: str


class IcsSyncRequest(BaseModel):
    """Request model for ICS calendar synchronization"""
    ics_url: str


class SyncResponse(BaseModel):
    """Response model for sync operations"""
    success: bool
    tasks_created: int
    tasks_updated: int
    time_blocks_created: int
    message: str
