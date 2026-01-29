"""
Universities related endpoints and logic
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional, Tuple
import re

from .database import get_db
from .models import University, Profile, Shortlist, User
from .auth import get_current_user
from .schemas import ShortlistRequest, UniversityResponse, LockUniversityRequest
from .stage_logic import update_user_stage, get_stage_info
from .constants import FIELD_CATEGORIES, MAJOR_TO_FIELDS

router = APIRouter(prefix="/universities", tags=["Universities"])


@router.get("/options")
def get_options(db: Session = Depends(get_db)):
    """
    Get available options for onboarding selections
    
    Returns field options from actual universities in database, plus other predefined options
    """
    from .constants import (
        COUNTRY_OPTIONS, EDUCATION_LEVELS, BUDGET_RANGES, FUNDING_TYPES, EXAM_STATUSES
    )
    
    # Extract unique fields from universities in database
    universities = db.query(University).all()
    field_set = set()
    for uni in universities:
        if uni.fields:
            field_set.update(uni.fields)
    
    available_fields = sorted(list(field_set))
    
    # Remove "Business" if it exists
    available_fields = [f for f in available_fields if "business" not in f.lower()]
    
    # Fallback if database is empty - provide hardcoded options
    if not available_fields:
        available_fields = [
            "Computer Science / IT",
            "Data Science / Analytics",
            "Engineering"
        ]
    
    return {
        "field_options": available_fields,
        "country_options": COUNTRY_OPTIONS,
        "education_levels": EDUCATION_LEVELS,
        "budget_ranges": BUDGET_RANGES,
        "funding_types": FUNDING_TYPES,
        "exam_statuses": EXAM_STATUSES
    }


@router.get("/field-map")
def get_field_map():
    """
    Get mapping of major to related fields for cascading dropdowns
    """
    return MAJOR_TO_FIELDS


def normalize_text(value: Optional[str]) -> str:
    if not value:
        return ""
    return " ".join(value.lower().strip().split())


def normalize_field(value: Optional[str]) -> str:
    if not value:
        return ""
    cleaned = re.sub(r"[^a-z0-9]+", " ", value.lower())
    return " ".join(cleaned.split())


def parse_budget_range(budget_range: Optional[str]) -> Tuple[Optional[int], Optional[int]]:
    if not budget_range:
        return None, None

    values = [int(v) for v in re.findall(r"\d+", budget_range)]
    if "-" in budget_range and len(values) >= 2:
        return values[0], values[1]
    if "+" in budget_range and len(values) >= 1:
        return values[0], None
    if len(values) == 1:
        return 0, values[0]
    return None, None


def get_funding_tolerance(funding_type: Optional[str]) -> int:
    if funding_type and "loan" in funding_type.lower():
        return 5000
    return 0


def field_match_bonus(profile: Profile, uni: University) -> int:
    """Award bonus points if university has the student's target field"""
    if not uni.fields or not profile.field:
        return 0
    
    # Get field keywords
    field_keywords = FIELD_CATEGORIES.get(profile.field, [])
    if not field_keywords:
        # Fallback to old normalization logic
        normalized_target = normalize_field(profile.field)
        for uni_field in uni.fields:
            if normalized_target in normalize_field(uni_field) or normalize_field(uni_field) in normalized_target:
                return 10
        return 0
    
    # Check if university offers keywords related to student's field
    normalized_keywords = [normalize_field(kw) for kw in field_keywords]
    for uni_field in uni.fields:
        normalized_uni = normalize_field(uni_field)
        for keyword in normalized_keywords:
            if keyword in normalized_uni or normalized_uni in keyword:
                return 10
    
    return 0


