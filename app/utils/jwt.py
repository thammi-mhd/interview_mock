from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

jwt_secret_key = SECRET_KEY
jwt_algorithm = ALGORITHM
jwt_expiration_minutes = ACCESS_TOKEN_EXPIRE_MINUTES

security = HTTPBearer()

def create_access_token(data: dict):
  to_encode = data.copy()
  expire = datetime.now(timezone.utc) + timedelta(minutes=jwt_expiration_minutes)
  to_encode.update({"exp": expire, "type": "access"})
  
  encode_jwt = jwt.encode(to_encode, jwt_secret_key, algorithm=jwt_algorithm)
  return encode_jwt

def verify_token(token: str):
  try:
    payload = jwt.decode(token, jwt_secret_key, algorithms=[jwt_algorithm])
    if payload.get("type") != "access":
      raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
    email: str = payload.get("sub")
    user_id: int = payload.get("user_id")
    if email is None:
      raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return {"email": email, "user_id": user_id}
  except JWTError:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

# Dependency injection for protected routes
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    return verify_token(token)