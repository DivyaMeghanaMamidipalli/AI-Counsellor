"""
AI Counsellor endpoint powered by Gemini.

Gemini provides reasoning + action suggestions.
Backend executes validated actions and returns results.
"""
from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

from google import genai
from fastapi import APIRouter, Depends, HTTPException, status
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
) -> str:
    return f"""
You are an AI Counsellor for a study-abroad platform.

Rules:
- You must NOT invent universities or data.
- You must ONLY use the data provided.
- You must return VALID JSON only (no markdown).

Allowed actions:
- shortlist (requires university_id and category)
- lock (requires university_id)
- create_task (requires title, optional stage)
- generate_tasks (no fields)

User stage: {stage_info.get('stage', 'UNKNOWN')}
Stage name: {stage_info.get('stage_name', 'Unknown')}

User profile (sanitized):
{json.dumps({
  "education_level": profile.education_level,
  "major": profile.major,
  "academic_score": profile.academic_score,
  "target_degree": profile.target_degree,
  "field": profile.field,
  "countries": profile.countries,
  "budget_range": profile.budget_range,
  "funding_type": profile.funding_type,
  "ielts_status": profile.ielts_status,
  "gre_status": profile.gre_status,
  "sop_status": profile.sop_status,
})}

Available university recommendations (use only these):
{json.dumps(recommendations)}

User message:
{user_message}

Return JSON in this exact format:
{{
  "intent": "recommend_universities|shortlist_university|lock_university|create_tasks|general_help",
  "explanation": "...",
  "recommendations": {{"dream": [ids], "target": [ids], "safe": [ids]}},
  "actions": [
    {{"type": "shortlist", "university_id": 1, "category": "Dream"}},
    {{"type": "lock", "university_id": 1}},
    {{"type": "create_task", "title": "Draft SOP", "stage": "STAGE_4_APPLICATION"}},
    {{"type": "generate_tasks"}}
  ]
}}
""".strip()


def _configure_gemini_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY is not configured on the server."
        )
    return genai.Client(api_key=api_key)


def _model_supports_generate(model: Any) -> bool:
    for attr_name in ("supported_generation_methods", "supported_actions", "supported_methods"):
        methods = getattr(model, attr_name, None)
        if methods and any("generateContent" in str(m) for m in methods):
            return True
    return False


def _select_model(client: genai.Client) -> str:
    env_model = os.getenv("GEMINI_MODEL")
    candidates = [m for m in [env_model, "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"] if m]

    for candidate in candidates:
        try:
            client.models.get(model=candidate)
            return candidate
        except Exception:
            continue

    try:
        models = list(client.models.list())
        for model in models:
            if _model_supports_generate(model):
                name = getattr(model, "name", None) or getattr(model, "model", None)
                if name:
                    return name
    except Exception:
        pass

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="No Gemini model available for generateContent. Configure GEMINI_MODEL to a valid model name."
    )


def _parse_gemini_json(response_text: str) -> Dict[str, Any]:
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gemini returned invalid JSON."
        )


def _build_category_lookup(recommendations: Dict[str, List[Dict[str, Any]]]) -> Dict[int, str]:
    category_lookup: Dict[int, str] = {}
    for category in ("dream", "target", "safe"):
        for uni in recommendations.get(category, []):
            if "id" in uni:
                category_lookup[int(uni["id"])] = category.title()
    return category_lookup


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
        if shortlist.locked:
            return ActionResult(type=action_type, status="skipped", message="University already locked", university_id=university_id)

        shortlist.locked = True
        db.commit()
        update_user_stage(db, current_user.id)
        return ActionResult(type=action_type, status="executed", message="University locked", university_id=university_id)

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

    prompt = _build_prompt(request.message, profile, stage_info, recommendations)
    client = _configure_gemini_client()
    model_name = _select_model(client)

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config={
                "temperature": 0.2,
                "response_mime_type": "application/json"
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini model error: {exc}"
        )

    parsed = _parse_gemini_json(response.text)
    actions: List[Dict[str, Any]] = parsed.get("actions", []) or []

    category_lookup = _build_category_lookup(recommendations)
    executed_actions: List[ActionResult] = []

    for action in actions:
        executed_actions.append(_execute_action(action, current_user, db, category_lookup))

    return {
        "intent": parsed.get("intent"),
        "reply": parsed.get("explanation", ""),
        "recommendations": parsed.get("recommendations"),
        "actions": [a.dict() for a in executed_actions]
    }