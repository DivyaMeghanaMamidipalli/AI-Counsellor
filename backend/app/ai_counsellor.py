"""
AI Counsellor endpoint powered by Groq.

Groq provides reasoning + action suggestions.
Backend executes validated actions and returns results.
"""
from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from groq import Groq
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .auth import get_current_user
from .database import get_db
from .models import Profile, Shortlist, Task, University, User
from .stage_logic import get_stage_info, update_user_stage
from .tasks import generate_default_tasks
from .universities import get_recommendations

router = APIRouter(prefix="/ai", tags=["AI Counsellor"])


class CounsellorRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class ActionResult(BaseModel):
    type: str
    status: str
    message: str
    university_id: Optional[int] = None
    task_id: Optional[int] = None


def _build_prompt(
    user_message: str,
    profile: Profile,
    stage_info: Dict[str, Any],
    recommendations: Dict[str, List[Dict[str, Any]]],
    locked_universities: List[Dict[str, Any]],
    shortlisted_universities: List[Dict[str, Any]],
    tasks: List[Dict[str, Any]],
    include_tasks: bool = False,
) -> str:
    profile_details = f"""YOUR PROFILE ANALYSIS:
Education Level: {profile.education_level}
Major: {profile.major}
Target Degree: {profile.target_degree}
Field of Interest: {profile.field}
Academic Score: {profile.academic_score}
Preferred Countries: {', '.join(profile.countries) if profile.countries else 'Not specified'}
Budget Range: {profile.budget_range}
Funding Type: {profile.funding_type}
IELTS Status: {profile.ielts_status}
GRE Status: {profile.gre_status}
SOP Status: {profile.sop_status}

SCORING FACTORS FOR RECOMMENDATIONS:
1. Field Match: +10 points if university offers your target field
2. Budget Fit: +15 points if cost is within your budget range
3. Location Match: +10 points if in your preferred country
4. Academic Match: +5 to +15 points based on your score vs university requirements

UNIVERSITY CATEGORIES:
- Dream Universities: High competition, requires top performance but excellent fit
- Target Universities: Well-matched, balanced opportunity with reasonable effort needed
- Safe Universities: Strong match, high acceptance likelihood"""

    return f"""
You are an AI Counsellor speaking directly to a student planning their study abroad journey.

CRITICAL RULES:
- Always speak DIRECTLY to the user - use "you", "your", "I recommend"
- NEVER say "the user", "the student", or refer to them in 3rd person
- You must NOT invent universities or data - use ONLY provided universities
- You must return VALID JSON only (no markdown or code blocks)
- If unsure, return intent = "general_help" with no actions
- If you say you locked/unlocked/shortlisted something, you MUST include the matching action in the actions array
- ONLY include recommendations when user EXPLICITLY asks for university recommendations or profile analysis
- For general questions, application help, or task-related queries, return empty recommendations {{}}
- NEVER include action execution status messages in your explanation (like "EXECUTED:", "SKIPPED:", "Task created", etc.)
- Let the frontend handle displaying action results - your explanation should only contain conversational content for the user

FOR PROFILE ANALYSIS REQUESTS ONLY:
- Return the top 3-5 universities from each category (Dream/Target/Safe)
- ALWAYS start with: "Since your budget is [user's budget] and your preferred majors are [user's fields], based on these here are my recommendations:"
- Then list the universities with brief reasons
- Use simple filters: "they're in your budget range", "they offer your target field", "they're in your preferred countries"
- Avoid lengthy explanations about calculation methods - just state the match reasons

FOR RECOMMEND UNIVERSITIES REQUESTS ONLY:
- Return the top 3-5 universities from each category (Dream/Target/Safe)
- Say: "Based on your profile, here are universities that match your criteria"
- Briefly state why each is recommended using simple filter reasons
- Group into Dream/Target/Safe categories with brief explanations

FOR "WHY IS THIS RECOMMENDED" REQUESTS:
- Do NOT return full recommendation list
- Only explain the specific university mentioned
- Explain all factors: field match, budget fit, location, academic alignment

FOR APPLICATION HELP:
- Do NOT return recommendations list
- If you have locked universities, guide application steps for those universities
- Show your current tasks and ask targeted questions for new tasks
- If no locked universities, show shortlisted options and ask which to lock

FOR GENERAL QUESTIONS OR CONVERSATIONS:
- Do NOT return recommendations list
- Answer the question directly and conversationally
- Only suggest actions if relevant to the question

WHEN USER ASKS TO SHORTLIST A UNIVERSITY:
- Parse the university name from user message
- Find exact match in the Recommendations list (search by name, case-insensitive)
- Extract the university_id from the matched recommendation
- If university is in recommendations, return shortlist action with correct university_id
- If university name not found in recommendations, explain: "I don't have [University Name] in your recommendations. Please choose from available universities in the Recommendations tab."
- Do NOT invent or guess university_ids

WHEN USER ASKS TO LOCK A UNIVERSITY:
- If they mention a specific shortlisted university, ALWAYS suggest locking it with action type "lock"
- Check the shortlisted universities list and find the matching university_id
- Return the lock action in the actions array

WHEN USER ASKS TO UNLOCK A UNIVERSITY:
- Check if the user's message contains confirmation words: yes, confirm, proceed, unlock it, go ahead, ok, sure, proceed with unlock
- If user is asking to unlock without confirmation: Ask for confirmation first with "Are you sure you want to unlock [University Name]? This will move it back to your shortlist."
- Do NOT include the unlock action in the confirmation request
- If user confirms: Find the locked university in "Your Locked Universities" list by name and extract its university_id
- Then return the unlock action with type="unlock" and the correct university_id
- Treat phrases like "unlock", "remove lock", "remove from locked", "undo lock" as unlock requests
- Unlocking removes the lock, returning it to shortlisted status

WHEN USER ASKS TO REMOVE A UNIVERSITY FROM SHORTLIST:
- Detect removal requests: "remove", "delete", "remove from shortlist", "take off", "unshortlist"
- Do NOT confuse removal with unlocking - removal deletes it completely
- Find the university in "Your Shortlisted Universities (not yet locked)" list by name
- Extract the university_id from the matched entry
- Return the remove action with type="remove" and the correct university_id
- If university is locked, tell user: "I cannot remove [University Name] because it's locked. Please unlock it first, then I can remove it."
- If university is not shortlisted, tell user: "[University Name] is not in your shortlist."

Allowed actions:
- shortlist (requires university_id and category)
- lock (requires university_id) - Use this when user wants to lock a shortlisted university
- unlock (requires university_id) - Use this when user wants to unlock a locked university
- remove (requires university_id) - Use this when user wants to remove a university from shortlist
- create_task (requires title, optional stage)
- update_task (requires task_id and status)
- generate_tasks (no fields)

{profile_details}

Current Stage: {stage_info.get('stage_name', 'Unknown')}

Your Available University Recommendations:
{json.dumps(recommendations)}

Your Locked Universities:
{json.dumps(locked_universities)}

Your Shortlisted Universities (not yet locked):
{json.dumps(shortlisted_universities)}
""" + (f"""
Your Current Tasks:
{json.dumps(tasks)}
""" if include_tasks else "") + f"""
Your Question:
{user_message}

RESPOND IN THIS EXACT JSON FORMAT (NO markdown code blocks, just raw JSON):
{{
    "intent": "recommend_universities|profile_analysis|lock_university|unlock_university|create_tasks|application_help|general_help",
  "explanation": "Your response directly to the student (use you/your, no 3rd person)",
  "recommendations": {{"dream": [], "target": [], "safe": []}},
  "actions": [
    {{"type": "lock", "university_id": 5}},
        {{"type": "unlock", "university_id": 5}},
    {{"type": "create_task", "title": "Draft SOP", "stage": "STAGE_4_APPLICATION"}}
  ]
}}
""".strip()

