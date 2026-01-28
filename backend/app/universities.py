"""
Universities related endpoints and logic
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from .database import get_db
from .models import University, Profile, Shortlist, User
from .auth import get_current_user
from .schemas import ShortlistRequest, UniversityResponse, LockUniversityRequest
from .stage_logic import update_user_stage, get_stage_info

router = APIRouter(prefix="/universities", tags=["Universities"])


def serialize_university(uni: University):
    """Helper function to serialize university object"""
    return {
        "id": uni.id,
        "name": uni.name,
        "country": uni.country,
        "avg_cost": uni.avg_cost,
        "difficulty": uni.difficulty,
        "fields": uni.fields
    }


@router.get("/recommendations")
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get university recommendations based on user profile
    
    Returns categorized universities: Dream, Target, Safe
    
    Categorization logic:
    - Dream: Universities with cost > user's budget (high difficulty to afford)
    - Target: Universities with cost close to user's budget (medium difficulty)
    - Safe: Universities with cost < user's budget (safe/affordable)
    """
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile not completed. Please complete onboarding first."
        )

    # Get all universities
    universities = db.query(University).all()

    dream = []
    target = []
    safe = []

    # Parse budget range to get max budget
    budget_max = 50000  # default
    if profile.budget_range:
        # Budget ranges are like "0-30000", "30000-50000", "50000+"
        if "30000-50000" in profile.budget_range:
            budget_max = 50000
        elif "0-30000" in profile.budget_range:
            budget_max = 30000
        elif "50000" in profile.budget_range:
            budget_max = 100000

    for uni in universities:
        # Categorize by cost relative to user's budget
        if uni.avg_cost > budget_max * 1.2:  # More than 20% above budget = Dream
            dream.append(uni)
        elif uni.avg_cost > budget_max * 0.8:  # Within 80-120% of budget = Target
            target.append(uni)
        else:  # Less than 80% of budget = Safe
            safe.append(uni)

    return {
        "dream": [serialize_university(u) for u in dream],
        "target": [serialize_university(u) for u in target],
        "safe": [serialize_university(u) for u in safe]
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
    
    result = []
    for shortlist in shortlists:
        university = db.query(University).filter(
            University.id == shortlist.university_id
        ).first()
        
        if university:
            result.append({
                "id": university.id,
                "name": university.name,
                "country": university.country,
                "avg_cost": university.avg_cost,
                "difficulty": university.difficulty,
                "fields": university.fields,
                "category": shortlist.category,
                "locked": shortlist.locked
            })
    
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
    
    result = []
    for shortlist in locked_shortlists:
        university = db.query(University).filter(
            University.id == shortlist.university_id
        ).first()
        
        if university:
            result.append({
                "id": university.id,
                "name": university.name,
                "country": university.country,
                "avg_cost": university.avg_cost,
                "difficulty": university.difficulty,
                "fields": university.fields,
                "category": shortlist.category,
                "locked": True
            })
    
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