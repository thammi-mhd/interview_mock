from datetime import datetime, timezone
from app.models import InterviewSession, InterviewQuestion
from app.services.ai_service import evaluate_answer, generate_interview_report


async def start_interview(db, user_id: int, role: str, questions: list, interview_type: str = "Technical", difficulty: str = "Medium", duration_minutes: int = 20):
    """
    Start a new interview session and pre-store all questions in the DB.
    This ensures question consistency across the entire session.
    """
    # Prevent multiple concurrent sessions
    ongoing = db.query(InterviewSession).filter(
        InterviewSession.user_id == user_id,
        InterviewSession.status == "ongoing"
    ).first()
    if ongoing:
        return {"error": "You already have an ongoing interview. End it first.", "session_id": ongoing.id}, 409

    # Create session
    session = InterviewSession(
        user_id=user_id, 
        role=role, 
        interview_type=interview_type,
        difficulty=difficulty,
        status="ongoing", 
        duration_minutes=duration_minutes
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Pre-store all questions so they are consistent throughout the session
    for idx, q_text in enumerate(questions, start=1):
        q = InterviewQuestion(
            session_id=session.id,
            question_number=idx,
            question=q_text,
        )
        db.add(q)
    db.commit()

    return {
        "session_id": session.id,
        "role": session.role,
        "status": session.status,
        "total_questions": len(questions),
        "message": "Interview started! Answer questions one by one.",
    }, 201


async def get_next_question(db, session_id: int, question_number: int, user_id: int):
    """Fetch a specific question from DB (questions pre-stored at session start)."""
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == user_id,
    ).first()
    if not session:
        return {"error": "Session not found or not yours"}, 404
    if session.status != "ongoing":
        return {"error": "Interview is not ongoing"}, 400

    total = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session_id
    ).count()

    if question_number < 1 or question_number > total:
        return {"error": f"Question number must be between 1 and {total}"}, 400

    question = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session_id,
        InterviewQuestion.question_number == question_number,
    ).first()
    if not question:
        return {"error": "Question not found"}, 404

    return {
        "session_id": session_id,
        "question_number": question_number,
        "question": question.question,
        "is_answered": question.user_answer is not None,
        "total_questions": total,
    }, 200


async def submit_answer(db, session_id: int, question_number: int, user_answer: str, user_id: int):
    """Submit and AI-evaluate an answer. Prevents duplicate submissions."""
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == user_id,
    ).first()
    if not session:
        return {"error": "Session not found or not yours"}, 404
    if session.status != "ongoing":
        return {"error": "Interview is not ongoing"}, 400

    question = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session_id,
        InterviewQuestion.question_number == question_number,
    ).first()
    if not question:
        return {"error": "Question not found"}, 404
    if question.user_answer is not None:
        return {"error": "Answer already submitted for this question"}, 409

    # AI evaluation
    eval_result, eval_status = await evaluate_answer(question.question, user_answer, session.role)
    if eval_status != 200:
        return eval_result, eval_status

    question.user_answer = user_answer
    question.score = eval_result["score"]
    question.feedback = eval_result["feedback"]
    question.answered_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(question)

    # Count total questions to determine if this was the last one
    total = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session_id
    ).count()
    answered = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session_id,
        InterviewQuestion.user_answer.isnot(None),
    ).count()

    return {
        "question_number": question_number,
        "score": question.score,
        "feedback": question.feedback,
        "answered": answered,
        "total_questions": total,
        "interview_complete": answered == total,
        "message": "Answer submitted successfully",
    }, 200


async def end_interview(db, session_id: int, user_id: int):
    """End interview session and generate comprehensive AI report."""
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == user_id,
    ).first()
    if not session:
        return {"error": "Session not found or not yours"}, 404
    if session.status != "ongoing":
        return {"error": "Interview already ended"}, 400

    questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session_id
    ).order_by(InterviewQuestion.question_number).all()

    answered = [q for q in questions if q.user_answer is not None]
    if not answered:
        return {"error": "No answers submitted yet"}, 400

    # Mark session complete
    total_score = sum(q.score for q in answered if q.score)
    session.total_score = total_score
    session.status = "completed"
    session.ended_at = datetime.now(timezone.utc)
    db.commit()

    answers_data = [
        {
            "question": q.question,
            "user_answer": q.user_answer,
            "score": q.score,
            "feedback": q.feedback,
        }
        for q in answered
    ]

    report, report_status = await generate_interview_report(session_id, db, answers_data)
    if report_status != 200:
        return report, report_status

    return report, 200


async def get_interview_history(db, user_id: int):
    """All sessions for a user, most recent first."""
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == user_id)
        .order_by(InterviewSession.started_at.desc())
        .all()
    )

    history = []
    for s in sessions:
        total_q = db.query(InterviewQuestion).filter(InterviewQuestion.session_id == s.id).count()
        answered_q = db.query(InterviewQuestion).filter(
            InterviewQuestion.session_id == s.id,
            InterviewQuestion.user_answer.isnot(None),
        ).count()
        max_possible = total_q * 10
        history.append({
            "session_id": s.id,
            "role": s.role,
            "interview_type": s.interview_type,
            "difficulty": s.difficulty,
            "status": s.status,
            "total_score": s.total_score,
            "max_possible_score": max_possible,
            "total_questions": total_q,
            "answered_questions": answered_q,
            "started_at": s.started_at,
            "ended_at": s.ended_at,
        })

    return {"sessions": history, "total_interviews": len(history)}, 200


async def get_interview_details(db, session_id: int, user_id: int):
    """Full details of a session including all Q&A."""
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == user_id,
    ).first()
    if not session:
        return {"error": "Session not found or not yours"}, 404

    questions = (
        db.query(InterviewQuestion)
        .filter(InterviewQuestion.session_id == session_id)
        .order_by(InterviewQuestion.question_number)
        .all()
    )

    return {
        "session_id": session.id,
        "role": session.role,
        "status": session.status,
        "total_score": session.total_score,
        "max_possible_score": len(questions) * 10,
        "started_at": session.started_at,
        "ended_at": session.ended_at,
        "questions": [
            {
                "question_number": q.question_number,
                "question": q.question,
                "answer": q.user_answer,
                "score": q.score,
                "feedback": q.feedback,
                "answered_at": q.answered_at,
            }
            for q in questions
        ],
    }, 200
