# Stage Logic - Quick Summary

## ✅ What Was Created

**File:** `backend/app/stage_logic.py`

A complete stage management system that:
- Calculates user stage based on progress
- Updates stage in database automatically
- Provides helper functions for stage checks
- Ensures frontend never decides stage

## 🎯 Core Function: `update_user_stage()`

**Use this function after any action that might change stage:**

```python
from .stage_logic import update_user_stage

# After onboarding completion
update_user_stage(db, user_id)

# After shortlisting university
update_user_stage(db, user_id)

# After locking university
update_user_stage(db, user_id)

# After unlocking university
update_user_stage(db, user_id)
```

## 📋 Stage Flow

```
STAGE_1_PROFILE
    ↓ (complete onboarding)
STAGE_2_DISCOVERY
    ↓ (shortlist university)
STAGE_3_LOCKING
    ↓ (lock university)
STAGE_4_APPLICATION
```

## 🔧 Integration Points

You need to call `update_user_stage()` in:

1. **onboarding.py** - After marking onboarding as complete
2. **universities.py** - After shortlisting/unshortlisting
3. **universities.py** - After locking/unlocking

## 📊 Example Response for Frontend

```json
{
  "current_stage": "STAGE_2_DISCOVERY",
  "stage_name": "Discovering Universities",
  "progress": {
    "onboarding_completed": true,
    "shortlist_count": 0,
    "locked_count": 0
  }
}
```

## ⚠️ Critical Rules

1. ✅ Backend calculates stage
2. ✅ Backend updates stage after key actions
3. ✅ Frontend only displays stage
4. ❌ Frontend never calculates stage

---

**See `STAGE_LOGIC_USAGE.md` for detailed examples and API reference.**