def field_matches(profile: Profile, uni: University) -> bool:
    """Check if university matches student's field preferences"""
    if not uni.fields:
        return True

    # Get all potential fields for this student's major
    candidate_fields = []
    
    # Add target field
    if profile.field:
        candidate_fields.append(profile.field)
    
    # Add related fields from major
    if profile.major and profile.major in MAJOR_TO_FIELDS:
        candidate_fields.extend(MAJOR_TO_FIELDS[profile.major])
    
    # Get all keywords for candidate fields
    all_keywords = []
    for field in candidate_fields:
        all_keywords.extend(FIELD_CATEGORIES.get(field, [field]))
    
    # Normalize keywords
    normalized_keywords = [normalize_field(kw) for kw in all_keywords if kw]
    
    if not normalized_keywords:
        return True

    # Check if university offers any of these fields
    for uni_field in uni.fields:
        normalized_uni = normalize_field(uni_field)
        for keyword in normalized_keywords:
            if keyword and (keyword in normalized_uni or normalized_uni in keyword):
                return True
    
    return False


def country_matches(profile: Profile, uni: University) -> bool:
    if not profile.countries:
        return True
    normalized_countries = {normalize_text(c) for c in profile.countries if c}
    return normalize_text(uni.country) in normalized_countries


def academic_points(academic_score: Optional[str]) -> int:
    if not academic_score:
        return 25
    normalized = academic_score.strip().lower()
    if normalized in {"high", "strong", "excellent"}:
        return 40
    if normalized in {"medium", "average"}:
        return 25
    if normalized in {"low", "weak"}:
        return 10

    try:
        value = float(re.sub(r"[^0-9.]", "", academic_score))
    except ValueError:
        return 25

    if value >= 85:
        return 40
    if value >= 70:
        return 25
    return 10


def status_points(status: Optional[str], completed_points: int = 10, scheduled_points: int = 5) -> int:
    if not status:
        return 0
    normalized = status.strip().lower()
    if normalized in {"completed", "done", "ready"}:
        return completed_points
    if normalized in {"scheduled", "planned", "in progress"}:
        return scheduled_points
    return 0


def sop_points(status: Optional[str]) -> int:
    if not status:
        return 0
    normalized = status.strip().lower()
    if normalized in {"ready", "completed"}:
        return 10
    if normalized in {"draft"}:
        return 5
    return 0


def budget_points(avg_cost: int, min_budget: Optional[int], max_budget: Optional[int], tolerance: int) -> int:
    if max_budget is None:
        return 20
    min_budget_value = min_budget or 0
    if avg_cost <= min_budget_value:
        return 30
    if avg_cost <= max_budget:
        return 20
    if avg_cost <= max_budget + tolerance:
        return 10
    return 0


def cost_fit_label(avg_cost: int, min_budget: Optional[int], max_budget: Optional[int], tolerance: int) -> str:
    if max_budget is None:
        return "Unknown"
    min_budget_value = min_budget or 0
    if avg_cost <= min_budget_value:
        return "Comfortable"
    if avg_cost <= max_budget:
        return "Manageable"
    if avg_cost <= max_budget + tolerance:
        return "Stretch"
    return "Over budget"


def acceptance_likelihood(score: int) -> str:
    if score >= 70:
        return "High"
    if score >= 50:
        return "Medium"
    return "Low"


def risk_level(acceptance: str, cost_fit: str) -> str:
    if cost_fit == "Over budget" or acceptance == "Low":
        return "High"
    if acceptance == "High" and cost_fit in {"Comfortable", "Manageable"}:
        return "Low"
    return "Medium"


def category_label(acceptance: str, cost_fit: str) -> str:
    if acceptance == "Low" or cost_fit in {"Stretch", "Over budget"}:
        return "Dream"
    if acceptance == "High" and cost_fit in {"Comfortable", "Manageable"}:
        return "Safe"
    return "Target"


