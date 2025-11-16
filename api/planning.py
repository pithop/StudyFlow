"""
Planning logic for generating study schedules
"""
from typing import List
from datetime import datetime, timedelta, time as dt_time
from models import Task, TimeBlock, PlanRequest


def generate_plan(plan_request: PlanRequest) -> List[TimeBlock]:
    """
    Generate a weekly plan with time blocks based on tasks and availability.
    
    Algorithm:
    1. Sort tasks by priority (Exam > TP > TD) and by due date
    2. Distribute tasks across available time slots
    3. Respect daily study hour limits
    4. Create time blocks for each task
    
    Args:
        plan_request: PlanRequest containing tasks, availability, and preferences
    
    Returns:
        List of TimeBlock objects representing the weekly schedule
    """
    time_blocks = []
    
    # Priority mapping for sorting
    priority_order = {
        'urgent': 4,  # Exams
        'high': 3,    # TPs
        'medium': 2,  # TDs
        'low': 1
    }
    
    # Task type priority (Exam > Project > Homework > Reading > Other)
    task_type_order = {
        'exam': 5,
        'project': 4,
        'homework': 3,
        'reading': 2,
        'other': 1
    }
    
    # Sort tasks by priority, task type, and due date
    sorted_tasks = sorted(
        plan_request.tasks,
        key=lambda t: (
            -priority_order.get(t.priority, 0),
            -task_type_order.get(t.task_type, 0),
            t.due_date if t.due_date else datetime.max
        )
    )
    
    # Day mapping
    day_mapping = {
        'monday': 0, 'tuesday': 1, 'wednesday': 2,
        'thursday': 3, 'friday': 4, 'saturday': 5, 'sunday': 6
    }
    
    # Start scheduling from tomorrow
    current_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    
    # Track daily study hours
    daily_hours = {}
    
    for task in sorted_tasks:
        # Skip completed tasks
        if task.status == 'completed':
            continue
        
        # Get task duration in minutes (default 120 minutes = 2 hours)
        duration_minutes = task.estimated_duration or 120
        
        # Find next available slot
        scheduled = False
        for day_offset in range(14):  # Look ahead 2 weeks
            check_date = current_date + timedelta(days=day_offset)
            day_name = check_date.strftime('%A').lower()
            
            # Check if this day is available
            if day_name not in plan_request.availability.days:
                continue
            
            # Check if we haven't exceeded daily study hours
            date_key = check_date.date()
            hours_used = daily_hours.get(date_key, 0)
            
            if hours_used >= plan_request.study_hours_per_day:
                continue
            
            # Calculate start and end times
            avail_start = plan_request.availability.start_time
            avail_end = plan_request.availability.end_time
            
            # Create datetime objects for start and end
            block_start = datetime.combine(check_date.date(), avail_start) + timedelta(hours=hours_used)
            block_end = block_start + timedelta(minutes=duration_minutes)
            
            # Check if block fits within availability
            available_end = datetime.combine(check_date.date(), avail_end)
            if block_end > available_end:
                continue
            
            # Create time block
            time_block = TimeBlock(
                user_id=plan_request.user_id,
                task_id=task.id,
                title=task.title,
                description=f"{task.task_type.capitalize()} - {task.title}",
                start_time=block_start,
                end_time=block_end,
                block_type='study' if task.task_type != 'exam' else 'exam',
                is_completed=False
            )
            
            time_blocks.append(time_block)
            
            # Update daily hours
            daily_hours[date_key] = hours_used + (duration_minutes / 60)
            scheduled = True
            break
    
    return time_blocks
