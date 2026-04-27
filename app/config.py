import os
from dotenv import load_dotenv

load_dotenv()

# Environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_PRODUCTION = ENVIRONMENT == "production"

# Database
DATABASE_URL = os.getenv("DATABASE_URL")

# JWT
_secret = os.getenv("SECRET_KEY")
if not _secret:
    import warnings
    warnings.warn("SECRET_KEY not set! Using insecure default. Set it in .env")
SECRET_KEY = _secret or "bzbbhbdchbdcbsbldljcbllBLDBBLSJBNHBHbhbdhbhsk"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Email
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", EMAIL_USER)

# OTP
OTP_EXPIRY_MINUTES = 10
OTP_LENGTH = 6

# Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Speech-to-Text (Whisper Model)
USE_WHISPER_MODEL = os.getenv("USE_WHISPER_MODEL", "true").lower() == "true"
WHISPER_MODEL_PATH = os.getenv("WHISPER_MODEL_PATH", "./speech-recognition/whisper-finetuned")

# Interview
INTERVIEW_QUESTIONS_COUNT = 10
QUESTION_TIME_LIMIT_SECONDS = 120

# Rate Limiting
RATE_LIMIT_REGISTER = "5/minute"
RATE_LIMIT_LOGIN = "10/minute"
RATE_LIMIT_OTP = "5/minute"
RATE_LIMIT_INTERVIEW = "20/hour"

# Security
PASSWORD_MIN_LENGTH = 8

# CORS — in production, reads from env var so Vercel URL can be injected
# Set on Render as: CORS_ORIGINS=https://your-app.vercel.app
# Multiple origins: CORS_ORIGINS=https://your-app.vercel.app,https://custom-domain.com
_cors_default = "http://localhost:3000" if not IS_PRODUCTION else ""
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", _cors_default).split(",")
    if origin.strip()
]

# Frontend URL (used in email links — e.g. verification emails)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")