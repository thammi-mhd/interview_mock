import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import SMTP_SERVER, SMTP_PORT, EMAIL_USER, EMAIL_PASSWORD, SENDER_EMAIL
import asyncio
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=5)

def send_otp_email(email: str, otp: str, subject: str = "Your Verification Code — Intervuo"):
    """Send OTP email to user"""
    try:
        print(f"[EMAIL] Attempting to send OTP to {email}")
        
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = SENDER_EMAIL
        message["To"] = email

        # HTML email template
        html = f"""\
        <html>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #06070a; color: #f2f2f0; padding: 40px 20px;">
                <div style="max-width: 480px; margin: 0 auto; background: #0e1017; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.06);">
                    <h2 style="margin: 0 0 8px; font-size: 24px; color: #c8f04d;">Intervuo</h2>
                    <p style="color: #8892a4; margin: 0 0 32px; font-size: 14px;">AI-Powered Mock Interviews</p>
                    
                    <p style="color: #f2f2f0; margin: 0 0 16px;">Your verification code is:</p>
                    <div style="background: #161922; border: 1px solid rgba(200,240,77,0.2); border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
                        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #c8f04d;">{otp}</span>
                    </div>
                    <p style="color: #8892a4; font-size: 13px; margin: 0 0 8px;">This code expires in 10 minutes.</p>
                    <p style="color: #5a6175; font-size: 12px; margin: 0;">If you didn't request this, you can safely ignore this email.</p>
                </div>
            </body>
        </html>
        """

        part = MIMEText(html, "html")
        message.attach(part)

        # Send email
        print(f"[EMAIL] Connecting to {SMTP_SERVER}:{SMTP_PORT}")
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10) as server:
            print("[EMAIL] Starting TLS")
            server.starttls()
            print(f"[EMAIL] Logging in as {EMAIL_USER}")
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            print(f"[EMAIL] Sending OTP email to {email}")
            server.sendmail(SENDER_EMAIL, email, message.as_string())
        
        print(f"[EMAIL] ✓ OTP email sent successfully to {email}")
        return True
    except smtplib.SMTPAuthenticationError as e:
        print(f"[EMAIL] ✗ Authentication failed: {e}")
        return False
    except smtplib.SMTPException as e:
        print(f"[EMAIL] ✗ SMTP error: {e}")
        return False
    except Exception as e:
        print(f"[EMAIL] ✗ Error sending OTP email: {e}")
        import traceback
        traceback.print_exc()
        return False

async def send_otp_email_async(email: str, otp: str):
    """Async wrapper for sending OTP email - uses thread pool to avoid blocking"""
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, send_otp_email, email, otp)
        return result
    except Exception as e:
        print(f"[EMAIL] ✗ Async OTP email error: {e}")
        import traceback
        traceback.print_exc()
        return False

def send_password_reset_email(email: str, reset_link: str):
    """Send password reset link email"""
    try:
        print(f"[EMAIL] Attempting to send password reset email to {email}")
        
        message = MIMEMultipart("alternative")
        message["Subject"] = "Reset Your Password — Intervuo"
        message["From"] = SENDER_EMAIL
        message["To"] = email

        html = f"""\
        <html>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #06070a; color: #f2f2f0; padding: 40px 20px;">
                <div style="max-width: 480px; margin: 0 auto; background: #0e1017; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.06);">
                    <h2 style="margin: 0 0 8px; font-size: 24px; color: #c8f04d;">Intervuo</h2>
                    <p style="color: #8892a4; margin: 0 0 32px; font-size: 14px;">Password Reset Request</p>
                    
                    <p style="color: #f2f2f0; margin: 0 0 24px;">Click the button below to reset your password:</p>
                    <div style="text-align: center; margin: 0 0 24px;">
                        <a href="{reset_link}" style="display: inline-block; background: #c8f04d; color: #06070a; font-weight: bold; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-size: 15px;">Reset Password</a>
                    </div>
                    <p style="color: #8892a4; font-size: 13px; margin: 0 0 8px;">This link expires in 1 hour.</p>
                    <p style="color: #5a6175; font-size: 12px; margin: 0 0 16px;">If you didn't request this, you can safely ignore this email.</p>
                    <p style="color: #5a6175; font-size: 11px; margin: 0; word-break: break-all;">Link: {reset_link}</p>
                </div>
            </body>
        </html>
        """

        part = MIMEText(html, "html")
        message.attach(part)

        print(f"[EMAIL] Connecting to {SMTP_SERVER}:{SMTP_PORT}")
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10) as server:
            print("[EMAIL] Starting TLS")
            server.starttls()
            print(f"[EMAIL] Logging in as {EMAIL_USER}")
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            print(f"[EMAIL] Sending password reset email to {email}")
            server.sendmail(SENDER_EMAIL, email, message.as_string())
        
        print(f"[EMAIL] ✓ Password reset email sent successfully to {email}")
        return True
    except smtplib.SMTPAuthenticationError as e:
        print(f"[EMAIL] ✗ Authentication failed: {e}")
        return False
    except smtplib.SMTPException as e:
        print(f"[EMAIL] ✗ SMTP error: {e}")
        return False
    except Exception as e:
        print(f"[EMAIL] ✗ Error sending password reset email: {e}")
        import traceback
        traceback.print_exc()
        return False

async def send_password_reset_email_async(email: str, reset_link: str):
    """Async wrapper for sending password reset email"""
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, send_password_reset_email, email, reset_link)
        return result
    except Exception as e:
        print(f"[EMAIL] ✗ Async password reset email error: {e}")
        import traceback
        traceback.print_exc()
        return False
