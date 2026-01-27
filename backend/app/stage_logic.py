"""
Stage logic for application workflow

CRITICAL: Backend always calculates and updates stage.
Frontend should NEVER decide stage - it only displays what backend provides.

Stage progression:
- STAGE_1_PROFILE: Onboarding not completed
- STAGE_2_DISCOVERY: Onboarding completed, no universities shortlisted
- STAGE_3_LOCKING: Universities shortlisted, but none locked
- STAGE_4_APPLICATION: At least one university is locked

Stage is recalculated on:
- Onboarding completion
- University shortlisting
- University locking
- University unlocking
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional
import uuid
from .models import User, Shortlist


# Stage constants
STAGE_1_PROFILE = "STAGE_1_PROFILE"
STAGE_2_DISCOVERY = "STAGE_2_DISCOVERY"
STAGE_3_LOCKING = "STAGE_3_LOCKING"
STAGE_4_APPLICATION = "STAGE_4_APPLICATION"

# Stage display names (for frontend)
STAGE_NAMES = {
    STAGE_1_PROFILE: "Building Profile",
    STAGE_2_DISCOVERY: "Discovering Universities",
    STAGE_3_LOCKING: "Finalizing Universities",
    STAGE_4_APPLICATION: "Preparing Applications"
}

# All valid stages
VALID_STAGES = [
    STAGE_1_PROFILE,
    STAGE_2_DISCOVERY,
    STAGE_3_LOCKING,
    STAGE_4_APPLICATION
]


def calculate_stage(db: Session, user_id: uuid.UUID) -> str:
    """
    Calculate the current stage for a user based on their progress.
    
    Logic:
    1. If onboarding not completed → STAGE_1_PROFILE
    2. If no universities shortlisted → STAGE_2_DISCOVERY
    3. If no university locked → STAGE_3_LOCKING
    4. If at least one university locked → STAGE_4_APPLICATION
    
    Args:
        db: Database session
        user_id: User UUID
        
    Returns:
        Current stage string
    """
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise ValueError(f"User with id {user_id} not found")
    
    # Stage 1: Onboarding not completed
    if not user.onboarding_completed:
        return STAGE_1_PROFILE
    
    # Check if user has any shortlisted universities
    shortlist_count = db.query(Shortlist).filter(
        Shortlist.user_id == user_id
    ).count()
    
    # Stage 2: No universities shortlisted
    if shortlist_count == 0:
        return STAGE_2_DISCOVERY
    
    # Check if user has any locked universities
    locked_count = db.query(Shortlist).filter(
        and_(
            Shortlist.user_id == user_id,
            Shortlist.locked == True
        )
    ).count()
    
    # Stage 3: Universities shortlisted but none locked
    if locked_count == 0:
        return STAGE_3_LOCKING
    
    # Stage 4: At least one university is locked
    return STAGE_4_APPLICATION


def update_user_stage(db: Session, user_id: uuid.UUID, commit: bool = True) -> str:
    """
    Calculate and update the user's stage in the database.
    
    This function:
    1. Calculates the current stage
    2. Updates the user's current_stage field
    3. Commits the change (if commit=True)
    
    Args:
        db: Database session
        user_id: User UUID
        commit: Whether to commit the transaction (default: True)
        
    Returns:
        The new stage string
    """
    # Calculate new stage
    new_stage = calculate_stage(db, user_id)
    
    # Get user and update stage
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise ValueError(f"User with id {user_id} not found")
    
    # Update stage
    old_stage = user.current_stage
    user.current_stage = new_stage
    
    # Commit if requested
    if commit:
        db.commit()
        db.refresh(user)
    
    # Log stage change (optional, for debugging)
    if old_stage != new_stage:
        print(f"User {user_id}: Stage changed from {old_stage} to {new_stage}")
    
    return new_stage


def get_user_stage(db: Session, user_id: uuid.UUID) -> Optional[str]:
    """
    Get the current stage for a user from the database.
    
    Note: This returns the stored stage. Use calculate_stage() to recalculate.
    
    Args:
        db: Database session
        user_id: User UUID
        
    Returns:
        Current stage string or None if user not found
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        return None
    
    return user.current_stage


