from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.database import get_db
from ..schemas import UpdateProfileRequest
from app.services.auth_service import update_user_profile
from app.utils.security import limiter
from app.utils.jwt import decode_access_token


router = APIRouter()


def get_current_user_id(request: Request) -> int:
    """Extract user_id from JWT token in Authorization header"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = auth_header.split(" ")[1]
    
    # Decode token to get user_id
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return user_id


@router.put("/profile", tags=["User"])
@limiter.limit("10/minute")
async def update_profile_route(request: Request, data: UpdateProfileRequest, db = Depends(get_db)):
    """Update user profile (name and/or password)"""
    user_id = get_current_user_id(request)
    
    # Update profile
    result, status_code = await update_user_profile(db, user_id, data.name, data.current_password, data.new_password)
    if status_code != 200:
        raise HTTPException(status_code=status_code, detail=result.get("error", "Profile update failed"))
    return result
