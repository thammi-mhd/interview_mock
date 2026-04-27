from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form
from app.database import get_db
from app.utils.jwt import get_current_user
from app.utils.security import limiter
from app.schemas import (
    StartInterviewRequest, SubmitAnswerRequest, HealthCheckRequest,
    AudioTestRequest, SubmitAnswerAudioRequest, DeviceCheckResponse
)
from app.services.interview_service import (
    start_interview, get_next_question, submit_answer,
    end_interview, get_interview_history, get_interview_details,
)
from app.services.ai_service import get_interview_questions, VALID_ROLES
from app.services.audio_service import extract_text_from_audio
from app.services.whisper_service import get_model_info

router = APIRouter()


@router.get("/roles")
async def list_roles():
    """List all supported interview roles."""
    return {"roles": VALID_ROLES}


@router.get("/model-status")
async def get_model_status():
    """Get status of the speech recognition model."""
    try:
        model_info = get_model_info()
        return {
            "status": "ready" if model_info.get("model_loaded") else "not_loaded",
            "model_info": model_info
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


@router.get("/ongoing")
@limiter.limit("30/minute")
async def get_ongoing_interview(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get the user's ongoing interview session if one exists."""
    from app.models import InterviewSession
    ongoing = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user["user_id"],
        InterviewSession.status == "ongoing"
    ).first()
    
    if not ongoing:
        return {"session_id": None, "has_ongoing": False}
    
    return {
        "session_id": ongoing.id,
        "role": ongoing.role,
        "has_ongoing": True,
        "started_at": ongoing.started_at
    }


@router.post("/cancel/{session_id}")
@limiter.limit("10/hour")
async def cancel_interview(
    request: Request,
    session_id: int,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Cancel/end an ongoing interview without scoring."""
    from app.models import InterviewSession
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user["user_id"],
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    
    if session.status != "ongoing":
        raise HTTPException(status_code=400, detail="Interview is not ongoing")
    
    session.status = "cancelled"
    db.commit()
    
    return {"message": "Interview cancelled successfully", "session_id": session_id}


@router.post("/health-check", response_model=DeviceCheckResponse)
@limiter.limit("30/minute")
async def health_check(
    request: Request,
    check: HealthCheckRequest,
    current_user: dict = Depends(get_current_user),
):
    """Verify user's camera, microphone, and speaker are available."""
    if not all([check.camera_detected, check.microphone_detected, check.speaker_detected]):
        missing = []
        if not check.camera_detected:
            missing.append("camera")
        if not check.microphone_detected:
            missing.append("microphone")
        if not check.speaker_detected:
            missing.append("speaker")
        return {
            "camera_ok": check.camera_detected,
            "microphone_ok": check.microphone_detected,
            "speaker_ok": check.speaker_detected,
            "message": f"Missing devices: {', '.join(missing)}"
        }
    
    return {
        "camera_ok": True,
        "microphone_ok": True,
        "speaker_ok": True,
        "message": "All devices verified successfully"
    }


@router.post("/audio-test")
@limiter.limit("20/minute")
async def audio_test(
    request: Request,
    audio_file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Test microphone by extracting text from audio."""
    try:
        content = await audio_file.read()
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Audio file is empty"
            )
        

        
        result, code = await extract_text_from_audio(content, audio_file.filename.split(".")[-1] if audio_file.filename else "wav")
        if code != 200:
            return result
        
        transcribed_text = result.get("text", "")
        return {
            "test_passed": True,
            "transcribed_text": transcribed_text,
            "message": "Microphone test successful"
        }
    except Exception as e:
        return {
            "test_passed": False,
            "error": str(e),
            "message": "Microphone test failed",
            "transcribed_text": ""
        }


@router.get("/audio-test")
@limiter.limit("20/minute")
async def audio_test_get(
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Get test text for speaker test (text-to-speech conversion on frontend)."""
    test_texts = [
        "Hello, I am ready for my interview today.",
        "I am very excited to discuss my background.",
        "My communication skills are strong and clear.",
        "Thank you for taking the time to meet with me.",
        "I look forward to answering your questions."
    ]
    import random
    test_text = random.choice(test_texts)
    
    return {
        "test_text": test_text,
        "message": "Speaker test text generated"
    }


@router.post("/start", status_code=201)
@limiter.limit("10/hour")
async def start_interview_route(
    request: Request,
    interview_req: StartInterviewRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Start a new interview session.
    - Validates role
    - Generates questions via Gemini (fallback to static bank)
    - Stores all questions in DB for session consistency
    - Prevents concurrent sessions
    """
    # Fetch questions first
    q_result, q_status = await get_interview_questions(
        interview_req.role, 
        interview_req.interview_type, 
        interview_req.difficulty, 
        interview_req.duration_minutes
    )
    if q_status != 200:
        raise HTTPException(status_code=q_status, detail=q_result.get("error"))

    questions = q_result["questions"]

    result, code = await start_interview(
        db, current_user["user_id"], interview_req.role, questions, interview_req.duration_minutes
    )
    if code != 201:
        raise HTTPException(status_code=code, detail=result.get("error"))
    return result


@router.get("/question/{session_id}/{question_number}")
@limiter.limit("30/minute")
async def get_question(
    request: Request,
    session_id: int,
    question_number: int,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get a specific question from an ongoing session."""
    result, code = await get_next_question(
        db, session_id, question_number, current_user["user_id"]
    )
    if code != 200:
        raise HTTPException(status_code=code, detail=result.get("error"))
    return result


@router.post("/submit-answer")
@limiter.limit("30/minute")
async def submit_answer_route(
    request: Request,
    session_id: int = Form(...),
    question_number: int = Form(...),
    answer_text: str = Form(None),
    audio_file: UploadFile = File(None),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Submit answer for current question via text or audio.
    - If audio file: extracts text using speech recognition
    - If text: uses provided text
    - AI evaluates and returns score + feedback
    """
    # Both session_id and question_number are required (Form(...) enforces this)
    # This check is now redundant but kept for safety
    if not session_id or not question_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="session_id and question_number required"
        )
    
    # Extract answer text from audio or use provided text
    answer = answer_text
    if audio_file:
        try:
            content = await audio_file.read()
            result, code = await extract_text_from_audio(
                content, 
                audio_file.filename.split(".")[-1] if audio_file.filename else "wav"
            )
            if code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=result.get("error", "Failed to extract text from audio")
                )
            answer = result.get("text")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Audio processing failed: {str(e)}"
            )
    
    if not answer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Answer text or audio file required"
        )
    
    if len(answer.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Answer too short. Minimum 10 characters.",
        )
    
    result, code = await submit_answer(
        db,
        session_id,
        question_number,
        answer,
        current_user["user_id"],
    )
    if code != 200:
        raise HTTPException(status_code=code, detail=result.get("error"))
    return result


@router.post("/end/{session_id}")
@limiter.limit("10/hour")
async def end_interview_route(
    request: Request,
    session_id: int,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    End interview and generate AI dashboard report.
    Returns: total_score, average_score, strengths, weaknesses,
             hiring_recommendation, improvement_suggestions, question_wise breakdown.
    """
    result, code = await end_interview(db, session_id, current_user["user_id"])
    if code != 200:
        raise HTTPException(status_code=code, detail=result.get("error"))
    return result


@router.get("/history")
@limiter.limit("20/minute")
async def get_history(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """All past interview sessions for the authenticated user."""
    result, code = await get_interview_history(db, current_user["user_id"])
    if code != 200:
        raise HTTPException(status_code=code, detail=result.get("error"))
    return result


@router.get("/details/{session_id}")
@limiter.limit("20/minute")
async def get_details(
    request: Request,
    session_id: int,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Detailed view of a specific interview session with all Q&A."""
    result, code = await get_interview_details(db, session_id, current_user["user_id"])
    if code != 200:
        raise HTTPException(status_code=code, detail=result.get("error"))
    return result