def _configure_groq_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GROQ_API_KEY not configured"
        )
    return Groq(api_key=api_key)


def _parse_groq_json(response_text: str) -> Dict[str, Any]:
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Groq returned invalid JSON: {response_text[:500]}"
        )


def _build_category_lookup(recommendations: Dict[str, List[Dict[str, Any]]]) -> Dict[int, str]:
    category_lookup: Dict[int, str] = {}
    for category in ("dream", "target", "safe"):
        for uni in recommendations.get(category, []):
            if "id" in uni:
                category_lookup[int(uni["id"])] = category.title()
    return category_lookup


def _get_shortlist_snapshot(db: Session, current_user: User) -> Dict[str, List[Dict[str, Any]]]:
    rows = (
        db.query(Shortlist, University)
        .join(University, Shortlist.university_id == University.id)
        .filter(Shortlist.user_id == current_user.id)
        .all()
    )

    locked: List[Dict[str, Any]] = []
    shortlisted: List[Dict[str, Any]] = []

    for shortlist, university in rows:
        entry = {
            "id": university.id,
            "name": university.name,
            "country": university.country,
            "category": shortlist.category,
            "locked": bool(shortlist.locked),
        }
        if shortlist.locked:
            locked.append(entry)
        else:
            shortlisted.append(entry)

    return {
        "locked": locked,
        "shortlisted": shortlisted,
    }