def build_university_card(uni: University, profile: Profile, category_override: Optional[str] = None) -> dict:
    min_budget, max_budget = parse_budget_range(profile.budget_range)
    tolerance = get_funding_tolerance(profile.funding_type)

    score = (
        academic_points(profile.academic_score)
        + budget_points(uni.avg_cost, min_budget, max_budget, tolerance)
        + status_points(profile.ielts_status)
        + status_points(profile.gre_status)
        + sop_points(profile.sop_status)
        + field_match_bonus(profile, uni)
    )

    cost_fit = cost_fit_label(uni.avg_cost, min_budget, max_budget, tolerance)
    acceptance = acceptance_likelihood(score)
    risk = risk_level(acceptance, cost_fit)
    category = category_override or category_label(acceptance, cost_fit)

    return {
        "id": uni.id,
        "name": uni.name,
        "country": uni.country,
        "avg_cost": uni.avg_cost,
        "fields": uni.fields,
        "cost_fit": cost_fit,
        "risk_level": risk,
        "acceptance_likelihood": acceptance,
        "category": category
    }


@router.get("/recommendations")
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get university recommendations based on user profile
    
    Filters by country preference, field match, and budget range,
    then derives acceptance likelihood, risk level, and category.
    """
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile not completed. Please complete onboarding first."
        )

    universities = db.query(University).all()

    dream = []
    target = []
    safe = []

    min_budget, max_budget = parse_budget_range(profile.budget_range)
    tolerance = get_funding_tolerance(profile.funding_type)

    for uni in universities:
        if not country_matches(profile, uni):
            continue
        if not field_matches(profile, uni):
            continue

        if max_budget is not None and uni.avg_cost > max_budget + tolerance:
            continue

        card = build_university_card(uni, profile)
        if card["category"] == "Dream":
            dream.append(card)
        elif card["category"] == "Safe":
            safe.append(card)
        else:
            target.append(card)

    return {
        "dream": dream,
        "target": target,
        "safe": safe
    }


@router.post("/shortlist")
def shortlist_university(
    request: ShortlistRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Shortlist a university
    
    Creates a shortlist entry and updates user stage
    """
    # Check if user completed onboarding
    if not current_user.onboarding_completed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please complete onboarding before shortlisting universities"
        )
    
    # Check if university exists
    university = db.query(University).filter(
        University.id == request.university_id
    ).first()
    
    if not university:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University not found"
        )
    
    # Check if already shortlisted
    existing = db.query(Shortlist).filter(
        Shortlist.user_id == current_user.id,
        Shortlist.university_id == request.university_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="University already shortlisted"
        )

    # Create shortlist entry
    shortlist = Shortlist(
        user_id=current_user.id,
        university_id=request.university_id,
        category=request.category,
        locked=False
    )

    db.add(shortlist)
    db.commit()
    db.refresh(shortlist)
    
    # CRITICAL: Update user stage after shortlisting
    new_stage = update_user_stage(db, current_user.id)

    return {
        "message": "University shortlisted successfully",
        "university_id": request.university_id,
        "university_name": university.name,
        "category": request.category,
        "new_stage": new_stage
    }


@router.get("/shortlisted")
def get_shortlisted_universities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all shortlisted universities for the current user
    
    Returns list with university details and lock status
    """
    shortlists = db.query(Shortlist).filter(
        Shortlist.user_id == current_user.id
    ).all()

    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    
    result = []
    for shortlist in shortlists:
        university = db.query(University).filter(
            University.id == shortlist.university_id
        ).first()
        
        if university:
            if profile:
                card = build_university_card(university, profile, category_override=shortlist.category)
            else:
                card = {
                    "id": university.id,
                    "name": university.name,
                    "country": university.country,
                    "avg_cost": university.avg_cost,
                    "fields": university.fields,
                    "category": shortlist.category,
                    "cost_fit": None,
                    "risk_level": None,
                    "acceptance_likelihood": None
                }

            card["locked"] = shortlist.locked
            result.append(card)
    
    return {
        "shortlisted_universities": result,
        "total_count": len(result),
        "locked_count": sum(1 for s in shortlists if s.locked)
    }


@router.post("/lock")
def lock_university(
    request: LockUniversityRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lock a shortlisted university (commitment step)
    
    This is a CRITICAL step that:
    - Commits user to a specific university
    - Unlocks application guidance stage
    - Updates user stage to STAGE_4_APPLICATION
    """
    # Get the shortlist entry
    shortlist = db.query(Shortlist).filter(
        and_(
            Shortlist.user_id == current_user.id,
            Shortlist.university_id == request.university_id
        )
    ).first()
    
    if not shortlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University not in your shortlist. Please shortlist it first."
        )
    
    if shortlist.locked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="University is already locked"
        )
    
    # Lock the university
    shortlist.locked = True
    db.commit()
    db.refresh(shortlist)
    
    # CRITICAL: Update user stage (should move to STAGE_4_APPLICATION)
    new_stage = update_user_stage(db, current_user.id)
    
    # Get university details
    university = db.query(University).filter(
        University.id == request.university_id
    ).first()
    
    return {
        "message": f"University locked successfully! You are now committed to {university.name}.",
        "university_id": request.university_id,
        "university_name": university.name,
        "locked": True,
        "new_stage": new_stage,
        "stage_name": "Preparing Applications"
    }


