from passlib.context import CryptContext
import secrets
from slowapi import Limiter
from slowapi.util import get_remote_address

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
limiter = Limiter(key_func=get_remote_address)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def generate_otp() -> str:
    """Cryptographically secure 6-digit OTP"""
    return str(secrets.randbelow(900000) + 100000)