from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional, List


# ============ AUTH SCHEMAS ============
class UserRegister(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("username")
    @classmethod
    def username_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Username cannot be empty")
        return v.strip()


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    name: str
    email: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v):
        if v and len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class verify_otp(BaseModel):
    email: EmailStr
    otp: str


class resend_otp(BaseModel):
    email: EmailStr


# ============ INTERVIEW SCHEMAS ============
class StartInterviewRequest(BaseModel):
    role: str
    interview_type: str = "Technical"   # Technical / HR / Mixed
    difficulty: str = "Medium"          # Easy / Medium / Hard
    duration_minutes: int = 20          # 10 / 20 / 30

    @field_validator("role")
    @classmethod
    def role_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Role cannot be empty")
        return v.strip()

    @field_validator("interview_type")
    @classmethod
    def valid_interview_type(cls, v):
        allowed = ["Technical", "HR", "Mixed"]
        if v not in allowed:
            raise ValueError(f"interview_type must be one of: {allowed}")
        return v

    @field_validator("difficulty")
    @classmethod
    def valid_difficulty(cls, v):
        allowed = ["Easy", "Medium", "Hard"]
        if v not in allowed:
            raise ValueError(f"difficulty must be one of: {allowed}")
        return v

    @field_validator("duration_minutes")
    @classmethod
    def valid_duration(cls, v):
        if v not in [10, 20, 30]:
            raise ValueError("duration_minutes must be 10, 20, or 30")
        return v


class SubmitAnswerRequest(BaseModel):
    session_id: int
    question_number: int
    answer: str = Field(..., min_length=10, max_length=5000)

    @field_validator("answer")
    @classmethod
    def answer_min_length(cls, v):
        if len(v.strip()) < 10:
            raise ValueError("Answer must be at least 10 characters")
        return v.strip()


class QuestionResponse(BaseModel):
    session_id: int
    question_number: int
    question: str
    total_questions: int


class AnswerEvaluation(BaseModel):
    score: int
    feedback: str


# ============ DEVICE CHECK SCHEMAS ============
class HealthCheckRequest(BaseModel):
    camera_detected: bool
    microphone_detected: bool
    speaker_detected: bool


class AudioTestRequest(BaseModel):
    audio_level: float  # 0-1 scale


class SubmitAnswerAudioRequest(BaseModel):
    session_id: int
    question_number: int
    # For audio file submission
    is_audio_file: bool = False
    # For text answer
    answer_text: Optional[str] = None


class DeviceCheckResponse(BaseModel):
    camera_ok: bool
    microphone_ok: bool
    speaker_ok: bool
    message: str


class InterviewAnswer(BaseModel):
    question: str
    user_answer: str
    score: int
    feedback: str


class InterviewReport(BaseModel):
    total_score: int
    average_score: float
    answers_count: int
    strengths: List[str]
    weaknesses: List[str]
    overall_assessment: str
    hiring_recommendation: str
    improvement_suggestions: List[str]
    answers: List[InterviewAnswer]


class InterviewHistoryItem(BaseModel):
    session_id: int
    role: str
    status: str
    total_score: Optional[int]
    total_questions: int
    answered_questions: int
    started_at: datetime
    ended_at: Optional[datetime]


class InterviewDetails(BaseModel):
    session_id: int
    role: str
    status: str
    total_score: Optional[int]
    started_at: datetime
    ended_at: Optional[datetime]
    questions: List[dict]


# ============ PRE-INTERVIEW CHECK ============
class AudioTestResponse(BaseModel):
    success: bool
    message: str
    audio_quality_score: float
