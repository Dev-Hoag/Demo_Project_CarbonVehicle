from typing import Optional
from fastapi import APIRouter, Depends, Query, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.api.deps import CurrentUser
from app.core.security import decode_token
from app.schemas.verification import VerificationStats
from app.services.verification_service import VerificationService
from app.utils.logger import logger

router = APIRouter()
bearer_scheme = HTTPBearer(auto_error=False)

def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme),
) -> Optional[CurrentUser]:
    """Optional authentication - returns user if token provided, None otherwise"""
    if not credentials or not credentials.credentials:
        return None
    
    try:
        token = credentials.credentials
        payload = decode_token(token)
        user_id = payload.get("sub") or payload.get("id")
        email = payload.get("email")
        role = payload.get("role")
        
        if user_id and role:
            return CurrentUser(id=user_id, email=email, role=role, full_name=payload.get("full_name"))
    except Exception as e:
        logger.warning(f"⚠️ Optional auth failed: {str(e)}")
    
    return None

@router.get(
    "/stats/summary",
    response_model=VerificationStats,
    summary="Thống kê verifications",
    description="Lấy thống kê tổng quan"
)
async def get_statistics(
    user_id: Optional[str] = Query(None, description="Filter theo user"),
    db: Session = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_optional_user)
):
    service = VerificationService(db)
    if current_user and current_user.role == "EV_OWNER":
        user_id = current_user.id
    stats = service.get_statistics(user_id=user_id)
    return VerificationStats(**stats)
