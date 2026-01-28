"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
import uuid


# ============================================
# AUTH SCHEMAS
# ============================================

class SignupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str
    email: str


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6, max_length=100)


# ============================================
# ONBOARDING SCHEMAS
# ============================================

class OnboardingRequest(BaseModel):
    # Academic Background
    education_level: Optional[str] = None
    major: Optional[str] = None
    graduation_year: Optional[int] = None
    academic_score: Optional[str] = None  # GPA or percentage
    
    # Study Goals
    target_degree: Optional[str] = None
    field: Optional[str] = None
    intake_year: Optional[int] = None
    countries: Optional[List[str]] = None  # Array of preferred countries
    
    # Budget
    budget_range: Optional[str] = None
    funding_type: Optional[str] = None
    
    # Exams & Readiness
    ielts_status: Optional[str] = None
    gre_status: Optional[str] = None
    sop_status: Optional[str] = None


class OnboardingResponse(BaseModel):
    message: str
    onboarding_completed: bool
    current_stage: str
    stage_name: str


# ============================================
# DASHBOARD SCHEMAS
# ============================================

class ProfileSummary(BaseModel):
    education_level: Optional[str] = None
    major: Optional[str] = None
    graduation_year: Optional[int] = None
    academic_score: Optional[str] = None
    target_degree: Optional[str] = None
    field: Optional[str] = None
    intake_year: Optional[int] = None
    countries: Optional[List[str]] = None
    budget_range: Optional[str] = None
    funding_type: Optional[str] = None
    ielts_status: Optional[str] = None
    gre_status: Optional[str] = None
    sop_status: Optional[str] = None


class StageInfo(BaseModel):
    current_stage: str
    stage_name: str
    onboarding_completed: bool
    shortlist_count: int
    locked_count: int


class TaskInfo(BaseModel):
    id: int
    title: str
    stage: Optional[str] = None
    status: str


class ShortlistedUniversity(BaseModel):
    university_id: int
    university_name: str
    country: str
    category: str  # Dream / Target / Safe
    locked: bool


class DashboardResponse(BaseModel):
    profile: Optional[ProfileSummary] = None
    stage: StageInfo
    tasks: List[TaskInfo]
    shortlisted_universities: List[ShortlistedUniversity]


# ============================================
# USER SCHEMAS
# ============================================

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    onboarding_completed: bool
    current_stage: str


# ============================================
# UNIVERSITY SCHEMAS
# ============================================

class ShortlistRequest(BaseModel):
    university_id: int
    category: str = Field(..., pattern="^(Dream|Target|Safe)$")  # Must be one of these


class LockUniversityRequest(BaseModel):
    university_id: int


class UniversityResponse(BaseModel):
    id: int
    name: str
    country: str
    avg_cost: int
    difficulty: str
    fields: List[str]


# ============================================
# TASK SCHEMAS
# ============================================

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    stage: Optional[str] = None  # If not provided, uses user's current stage


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    status: Optional[str] = Field(None, pattern="^(pending|in_progress|completed)$")


class TaskResponse(BaseModel):
    id: int
    title: str
    stage: Optional[str] = None
    stage_name: str
    status: str

    class Config:
        from_attributes = True