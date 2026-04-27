from datetime import datetime, timedelta, timezone
from app.models import User
from app.utils.security import hash_password, verify_password, generate_otp
from app.utils.jwt import create_access_token
from app.services.email import send_otp_email_async, send_password_reset_email_async
from app.config import OTP_EXPIRY_MINUTES, FRONTEND_URL
import uuid
import secrets


async def register_user(db, email: str, username: str, password: str):
    """Register a new user with OTP"""
    # Normalize email to lowercase
    email = email.strip().lower()

    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        if not existing_user.is_verified:
            # User exists but not verified — resend OTP instead of blocking
            otp = generate_otp()
            otp_expiration = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)
            existing_user.otp = hash_password(otp)
            existing_user.otp_expiration = otp_expiration
            existing_user.name = username
            existing_user.hashed_password = hash_password(password)
            db.commit()
            await send_otp_email_async(email, otp)

            return {"message": "User registered. Check your email for OTP."}, 201
        return {"error": "Email already registered"}, 400

    # Generate OTP
    otp = generate_otp()
    otp_expiration = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)
    hashed_otp = hash_password(otp)
    hashed_password = hash_password(password)

    # Create user
    new_user = User(
        name=username,
        email=email,
        hashed_password=hashed_password,
        otp=hashed_otp,
        otp_expiration=otp_expiration,
        is_verified=False
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Send OTP email
    await send_otp_email_async(email, otp)
    

    return {"message": f"User registered. Check your email for OTP."}, 201


async def verify_otp(db, email: str, otp: str):
    """Verify OTP"""
    email = email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        return {"error": "User not found"}, 404
    
    if user.is_verified:
        return {"message": "Email is already verified"}, 200
    
    if not user.otp:
        return {"error": "No OTP found. Please request a new one."}, 400
    
    db_exp = user.otp_expiration
    if db_exp and db_exp.tzinfo is None:
        db_exp = db_exp.replace(tzinfo=timezone.utc)
        
    if datetime.now(timezone.utc) > db_exp:
        return {"error": "OTP has expired. Please request a new one."}, 400
    
    if not verify_password(otp, user.otp):
        return {"error": "Invalid OTP"}, 401
    
    user.is_verified = True
    user.otp = None
    user.otp_expiration = None
    db.commit()
    
    return {"message": "Email verified successfully!"}, 200


async def resend_otp(db, email: str):
    """Resend OTP"""
    email = email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        return {"error": "No account found with this email. Please register first."}, 404
    
    if user.is_verified:
        return {"message": "Email is already verified. You can login."}, 200
    
    # Generate new OTP
    otp = generate_otp()
    otp_expiration = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)
    hashed_otp = hash_password(otp)
    
    user.otp = hashed_otp
    user.otp_expiration = otp_expiration
    db.commit()
    
    # Send OTP email
    await send_otp_email_async(email, otp)
    

    return {"message": f"OTP resent to {email}"}, 200


async def login_user(db, email: str, password: str):
    """Login user and return JWT token"""
    email = email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        return {"error": "Invalid email or password"}, 401
    
    if not verify_password(password, user.hashed_password):
        return {"error": "Invalid email or password"}, 401
    
    if not user.is_verified:
        return {"error": "Please verify your email first. Go to the verification page."}, 403
    
    # Generate JWT token
    access_token = create_access_token(data={"sub": user.email, "user_id": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "name": user.name,
        "email": user.email
    }, 200


async def forgot_password(db, email: str):
    """Generate password reset token and send email"""
    email = email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Don't reveal if user exists (security best practice)
        return {"message": "If an account exists with this email, a password reset link has been sent."}, 200
    
    if not user.is_verified:
        return {"error": "Please verify your email first before resetting password."}, 403
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    reset_token_expiration = datetime.now(timezone.utc) + timedelta(hours=1)
    
    user.reset_token = reset_token
    user.reset_token_expiration = reset_token_expiration
    db.commit()
    
    # Send reset email with correct frontend URL
    reset_link = f"{FRONTEND_URL}/auth/reset-password?token={reset_token}"
    await send_password_reset_email_async(email, reset_link)
    
    return {"message": "If an account exists with this email, a password reset link has been sent."}, 200


async def reset_password(db, token: str, new_password: str):
    """Reset password with token"""
    user = db.query(User).filter(User.reset_token == token).first()
    
    if not user:
        return {"error": "Invalid or expired reset link"}, 404
    
    db_exp = user.reset_token_expiration
    if db_exp and db_exp.tzinfo is None:
        db_exp = db_exp.replace(tzinfo=timezone.utc)
        
    if datetime.now(timezone.utc) > db_exp:
        user.reset_token = None
        user.reset_token_expiration = None
        db.commit()
        return {"error": "Reset link has expired. Please request a new one."}, 400
    
    # Update password
    user.hashed_password = hash_password(new_password)
    user.reset_token = None
    user.reset_token_expiration = None
    db.commit()
    
    return {"message": "Password reset successfully! You can now login."}, 200
