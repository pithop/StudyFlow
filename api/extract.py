"""
Extract tasks and deadlines from text/PDF content
"""
import re
from typing import List
from datetime import datetime, timedelta
from models import Task


def parse_tasks_from_text(text: str, user_id: str = "demo") -> List[Task]:
    """
    Parse tasks from text content extracted from PDF or other sources.
    
    This function looks for patterns like:
    - "TP X - Due: YYYY-MM-DD" or "TP X pour le YYYY-MM-DD"
    - "Exam - Date: YYYY-MM-DD"
    - "TD X - Deadline: YYYY-MM-DD"
    
    Args:
        text: The text content to parse
        user_id: The user ID to associate with tasks
    
    Returns:
        List of Task objects parsed from the text
    """
    tasks = []
    
    # Pattern for task types: TP, TD, Exam, Homework, etc.
    task_patterns = [
        # TP/TD with date: "TP 1 - Due: 2025-01-15" or "TP 1 pour le 2025-01-15"
        r'(TP|TD)\s+(\d+)\s*[-:]?\s*(?:Due|pour le|deadline)?\s*:?\s*(\d{4}-\d{2}-\d{2})',
        # Exam with date: "Exam - Date: 2025-01-20" or "Examen le 2025-01-20"
        r'(Exam|Examen)\s*(?:on|le|-)?\s*:?\s*(?:Date)?\s*:?\s*(\d{4}-\d{2}-\d{2})',
        # General homework: "Homework X - Due: 2025-01-10"
        r'(Homework|Devoir)\s+(\d+)?\s*[-:]?\s*(?:Due|pour le)?\s*:?\s*(\d{4}-\d{2}-\d{2})',
    ]
    
    for pattern in task_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            groups = match.groups()
            
            # Determine task type and title
            if groups[0].upper() in ['TP']:
                task_type = 'homework'
                title = f"TP {groups[1]}" if len(groups) > 1 and groups[1] else "TP"
                priority = 'high'
            elif groups[0].upper() in ['TD']:
                task_type = 'homework'
                title = f"TD {groups[1]}" if len(groups) > 1 and groups[1] else "TD"
                priority = 'medium'
            elif groups[0].upper() in ['EXAM', 'EXAMEN']:
                task_type = 'exam'
                title = "Exam"
                priority = 'urgent'
            else:
                task_type = 'homework'
                title = f"{groups[0]} {groups[1]}" if len(groups) > 1 and groups[1] else groups[0]
                priority = 'medium'
            
            # Extract date (last group is always the date)
            date_str = groups[-1]
            try:
                due_date = datetime.fromisoformat(date_str)
            except ValueError:
                continue
            
            # Create task
            task = Task(
                user_id=user_id,
                title=title,
                task_type=task_type,
                priority=priority,
                status='todo',
                due_date=due_date,
                estimated_duration=120  # Default 2 hours
            )
            tasks.append(task)
    
    return tasks