def _get_tasks_snapshot(db: Session, current_user: User) -> List[Dict[str, Any]]:
    tasks = db.query(Task).filter(Task.user_id == current_user.id).order_by(Task.id).all()
    return [
        {
            "id": task.id,
            "title": task.title,
            "stage": task.stage,
            "status": task.status,
        }
        for task in tasks
    ]


def _execute_action(
    action: Dict[str, Any],
    current_user: User,
    db: Session,
    category_lookup: Dict[int, str],
) -> ActionResult:
    action_type = action.get("type")

    if action_type == "shortlist":
        university_id = action.get("university_id")
        category = action.get("category") or category_lookup.get(int(university_id), "Target")
        if not university_id:
            return ActionResult(type=action_type, status="failed", message="Missing university_id")

        # Validate that university exists
        university = db.query(University).filter(University.id == university_id).first()
        if not university:
            return ActionResult(type=action_type, status="failed", message=f"University with ID {university_id} not found in database", university_id=university_id)

        existing = db.query(Shortlist).filter(
            Shortlist.user_id == current_user.id,
            Shortlist.university_id == university_id
        ).first()

        if existing:
            return ActionResult(type=action_type, status="skipped", message="University already shortlisted", university_id=university_id)

        shortlist = Shortlist(
            user_id=current_user.id,
            university_id=university_id,
            category=category,
            locked=False
        )
        db.add(shortlist)
        db.commit()
        update_user_stage(db, current_user.id)
        return ActionResult(type=action_type, status="executed", message="University shortlisted", university_id=university_id)

    if action_type == "lock":
        university_id = action.get("university_id")
        if not university_id:
            return ActionResult(type=action_type, status="failed", message="Missing university_id")

        shortlist = db.query(Shortlist).filter(
            Shortlist.user_id == current_user.id,
            Shortlist.university_id == university_id
        ).first()

        if not shortlist:
            return ActionResult(type=action_type, status="failed", message="University not shortlisted", university_id=university_id)
        
        # Refresh from DB to get latest state (in case it was modified elsewhere)
        db.refresh(shortlist)
        
        if shortlist.locked:
            return ActionResult(type=action_type, status="skipped", message="University already locked", university_id=university_id)

        shortlist.locked = True
        db.commit()
        db.refresh(shortlist)
        update_user_stage(db, current_user.id)
        return ActionResult(type=action_type, status="executed", message="University locked", university_id=university_id)

    if action_type == "unlock":
        university_id = action.get("university_id")
        if not university_id:
            return ActionResult(type=action_type, status="failed", message="Missing university_id")

        shortlist = db.query(Shortlist).filter(
            Shortlist.user_id == current_user.id,
            Shortlist.university_id == university_id
        ).first()

        if not shortlist:
            return ActionResult(type=action_type, status="failed", message="University not found", university_id=university_id)
        
        # Refresh from DB to get latest state (in case it was modified elsewhere)
        db.refresh(shortlist)
        
        if not shortlist.locked:
            return ActionResult(type=action_type, status="skipped", message="University is not locked", university_id=university_id)

        shortlist.locked = False
        db.commit()
        db.refresh(shortlist)
        update_user_stage(db, current_user.id)
        return ActionResult(type=action_type, status="executed", message="University unlocked", university_id=university_id)

    if action_type == "remove":
        university_id = action.get("university_id")
        if not university_id:
            return ActionResult(type=action_type, status="failed", message="Missing university_id")

        shortlist = db.query(Shortlist).filter(
            Shortlist.user_id == current_user.id,
            Shortlist.university_id == university_id
        ).first()

        if not shortlist:
            return ActionResult(type=action_type, status="failed", message="University not in shortlist", university_id=university_id)
        
        if shortlist.locked:
            return ActionResult(type=action_type, status="failed", message="Cannot remove locked university. Unlock it first.", university_id=university_id)

        db.delete(shortlist)
        db.commit()
        update_user_stage(db, current_user.id)
        return ActionResult(type=action_type, status="executed", message="University removed from shortlist", university_id=university_id)

    if action_type == "create_task":
        title = action.get("title")
        if not title:
            return ActionResult(type=action_type, status="failed", message="Missing task title")

        stage = action.get("stage") or current_user.current_stage
        task = Task(user_id=current_user.id, title=title, stage=stage, status="pending")
        db.add(task)
        db.commit()
        db.refresh(task)
        return ActionResult(type=action_type, status="executed", message="Task created", task_id=task.id)

    if action_type == "generate_tasks":
        result = generate_default_tasks(current_user=current_user, db=db)
        return ActionResult(type=action_type, status="executed", message=result.get("message", "Tasks generated"))

    if action_type == "update_task":
        task_id = action.get("task_id")
        status_value = action.get("status")
        if not task_id:
            return ActionResult(type=action_type, status="failed", message="Missing task_id")
        if status_value not in ("pending", "in_progress", "completed"):
            return ActionResult(type=action_type, status="failed", message="Invalid task status")

        task = db.query(Task).filter(
            Task.id == task_id,
            Task.user_id == current_user.id
        ).first()

        if not task:
            return ActionResult(type=action_type, status="failed", message="Task not found", task_id=task_id)

        task.status = status_value
        db.commit()
        return ActionResult(type=action_type, status="executed", message="Task status updated", task_id=task_id)

    return ActionResult(type=action_type or "unknown", status="failed", message="Unknown action")


