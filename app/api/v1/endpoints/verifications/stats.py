from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.api.deps import get_current_user, CurrentUser
from app.schemas.verification import VerificationStats
from app.services.verification_service import VerificationService

router = APIRouter()

@router.get(
    "/stats/summary",
    response_model=VerificationStats,
    summary="Thống kê verifications",
    description="Lấy thống kê tổng quan"
)
async def get_statistics(
    user_id: Optional[str] = Query(None, description="Filter theo user"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    service = VerificationService(db)
    if current_user.role == "EV_OWNER":
        user_id = current_user.id
    stats = service.get_statistics(user_id=user_id)
    return VerificationStats(**stats)
