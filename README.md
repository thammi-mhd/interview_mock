# Intervuo - AI Interview Simulator

> A production-ready AI-powered technical interview simulator with real-time speech recognition, face detection proctoring, and comprehensive AI evaluation.

## Project Overview

**Intervuo** is an advanced AI Interview Simulator designed to help candidates prepare for professional interviews. It conducts real-time, interactive technical and HR interviews using state-of-the-art AI models.

**Why it was built:**
Traditional mock interviews are expensive and hard to schedule. Intervuo democratizes interview preparation by providing an accessible, low-latency, and highly realistic mock interview environment.

**Real-world use case:**
Candidates applying for roles (like Software Engineer, Product Manager, or Data Analyst) can practice answering role-specific questions. The platform records their answers (via text or audio), processes speech in real-time, and provides detailed feedback, scoring, and hiring recommendations from an AI evaluator.

**Main Features:**

- **Role-Specific Interviews**: Dynamic generation of tailored questions for roles like Software Engineer, HR, Marketing, etc.
- **Real-time Speech-to-Text**: Uses a fine-tuned Whisper model for accurate audio transcription, specifically optimized for varied accents.
- **AI Evaluation**: Google Gemini-powered analysis of candidate responses, offering scores, strengths, weaknesses, and improvement suggestions.
- **Proctoring & Security**: Real-time face detection, device health checks (camera, mic, speaker), and robust backend security limits.
- **Secure Authentication**: JWT-based auth with OTP email verification for user registration and password resets.
- **Detailed Dashboards**: Interview history, performance tracking, and detailed session reports.

---

## Tech Stack

### Backend Framework

- **FastAPI** (Python 3.10+) - High-performance asynchronous backend
- **SQLAlchemy** - ORM for database interactions
- **Pydantic** - Data validation and settings management

### Frontend

- **Next.js 14** (App Router) - React framework
- **TailwindCSS** - Utility-first styling
- **Shadcn/UI & Framer Motion** - Accessible components and smooth micro-animations

### Database & Storage

- **PostgreSQL** - Relational database (Supabase integration ready)

### Machine Learning & AI

- **Google Gemini API** (`google-genai`) - LLM for dynamic question generation and response evaluation
- **Whisper** (`transformers`, `librosa`) - Fine-tuned model for Speech-to-Text inference
- **PyTorch** - ML framework running the Whisper inference

### Authentication & Security

- **JWT (JSON Web Tokens)** - Stateless user authentication
- **Bcrypt** - Password hashing
- **SlowAPI** - Rate limiting to prevent abuse
- **SMTP** - Email-based OTP verification

---

## Project Architecture

The project is structured into three main modules: Backend (`app/`), Frontend (`frontend-next/`), and the ML Pipeline (`speech-recognition/`).

```
interview_mock/
│
├── app/                        # FastAPI Backend Logic
│   ├── routes/                 # API Endpoints (auth, user, interview)
│   ├── services/               # Core Business Logic (ai_service, audio_service, etc.)
│   ├── utils/                  # Security, JWT, and Rate Limiting
│   ├── config.py               # Environment & App Configuration
│   ├── database.py             # SQLAlchemy Setup
│   ├── main.py                 # FastAPI Application Entrypoint
│   ├── models.py               # Database Models (SQLAlchemy)
│   └── schemas.py              # Pydantic Validation Schemas
│
├── frontend-next/              # Next.js Frontend Application
│   ├── app/                    # Pages & Routing (Next.js App Router)
│   ├── components/             # Reusable React UI Components
│   ├── lib/                    # Frontend Utilities & API clients
│   └── public/                 # Static Assets
│
├── speech-recognition/         # ML Model Pipeline & Training
│   ├── dataset/                # Dataset generation scripts and raw audio
│   ├── whisper-finetuned/      # Fine-tuned model weights (Ignored in Git if large)
│   ├── setup-dataset.py        # Script to download and prepare audio data
│   ├── train.py                # Whisper fine-tuning script
│   └── test.py                 # Inference testing script
│
├── Dockerfile                  # Backend Docker Configuration
├── docker-compose.yml          # Local orchestration
├── requirements.txt            # Python Dependencies
├── .env.example                # Environment variables template
└── README.md                   # Project Documentation
```

---

## ML Model Pipeline

The Speech-to-Text feature utilizes a **fine-tuned OpenAI Whisper** model to ensure accurate transcription of candidate audio, especially tuned for Indian and Neutral English accents.

### How the Pipeline Works

1. **Data Preprocessing (`setup-dataset.py`)**:
   - Downloads audio datasets (e.g., PolyAI/minds14 for Indian accents, Librispeech for Neutral English).
   - Resamples audio to `16000Hz` and normalizes transcripts.
   - Outputs a clean `transcripts.csv` and segmented `.wav` files into the `dataset/` directory.

2. **Training Process (`train.py`)**:
   - Loads the base `openai/whisper-tiny` model.
   - Extracts input features via `WhisperProcessor` and tokenizes transcripts.
   - Uses `Seq2SeqTrainer` to fine-tune the model with a custom data collator to handle sequence padding.
   - Evaluates performance using the Word Error Rate (WER) metric.

3. **Model Saving & Loading**:
   - The fine-tuned model and processor are saved to `whisper-finetuned/`.
   - The backend service (`app/services/whisper_service.py`) lazy-loads this model into memory (GPU if available, else CPU) upon the first audio request.

