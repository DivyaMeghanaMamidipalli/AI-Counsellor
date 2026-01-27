"""
Database models matching the Supabase schema exactly
"""
from sqlalchemy import Column, Integer, Boolean, Text, ARRAY, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .database import Base


class User(Base):
    """User model"""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    email = Column(Text, nullable=False, unique=True)
    password = Column(Text, nullable=False)
    onboarding_completed = Column(Boolean, default=False)
    current_stage = Column(Text, default="STAGE_1_PROFILE")

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False)
    shortlists = relationship("Shortlist", back_populates="user")
    tasks = relationship("Task", back_populates="user")


class Profile(Base):
    """User profile model - stores onboarding data"""
    __tablename__ = "profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    
    # Academic Background
    education_level = Column(Text)
    major = Column(Text)
    graduation_year = Column(Integer)
    academic_score = Column(Text)  # GPA or percentage
    
    # Study Goals
    target_degree = Column(Text)
    field = Column(Text)
    intake_year = Column(Integer)
    countries = Column(ARRAY(Text))  # Array of preferred countries
    
    # Budget
    budget_range = Column(Text)
    funding_type = Column(Text)
    
    # Exams & Readiness
    ielts_status = Column(Text)
    gre_status = Column(Text)
    sop_status = Column(Text)

    # Relationships
    user = relationship("User", back_populates="profile")


class University(Base):
    """University model"""
    __tablename__ = "universities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text)
    country = Column(Text)
    avg_cost = Column(Integer)
    difficulty = Column(Text)  # "Low" / "Medium" / "High"
    fields = Column(ARRAY(Text))  # Array of fields/degrees offered

    # Relationships
    shortlists = relationship("Shortlist", back_populates="university")


class Shortlist(Base):
    """User's shortlisted universities"""
    __tablename__ = "shortlists"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    university_id = Column(Integer, ForeignKey("universities.id", ondelete="CASCADE"), primary_key=True)
    category = Column(Text)  # "Dream" / "Target" / "Safe"
    locked = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="shortlists")
    university = relationship("University", back_populates="shortlists")


class Task(Base):
    """Task model for AI-generated and user tasks"""
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(Text)
    stage = Column(Text)  # "STAGE_1_PROFILE" / "STAGE_2_DISCOVERY" / etc.
    status = Column(Text, default="pending")  # "pending" / "in_progress" / "completed"

    # Relationships
    user = relationship("User", back_populates="tasks")
