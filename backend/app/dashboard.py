"""
Dashboard endpoint - returns user's complete status
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .models import User, Profile, Task, Shortlist, University
from .schemas import DashboardResponse, ProfileSummary, StageInfo, TaskInfo, ShortlistedUniversity
from .auth import get_current_user
from .stage_logic import get_stage_info, STAGE_NAMES

router = APIRouter()


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user dashboard data
    
    Returns:
    - profile: User's profile information
    - stage: Current stage and progress
    - tasks: User's tasks
    - shortlisted_universities: User's shortlisted universities
    """
    # Get profile
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    
    profile_summary = None
    if profile:
        profile_summary = ProfileSummary(
            education_level=profile.education_level,
            major=profile.major,
            graduation_year=profile.graduation_year,
            academic_score=profile.academic_score,
            target_degree=profile.target_degree,
            field=profile.field,
            intake_year=profile.intake_year,
            countries=profile.countries,
            budget_range=profile.budget_range,
            funding_type=profile.funding_type,
            ielts_status=profile.ielts_status,
            gre_status=profile.gre_status,
            sop_status=profile.sop_status
        )
    
    # Get stage info
    stage_info_dict = get_stage_info(db, current_user.id)
    stage_info = StageInfo(
        current_stage=stage_info_dict["current_stage"],
        stage_name=stage_info_dict["stage_name"],
        onboarding_completed=stage_info_dict["onboarding_completed"],
        shortlist_count=stage_info_dict["shortlist_count"],
        locked_count=stage_info_dict["locked_count"]
    )
    
    # Get tasks
    tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    task_list = [
        TaskInfo(
            id=task.id,
            title=task.title,
            stage=task.stage,
            status=task.status
        )
        for task in tasks
    ]
    
    # Get shortlisted universities with university details
    shortlists = db.query(Shortlist).filter(
        Shortlist.user_id == current_user.id
    ).all()
    
    shortlisted_universities = []
    for shortlist in shortlists:
        university = db.query(University).filter(
            University.id == shortlist.university_id
        ).first()
        
        if university:
            shortlisted_universities.append(
                ShortlistedUniversity(
                    university_id=university.id,
                    university_name=university.name or "Unknown",
                    country=university.country or "Unknown",
                    category=shortlist.category or "Target",
                    locked=shortlist.locked
                )
            )
    
    return DashboardResponse(
        profile=profile_summary,
        stage=stage_info,
        tasks=task_list,
        shortlisted_universities=shortlisted_universities
    )