4. **Inference Flow (`test.py` & Backend API)**:
   - User submits an audio file (`.wav`, `.mp3`) via the `/submit-answer` endpoint.
   - Backend decodes the audio bytes, processes them into log-Mel spectrograms, and generates text via the `model.generate()` method.
   - The extracted text is then sent to Gemini for AI evaluation.

### Running the ML Pipeline Manually

**Setup Dataset:**

```bash
cd speech-recognition
python setup-dataset.py
```

**Retrain the Model:**

```bash
python train.py
```

**Test Inference:**

```bash
python test.py
```

> **Note on GitHub Visibility**: The ML scripts (`train.py`, `setup-dataset.py`, `test.py`) are fully committed to the repository. To save space, the raw `dataset/` files and the large `whisper-finetuned/` model weights are ignored via `.gitignore`, but the pipeline architecture remains fully reproducible.

---

## API Documentation

Base URL: `/`

### Authentication (`/auth`)

| Endpoint                | Method | Request Body                  | Response                     | Auth Required |
| ----------------------- | ------ | ----------------------------- | ---------------------------- | ------------- |
| `/auth/register`        | `POST` | `{email, username, password}` | `{message, user_id}`         | No            |
| `/auth/verify-otp`      | `POST` | `{email, otp}`                | `{message}`                  | No            |
| `/auth/login`           | `POST` | `{email, password}`           | `{access_token, token_type}` | No            |
| `/auth/forgot-password` | `POST` | `{email}`                     | `{message}`                  | No            |
| `/auth/reset-password`  | `POST` | `{token, new_password}`       | `{message}`                  | No            |

### Interview (`/interview`)

| Endpoint                         | Method | Request Body                                                     | Response                                        | Auth Required |
| -------------------------------- | ------ | ---------------------------------------------------------------- | ----------------------------------------------- | ------------- |
| `/interview/start`               | `POST` | `{role, interview_type, difficulty, duration_minutes}`           | `{session_id, message}`                         | Yes           |
| `/interview/ongoing`             | `GET`  | _None_                                                           | `{session_id, role, has_ongoing}`               | Yes           |
| `/interview/question/{id}/{num}` | `GET`  | _None_                                                           | `{question_text, ...}`                          | Yes           |
| `/interview/submit-answer`       | `POST` | `FormData(session_id, question_number, answer_text, audio_file)` | `{feedback, score}`                             | Yes           |
| `/interview/end/{session_id}`    | `POST` | _None_                                                           | `{total_score, strengths, recommendation, ...}` | Yes           |
| `/interview/history`             | `GET`  | _None_                                                           | `[ {session_id, score, role, ...} ]`            | Yes           |
| `/interview/health-check`        | `POST` | `{camera_detected, microphone_detected, speaker_detected}`       | `{camera_ok, message, ...}`                     | Yes           |

_Error Handling:_ All APIs return structured JSON errors with a `detail` key for 400, 401, 403, 404, and 500 status codes.

---

## Environment Variables

Create a `.env` file in the root directory. Use `.env.example` as a template.

```env
# Database configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/interview_db

# Security
SECRET_KEY=your_secure_random_string_here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Whisper Model Setup
USE_WHISPER_MODEL=true
WHISPER_MODEL_PATH=./speech-recognition/whisper-finetuned

# Email SMTP Setup (For OTP Verification)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
SENDER_EMAIL=your_email@gmail.com

# CORS
CORS_ORIGINS=http://localhost:3000
```

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd interview_mock
```

### 2. Create Virtual Environment & Install Dependencies

```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Setup Database

Ensure PostgreSQL is running locally or use a cloud DB (like Supabase). Update `DATABASE_URL` in `.env`.
_The backend automatically creates tables on startup via SQLAlchemy `create_all()`._

### 4. Start the Backend

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Start the Frontend

Open a new terminal:

```bash
cd frontend-next
npm install
npm run dev
```

The frontend will run on `http://localhost:3000`.

---

## Running the Project

**Local Development**
Run the FastAPI backend on port 8000 and Next.js frontend on port 3000. Ensure both are connected via the `.env` configuration (`FRONTEND_URL` and `CORS_ORIGINS`).

**Docker Setup**
A `docker-compose.yml` is provided for running the complete stack via Docker.

```bash
docker-compose up --build
```

**Production Deployment Notes**

- **Backend**: Configure `Gunicorn` with `uvicorn` workers. Recommended platform: **Render** or AWS ECS. Set `ENVIRONMENT=production`.
- **Frontend**: Deploy directly to **Vercel** with the `frontend-next` root directory.

---

## Workflow

1. **Registration & Auth**: Candidate signs up, verifies email via OTP, and logs in.
2. **Dashboard**: Candidate views past interview history and average scores.
3. **Hardware Check**: Before starting, the system checks the candidate's camera, microphone, and speaker.
4. **Interview Session**:
   - AI generates dynamic questions based on the selected role and difficulty.
   - Candidate records an audio response.
   - Whisper transcribes the audio to text.
   - Gemini evaluates the answer and provides an instant score.
5. **Final Report**: Once finished, a comprehensive dashboard shows the final score, strengths, weaknesses, and a hiring recommendation.

---

## Future Improvements

- [ ] **Video Analysis**: Integrate facial emotion recognition via computer vision.
- [ ] **Code Execution Environment**: Add a sandboxed code editor for technical coding rounds.
- [ ] **ATS Integration**: Allow exporting of candidate reports directly to popular Applicant Tracking Systems.
- [ ] **Custom AI Voices**: Implement realistic Text-to-Speech (TTS) for the interviewer to read questions aloud interactively.

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
