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
    
    # Pattern for French month names
    french_months = {
        'janvier': 1, 'février': 2, 'fevrier': 2, 'mars': 3, 'avril': 4,
        'mai': 5, 'juin': 6, 'juillet': 7, 'août': 8, 'aout': 8,
        'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12, 'decembre': 12
    }
    
    # Pattern for task types: TP, TD, Exam, Homework, etc.
    task_patterns = [
        # TP/TD with date: "TP 1 - Due: 2025-01-15" or "TP 1 pour le 2025-01-15"
        r'(TP|TD)\s+(\d+)\s*[-:]?\s*(?:Due|pour le|deadline)?\s*:?\s*(\d{4}-\d{2}-\d{2})',
        # Exam with date: "Exam - Date: 2025-01-20" or "Examen le 2025-01-20"
        r'(Exam|Examen)\s*(?:on|le|-)?\s*:?\s*(?:Date)?\s*:?\s*(\d{4}-\d{2}-\d{2})',
        # General homework: "Homework X - Due: 2025-01-10"
        r'(Homework|Devoir)\s+(\d+)?\s*[-:]?\s*(?:Due|pour le)?\s*:?\s*(\d{4}-\d{2}-\d{2})',
        # French dates with descriptions: "20 novembre 2025: Examen partiel"
        r'[-•*]\s*(\d{1,2}(?:er)?)\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(\d{4})\s*[:：]\s*(.+?)(?:\n|$)',
    ]
    
    for pattern in task_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            groups = match.groups()
            
            # Check if this is a French date pattern (4 groups: day, month, year, description)
            if len(groups) == 4 and groups[1].lower() in french_months:
                # French date format: "20 novembre 2025: Examen partiel"
                day = int(groups[0].replace('er', ''))
                month = french_months[groups[1].lower()]
                year = int(groups[2])
                description = groups[3].strip()
                
                # Determine task type from description
                desc_lower = description.lower()
                if 'examen' in desc_lower or 'exam' in desc_lower:
                    task_type = 'exam'
                    priority = 'urgent'
                elif 'projet' in desc_lower or 'project' in desc_lower:
                    task_type = 'project'
                    priority = 'high'
                elif 'remise' in desc_lower or 'rendu' in desc_lower or 'présentation' in desc_lower:
                    task_type = 'project'
                    priority = 'high'
                else:
                    task_type = 'other'
                    priority = 'medium'
                
                try:
                    due_date = datetime(year, month, day, 9, 0)  # Default to 9 AM
                except ValueError:
                    continue
                
                task = Task(
                    user_id=user_id,
                    title=description,
                    type=task_type,
                    priority=priority,
                    status='todo',
                    due_date=due_date,
                    estimated_duration=120
                )
                tasks.append(task)
                continue
            
            # Original patterns (TP, TD, Exam with ISO dates)
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
                type=task_type,
                priority=priority,
                status='todo',
                due_date=due_date,
                estimated_duration=120  # Default 2 hours
            )
            tasks.append(task)
    
    return tasks


async def extract_tasks_with_llm(text: str, user_id: str) -> List[Task]:
    """
    Extract tasks from text using OpenRouter LLM (free models available).
    More intelligent than regex-based parsing.
    """
    import requests
    import json
    import os
    from datetime import datetime
    
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
    if not openrouter_api_key:
        print("Warning: OPENROUTER_API_KEY not configured, falling back to regex parsing")
        return parse_tasks_from_text(text, user_id)
    
    prompt = f"""You are an academic task extraction assistant. Extract all academic tasks, deadlines, exams, and assignments from the following text.

Text to analyze:
{text}

Return a JSON array of tasks with this structure:
[
  {{
    "title": "Task title",
    "type": "homework|exam|project|quiz|tp|td",
    "priority": "low|medium|high|urgent",
    "due_date": "YYYY-MM-DDTHH:MM:SS",
    "estimated_duration": minutes (integer)
  }}
]

Rules:
- Extract ALL tasks, even if dates are implicit or relative
- If no date is found, use null for due_date
- Estimate duration based on task type (exam=180, TP=120, TD=90, homework=60, quiz=30)
- Determine priority based on urgency and task type (exams=urgent, projects=high, homework=medium, quiz=low)
- Task types: homework (devoirs), exam (examen), project (projet), quiz (interrogation), tp (travaux pratiques), td (travaux dirigés)
- Output ONLY valid JSON, no explanations

Return the JSON array now:"""

    try:
        # Use OpenRouter API (supports free models)
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {openrouter_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "google/gemini-2.0-flash-exp:free",  # Free Google Gemini model
                "messages": [
                    {"role": "system", "content": "You are a precise academic task extraction assistant. You always return valid JSON arrays."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 1500
            },
            timeout=30
        )
        
        response.raise_for_status()
        data = response.json()
        content = data['choices'][0]['message']['content'].strip()
        
        # Parse JSON response
        tasks_data = json.loads(content)
        
        # Convert to Task objects
        tasks = []
        for task_dict in tasks_data:
            due_date = None
            if task_dict.get('due_date'):
                try:
                    due_date = datetime.fromisoformat(task_dict['due_date'])
                except:
                    pass
            
            task = Task(
                user_id=user_id,
                title=task_dict.get('title', 'Untitled Task'),
                type=task_dict.get('type', 'homework'),
                priority=task_dict.get('priority', 'medium'),
                status='todo',
                due_date=due_date,
                estimated_duration=task_dict.get('estimated_duration', 60)
            )
            tasks.append(task)
        
        return tasks
    
    except Exception as e:
        print(f"LLM extraction error: {e}")
        # Fallback to regex-based parsing
        return parse_tasks_from_text(text, user_id)
