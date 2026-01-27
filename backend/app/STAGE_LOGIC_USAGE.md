# Stage Logic Usage Guide

## 🎯 Overview

The `stage_logic.py` module handles all stage calculation and management. **Frontend should NEVER decide stage** - it only displays what the backend provides.

## 📋 Stage Progression

1. **STAGE_1_PROFILE** - Building Profile (onboarding not completed)
2. **STAGE_2_DISCOVERY** - Discovering Universities (no universities shortlisted)
3. **STAGE_3_LOCKING** - Finalizing Universities (universities shortlisted, none locked)
4. **STAGE_4_APPLICATION** - Preparing Applications (at least one university locked)

## 🔄 When to Recalculate Stage

Stage **MUST** be recalculated and updated in the database on:

1. ✅ **Onboarding completion** - When user finishes onboarding
2. ✅ **University shortlisting** - When user shortlists a university
3. ✅ **University locking** - When user locks a university
4. ✅ **University unlocking** - When user unlocks a university

## 💻 Usage Examples

### Example 1: After Onboarding Completion

```python
from sqlalchemy.orm import Session
from .models import User
from .stage_logic import update_user_stage

def complete_onboarding(db: Session, user_id: uuid.UUID):
    # Mark onboarding as completed
    user = db.query(User).filter(User.id == user_id).first()
    user.onboarding_completed = True
    db.commit()
    
    # CRITICAL: Recalculate and update stage
    new_stage = update_user_stage(db, user_id)
    
    return {"message": "Onboarding completed", "stage": new_stage}
```

### Example 2: After Shortlisting University

```python
from .models import Shortlist
from .stage_logic import update_user_stage

def shortlist_university(db: Session, user_id: uuid.UUID, university_id: int):
    # Create shortlist entry
    shortlist = Shortlist(
        user_id=user_id,
        university_id=university_id,
        category="Target",
        locked=False
    )
    db.add(shortlist)
    db.commit()
    
    # CRITICAL: Recalculate and update stage
    new_stage = update_user_stage(db, user_id)
    
    return {"message": "University shortlisted", "stage": new_stage}
```

### Example 3: After Locking University

```python
from .models import Shortlist
from .stage_logic import update_user_stage

def lock_university(db: Session, user_id: uuid.UUID, university_id: int):
    # Lock the university
    shortlist = db.query(Shortlist).filter(
        Shortlist.user_id == user_id,
        Shortlist.university_id == university_id
    ).first()
    
    shortlist.locked = True
    db.commit()
    
    # CRITICAL: Recalculate and update stage
    new_stage = update_user_stage(db, user_id)
    
    return {"message": "University locked", "stage": new_stage}
```

### Example 4: Get Current Stage (for API response)

```python
from .stage_logic import get_stage_info

@app.get("/api/user/stage")
def get_user_stage(user_id: uuid.UUID, db: Session = Depends(get_db)):
    stage_info = get_stage_info(db, user_id)
    
    return {
        "current_stage": stage_info["current_stage"],
        "stage_name": stage_info["stage_name"],
        "progress": {
            "onboarding_completed": stage_info["onboarding_completed"],
            "shortlist_count": stage_info["shortlist_count"],
            "locked_count": stage_info["locked_count"]
        }
    }
```

### Example 5: Check Stage Access (for route protection)

```python
from .stage_logic import calculate_stage, can_access_stage

@app.get("/api/universities")
def get_universities(user_id: uuid.UUID, db: Session = Depends(get_db)):
    # Calculate current stage
    current_stage = calculate_stage(db, user_id)
    
    # Check if user can access this endpoint
    if not can_access_stage(current_stage, STAGE_2_DISCOVERY):
        raise HTTPException(
            status_code=403,
            detail="Complete onboarding first"
        )
    
    # Proceed with university listing
    # ...
```

## 🔍 Available Functions

### Core Functions

- `calculate_stage(db, user_id)` - Calculate stage without updating DB
- `update_user_stage(db, user_id)` - Calculate and update stage in DB
- `get_user_stage(db, user_id)` - Get stored stage from DB
- `get_stage_info(db, user_id)` - Get comprehensive stage information

### Helper Functions

- `can_access_stage(user_stage, required_stage)` - Check stage access
- `get_next_stage(current_stage)` - Get next stage
- `get_previous_stage(current_stage)` - Get previous stage
- `is_in_profile_stage(db, user_id)` - Check if in profile stage
- `is_in_discovery_stage(db, user_id)` - Check if in discovery stage
- `is_in_locking_stage(db, user_id)` - Check if in locking stage
- `is_in_application_stage(db, user_id)` - Check if in application stage
- `has_completed_onboarding(db, user_id)` - Check onboarding status
- `has_shortlisted_universities(db, user_id)` - Check shortlist status
- `has_locked_universities(db, user_id)` - Check lock status

## ⚠️ Important Rules

1. **NEVER** let frontend calculate or decide stage
2. **ALWAYS** call `update_user_stage()` after:
   - Onboarding completion
   - Shortlisting/unshortlisting
   - Locking/unlocking universities
3. **ALWAYS** use `calculate_stage()` or `get_stage_info()` to get current stage
4. **NEVER** trust the stored `current_stage` field - always recalculate when needed

## 🧪 Testing Stage Logic

```python
# Test stage calculation
def test_stage_calculation():
    # User with no onboarding
    assert calculate_stage(db, user_id) == STAGE_1_PROFILE
    
    # Complete onboarding
    user.onboarding_completed = True
    assert calculate_stage(db, user_id) == STAGE_2_DISCOVERY
    
    # Shortlist university
    create_shortlist(user_id, university_id)
    assert calculate_stage(db, user_id) == STAGE_3_LOCKING
    
    # Lock university
    lock_university(user_id, university_id)
    assert calculate_stage(db, user_id) == STAGE_4_APPLICATION
```

## 📊 Stage Constants

```python
STAGE_1_PROFILE = "STAGE_1_PROFILE"
STAGE_2_DISCOVERY = "STAGE_2_DISCOVERY"
STAGE_3_LOCKING = "STAGE_3_LOCKING"
STAGE_4_APPLICATION = "STAGE_4_APPLICATION"
```

## 🎯 Integration Checklist

When building your routes, ensure:

- [ ] Onboarding route calls `update_user_stage()` after completion
- [ ] Shortlist route calls `update_user_stage()` after shortlisting
- [ ] Lock route calls `update_user_stage()` after locking
- [ ] Unlock route calls `update_user_stage()` after unlocking
- [ ] All routes that need stage info use `calculate_stage()` or `get_stage_info()`
- [ ] Frontend only displays stage, never calculates it
