from .database import Base
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

def utc_now():
    """Return current UTC datetime"""
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    otp = Column(String, nullable=True)
    otp_expiration = Column(DateTime, nullable=True)
    
    # Password reset
    reset_token = Column(String, nullable=True, unique=True)
    reset_token_expiration = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    
    # Relationships
    interview_sessions = relationship("InterviewSession", back_populates="user")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String, nullable=False)  # e.g., "Python Developer", "Frontend Developer"
    interview_type = Column(String, default="Technical", nullable=False)  # Technical, HR, Mixed
    difficulty = Column(String, default="Medium", nullable=False)  # Easy, Medium, Hard
    status = Column(String, default="ongoing")  # ongoing, completed
    total_score = Column(Integer, nullable=True, default=0)
    duration_minutes = Column(Integer, nullable=True, default=20)
    
    # Report fields
    strengths = Column(Text, nullable=True)  # JSON array as string
    weaknesses = Column(Text, nullable=True)  # JSON array as string
    improvement_suggestions = Column(Text, nullable=True)  # JSON array as string
    overall_assessment = Column(Text, nullable=True)
    hiring_recommendation = Column(String, nullable=True)  # Yes/No/Maybe
    
    started_at = Column(DateTime, default=utc_now)
    ended_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=utc_now)
    
    # Relationships
    user = relationship("User", back_populates="interview_sessions")
    questions = relationship("InterviewQuestion", back_populates="session")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False, index=True)
    question_number = Column(Integer, nullable=False)
    question = Column(Text, nullable=False)
    user_answer = Column(Text, nullable=True)
    score = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
    
    answered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    # Relationships
    session = relationship("InterviewSession", back_populates="questions")