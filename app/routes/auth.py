from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.models import User
from app.database import get_db
from ..schemas import (
    UserRegister, UserLogin, verify_otp, resend_otp, Token,
    ForgotPasswordRequest, ResetPasswordRequest
)
from app.services.auth_service import (
    register_user, verify_otp as verify_otp_service,
    resend_otp as resend_otp_service, login_user,
    forgot_password, reset_password
)
from app.utils.security import limiter


router = APIRouter()


@router.post("/register", status_code=201)
@limiter.limit("5/minute")
async def register(request: Request, user: UserRegister, db = Depends(get_db)):
    """Register a new user with email and password"""
    result, status_code = await register_user(db, user.email, user.username, user.password)
    if status_code != 201:
        raise HTTPException(status_code=status_code, detail=result.get("error", "Registration failed"))
    return result


@router.post("/verify-otp")
@limiter.limit("5/minute")
async def verify_otp_route(request: Request, data: verify_otp, db = Depends(get_db)):
    """Verify OTP sent to email"""
    result, status_code = await verify_otp_service(db, data.email, data.otp)
    if status_code != 200:
        raise HTTPException(status_code=status_code, detail=result.get("error", "OTP verification failed"))
    return result


@router.post("/resend-otp")
@limiter.limit("3/minute")
async def resend_otp_route(request: Request, data: resend_otp, db = Depends(get_db)):
    """Resend OTP to email"""
    result, status_code = await resend_otp_service(db, data.email)
    if status_code != 200:
        raise HTTPException(status_code=status_code, detail=result.get("error", "OTP resend failed"))
    return result


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(request: Request, credentials: UserLogin, db = Depends(get_db)):
    """Login with email and password, returns JWT token"""
    result, status_code = await login_user(db, credentials.email, credentials.password)
    if status_code != 200:
        raise HTTPException(status_code=status_code, detail=result.get("error", "Login failed"))
    return result


@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password_route(request: Request, data: ForgotPasswordRequest, db = Depends(get_db)):
    """Request password reset - sends email with reset link"""
    result, status_code = await forgot_password(db, data.email)
    if status_code != 200:
        raise HTTPException(status_code=status_code, detail=result.get("error", "Request failed"))
    return result


@router.post("/reset-password")
@limiter.limit("5/minute")
async def reset_password_route(request: Request, data: ResetPasswordRequest, db = Depends(get_db)):
    """Reset password using token"""
    result, status_code = await reset_password(db, data.token, data.new_password)
    if status_code != 200:
        raise HTTPException(status_code=status_code, detail=result.get("error", "Password reset failed"))
    return result