@router.post("/unlock")
def unlock_university(
    request: LockUniversityRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unlock a locked university (with warning)
    
    Allows user to reconsider their commitment, but warns them.
    This may move them back to STAGE_3_LOCKING if no other universities are locked.
    """
    # Get the shortlist entry
    shortlist = db.query(Shortlist).filter(
        and_(
            Shortlist.user_id == current_user.id,
            Shortlist.university_id == request.university_id
        )
    ).first()
    
    if not shortlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University not in your shortlist"
        )
    
    if not shortlist.locked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="University is not locked"
        )
    
    # Unlock the university
    shortlist.locked = False
    db.commit()
    db.refresh(shortlist)
    
    # CRITICAL: Update user stage (may move back to STAGE_3_LOCKING)
    new_stage = update_user_stage(db, current_user.id)
    
    # Get university details
    university = db.query(University).filter(
        University.id == request.university_id
    ).first()
    
    # Check if user has any other locked universities
    other_locked = db.query(Shortlist).filter(
        and_(
            Shortlist.user_id == current_user.id,
            Shortlist.locked == True
        )
    ).count()
    
    warning = None
    if other_locked == 0:
        warning = "You have no locked universities. Please lock at least one to proceed with applications."
    
    return {
        "message": f"University unlocked: {university.name}",
        "university_id": request.university_id,
        "university_name": university.name,
        "locked": False,
        "new_stage": new_stage,
        "warning": warning
    }


@router.get("/locked")
def get_locked_universities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all locked universities for the current user
    
    These are the universities user has committed to
    """
    locked_shortlists = db.query(Shortlist).filter(
        and_(
            Shortlist.user_id == current_user.id,
            Shortlist.locked == True
        )
    ).all()

    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    
    result = []
    for shortlist in locked_shortlists:
        university = db.query(University).filter(
            University.id == shortlist.university_id
        ).first()
        
        if university:
            if profile:
                card = build_university_card(university, profile, category_override=shortlist.category)
            else:
                card = {
                    "id": university.id,
                    "name": university.name,
                    "country": university.country,
                    "avg_cost": university.avg_cost,
                    "fields": university.fields,
                    "category": shortlist.category,
                    "cost_fit": None,
                    "risk_level": None,
                    "acceptance_likelihood": None
                }

            card["locked"] = True
            result.append(card)
    
    return {
        "locked_universities": result,
        "count": len(result)
    }


@router.delete("/shortlist/{university_id}")
def remove_from_shortlist(
    university_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a university from shortlist
    
    Cannot remove if university is locked - must unlock first
    """
    # Get the shortlist entry
    shortlist = db.query(Shortlist).filter(
        and_(
            Shortlist.user_id == current_user.id,
            Shortlist.university_id == university_id
        )
    ).first()
    
    if not shortlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University not in your shortlist"
        )
    
    if shortlist.locked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove locked university. Please unlock it first."
        )
    
    # Delete shortlist entry
    db.delete(shortlist)
    db.commit()
    
    # CRITICAL: Update user stage
    new_stage = update_user_stage(db, current_user.id)
    
    return {
        "message": "University removed from shortlist",
        "university_id": university_id,
        "new_stage": new_stage
    }