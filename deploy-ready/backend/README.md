# Intervuo — Backend API

AI-powered mock interview platform backend built with **FastAPI**, **SQLAlchemy**, and **Google Gemini AI**.

## 🛠 Tech Stack

- **Framework:** FastAPI + Uvicorn + Gunicorn
- **Database:** PostgreSQL (Supabase)
- **AI:** Google Gemini API
- **Auth:** JWT (python-jose) + bcrypt
- **Email:** Gmail SMTP with OTP verification
- **Rate Limiting:** SlowAPI

## 📁 Project Structure

```
app/
├── __init__.py
├── main.py              # FastAPI app entry point
├── config.py            # Environment variables & settings
├── database.py          # SQLAlchemy engine & session
├── models.py            # Database models (User, InterviewSession, InterviewQuestion)
├── schemas.py           # Pydantic request/response schemas
├── routes/
│   ├── __init__.py
│   ├── auth.py          # POST /auth/register, /auth/login, /auth/verify-otp, etc.
│   └── interview.py     # POST /interview/start, GET /interview/question, etc.
├── services/
│   ├── __init__.py
│   ├── ai_service.py        # Gemini AI prompt engineering
│   ├── audio_service.py      # Audio processing
│   ├── auth_service.py       # Authentication logic
│   ├── email.py              # Email sending (OTP, verification)
│   └── interview_service.py  # Interview session management
└── utils/
    ├── jwt.py           # JWT token creation/validation
    └── security.py      # Rate limiter, password hashing
```

## 🚀 Deploy to Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repo
4. Render auto-detects `render.yaml` — it will configure everything
5. Set environment variables in Render Dashboard (see `.env.example`)
6. Deploy!

### Environment Variables (set on Render Dashboard)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `SECRET_KEY` | Random 32+ char string for JWT signing |
| `GEMINI_API_KEY` | Google Gemini API key |
| `EMAIL_USER` | Gmail address for sending emails |
| `EMAIL_PASSWORD` | Gmail App Password |
| `SENDER_EMAIL` | Sender email address |
| `CORS_ORIGINS` | Frontend URL (e.g., `https://intervuo.vercel.app`) |
| `FRONTEND_URL` | Frontend URL for email links |
| `ENVIRONMENT` | Set to `production` |

## 💻 Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Run development server
uvicorn app.main:app --reload --port 8000
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/verify-otp` | Verify email OTP |
| `POST` | `/auth/login` | Login |
| `POST` | `/auth/resend-otp` | Resend verification OTP |
| `GET` | `/interview/roles` | Get available roles |
| `POST` | `/interview/start` | Start interview session |
| `GET` | `/interview/question/{session_id}/{q_num}` | Get question |
| `POST` | `/interview/submit-answer` | Submit answer |
| `POST` | `/interview/end/{session_id}` | End interview |
| `GET` | `/interview/history` | Get user's interview history |
| `GET` | `/interview/details/{session_id}` | Get interview details |

## 📄 License

Private project — All rights reserved.