def get_stage_info(db: Session, user_id: uuid.UUID) -> dict:
    """
    Get comprehensive stage information for a user.
    
    Returns:
        Dictionary with:
        - current_stage: Current stage string
        - stage_name: Human-readable stage name
        - calculated_stage: Recalculated stage (may differ from stored)
        - needs_update: Whether stored stage needs updating
        - onboarding_completed: Boolean
        - shortlist_count: Number of shortlisted universities
        - locked_count: Number of locked universities
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise ValueError(f"User with id {user_id} not found")
    
    # Get counts
    shortlist_count = db.query(Shortlist).filter(
        Shortlist.user_id == user_id
    ).count()
    
    locked_count = db.query(Shortlist).filter(
        and_(
            Shortlist.user_id == user_id,
            Shortlist.locked == True
        )
    ).count()
    
    # Calculate what stage should be
    calculated_stage = calculate_stage(db, user_id)
    
    # Check if update needed
    needs_update = user.current_stage != calculated_stage
    
    return {
        "current_stage": user.current_stage,
        "stage_name": STAGE_NAMES.get(user.current_stage, "Unknown"),
        "calculated_stage": calculated_stage,
        "needs_update": needs_update,
        "onboarding_completed": user.onboarding_completed,
        "shortlist_count": shortlist_count,
        "locked_count": locked_count
    }


def can_access_stage(user_stage: str, required_stage: str) -> bool:
    """
    Check if user can access a specific stage.
    
    Users can only access their current stage or previous stages.
    They cannot skip ahead.
    
    Args:
        user_stage: User's current stage
        required_stage: Stage they want to access
        
    Returns:
        True if access allowed, False otherwise
    """
    if user_stage not in VALID_STAGES or required_stage not in VALID_STAGES:
        return False
    
    # Get stage indices
    user_index = VALID_STAGES.index(user_stage)
    required_index = VALID_STAGES.index(required_stage)
    
    # User can access current stage or any previous stage
    return required_index <= user_index


def get_next_stage(current_stage: str) -> Optional[str]:
    """
    Get the next stage in the progression.
    
    Args:
        current_stage: Current stage string
        
    Returns:
        Next stage string or None if already at final stage
    """
    if current_stage not in VALID_STAGES:
        return None
    
    current_index = VALID_STAGES.index(current_stage)
    
    if current_index >= len(VALID_STAGES) - 1:
        return None
    
    return VALID_STAGES[current_index + 1]


def get_previous_stage(current_stage: str) -> Optional[str]:
    """
    Get the previous stage in the progression.
    
    Args:
        current_stage: Current stage string
        
    Returns:
        Previous stage string or None if already at first stage
    """
    if current_stage not in VALID_STAGES:
        return None
    
    current_index = VALID_STAGES.index(current_stage)
    
    if current_index <= 0:
        return None
    
    return VALID_STAGES[current_index - 1]


# Convenience functions for checking stage conditions

def is_in_profile_stage(db: Session, user_id: uuid.UUID) -> bool:
    """Check if user is in profile building stage"""
    stage = calculate_stage(db, user_id)
    return stage == STAGE_1_PROFILE


def is_in_discovery_stage(db: Session, user_id: uuid.UUID) -> bool:
    """Check if user is in university discovery stage"""
    stage = calculate_stage(db, user_id)
    return stage == STAGE_2_DISCOVERY


def is_in_locking_stage(db: Session, user_id: uuid.UUID) -> bool:
    """Check if user is in university locking stage"""
    stage = calculate_stage(db, user_id)
    return stage == STAGE_3_LOCKING


def is_in_application_stage(db: Session, user_id: uuid.UUID) -> bool:
    """Check if user is in application preparation stage"""
    stage = calculate_stage(db, user_id)
    return stage == STAGE_4_APPLICATION


def has_completed_onboarding(db: Session, user_id: uuid.UUID) -> bool:
    """Check if user has completed onboarding"""
    user = db.query(User).filter(User.id == user_id).first()
    return user.onboarding_completed if user else False


def has_shortlisted_universities(db: Session, user_id: uuid.UUID) -> bool:
    """Check if user has shortlisted any universities"""
    count = db.query(Shortlist).filter(Shortlist.user_id == user_id).count()
    return count > 0


def has_locked_universities(db: Session, user_id: uuid.UUID) -> bool:
    """Check if user has locked any universities"""
    count = db.query(Shortlist).filter(
        and_(
            Shortlist.user_id == user_id,
            Shortlist.locked == True
        )
    ).count()
    return count > 0
