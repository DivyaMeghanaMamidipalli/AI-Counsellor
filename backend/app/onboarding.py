"""
Onboarding related endpoints and logic
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .database import get_db
from .models import User, Profile
from .schemas import OnboardingRequest, OnboardingResponse
from .auth import get_current_user
from .stage_logic import update_user_stage, get_stage_info, STAGE_NAMES

router = APIRouter()


@router.post("/onboarding", response_model=OnboardingResponse)
def complete_onboarding(
    request: OnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Complete user onboarding
    
    Saves profile data, marks onboarding as completed, and recalculates stage
    """
    # Check if onboarding already completed
    if current_user.onboarding_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Onboarding already completed"
        )
    
    # Create or update profile
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    
    if profile:
        # Update existing profile
        profile.education_level = request.education_level
        profile.major = request.major
        profile.graduation_year = request.graduation_year
        profile.academic_score = request.academic_score
        profile.target_degree = request.target_degree
        profile.field = request.field
        profile.intake_year = request.intake_year
        profile.countries = request.countries
        profile.budget_range = request.budget_range
        profile.funding_type = request.funding_type
        profile.ielts_status = request.ielts_status
        profile.gre_status = request.gre_status
        profile.sop_status = request.sop_status
    else:
        # Create new profile
        profile = Profile(
            user_id=current_user.id,
            education_level=request.education_level,
            major=request.major,
            graduation_year=request.graduation_year,
            academic_score=request.academic_score,
            target_degree=request.target_degree,
            field=request.field,
            intake_year=request.intake_year,
            countries=request.countries,
            budget_range=request.budget_range,
            funding_type=request.funding_type,
            ielts_status=request.ielts_status,
            gre_status=request.gre_status,
            sop_status=request.sop_status
        )
        db.add(profile)
    
    # Mark onboarding as completed
    current_user.onboarding_completed = True
    db.commit()
    
    # CRITICAL: Recalculate and update stage
    new_stage = update_user_stage(db, current_user.id)
    
    # Get stage info for response
    stage_info = get_stage_info(db, current_user.id)
    
    return OnboardingResponse(
        message="Onboarding completed successfully",
        onboarding_completed=True,
        current_stage=new_stage,
        stage_name=STAGE_NAMES.get(new_stage, "Unknown")
    )


@router.get("/onboarding/status")
def get_onboarding_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get onboarding status and profile data
    """
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    
    return {
        "onboarding_completed": current_user.onboarding_completed,
        "has_profile": profile is not None,
        "profile": {
            "education_level": profile.education_level if profile else None,
            "major": profile.major if profile else None,
            "target_degree": profile.target_degree if profile else None,
            "field": profile.field if profile else None,
        } if profile else None
    }