@router.post("/counsellor")
def counsellor_chat(
    request: CounsellorRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile not completed. Please complete onboarding first."
        )

    stage_info = get_stage_info(db, current_user.id)
    recommendations = get_recommendations(current_user=current_user, db=db)
    shortlist_snapshot = _get_shortlist_snapshot(db, current_user)
    tasks_snapshot = _get_tasks_snapshot(db, current_user)

    # Detect if user is asking about applications or tasks
    user_message_lower = request.message.lower()
    keywords_for_tasks = ["application", "task", "deadline", "sop", "lor", "ielts", "gre", "essay", "document", "prepare", "checklist", "next step"]
    include_tasks = any(keyword in user_message_lower for keyword in keywords_for_tasks)

    # Only pass tasks if user is asking about applications/tasks
    tasks_to_include = tasks_snapshot if include_tasks else []

    prompt = _build_prompt(
        request.message,
        profile,
        stage_info,
        recommendations,
        shortlist_snapshot["locked"],
        shortlist_snapshot["shortlisted"],
        tasks_to_include,
        include_tasks=include_tasks,
    )
    client = _configure_groq_client()

    model_name = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    fallback_model = "llama-3.1-8b-instant"

    completion = None
    last_error = None

    # Try primary model first
    try:
        completion = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "Return STRICT JSON only. No markdown."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
        )
    except Exception as exc:
        last_error = exc
        # Check if it's a rate limit error
        error_str = str(exc).lower()
        if "rate_limit" in error_str or "429" in error_str:
            # Try fallback model
            try:
                print(f"Rate limit on {model_name}, trying fallback: {fallback_model}")
                completion = client.chat.completions.create(
                    model=fallback_model,
                    messages=[
                        {"role": "system", "content": "Return STRICT JSON only. No markdown."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2,
                )
            except Exception as fallback_exc:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Groq error: Both primary and fallback models failed. Primary: {last_error}, Fallback: {fallback_exc}"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Groq error: {exc}"
            )

    if not completion:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to get response from Groq"
        )

    response_text = completion.choices[0].message.content if completion.choices else ""
    parsed = _parse_groq_json(response_text)
    actions: List[Dict[str, Any]] = parsed.get("actions", []) or []

    category_lookup = _build_category_lookup(recommendations)
    executed_actions: List[ActionResult] = []

    for action in actions:
        executed_actions.append(_execute_action(action, current_user, db, category_lookup))

    refreshed_shortlist = _get_shortlist_snapshot(db, current_user)
    refreshed_tasks = _get_tasks_snapshot(db, current_user)

    # Map recommendation IDs to full university objects
    recommendations_with_names = {}
    for category, items in parsed.get("recommendations", {}).items():
        recommendations_with_names[category] = []
        if items:
            for item in items:
                # Handle both ID (int) and object formats
                if isinstance(item, dict) and "id" in item:
                    # Already a full object, just use it
                    recommendations_with_names[category].append(item)
                elif isinstance(item, int):
                    # Just an ID, look it up
                    uni_data = next((u for u in recommendations.get(category, []) if u["id"] == item), None)
                    if uni_data:
                        recommendations_with_names[category].append(uni_data)

    return {
        "intent": parsed.get("intent"),
        "reply": parsed.get("explanation", ""),
        "recommendations": recommendations_with_names,
        "actions": [a.dict() for a in executed_actions],
        "locked_universities": refreshed_shortlist["locked"],
        "shortlisted_universities": refreshed_shortlist["shortlisted"],
        "tasks": refreshed_tasks,
    }