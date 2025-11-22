from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.api.deps import get_current_user, CurrentUser
from app.schemas.verification import VerificationListResponse, VerificationStatus
from app.services.verification_service import VerificationService

router = APIRouter()

@router.get(
    "/",
    response_model=VerificationListResponse,
    summary="Lấy danh sách verifications",
    description="Lấy danh sách với filter, pagination và sorting"
)
async def get_verifications(
    status: Optional[VerificationStatus] = Query(None, description="Filter theo status: PENDING, APPROVED, REJECTED"),
    user_id: Optional[str] = Query(None, description="Filter theo EV Owner ID"),
    verifier_id: Optional[str] = Query(None, description="Filter theo CVA ID"),
    page: int = Query(1, ge=1, description="Trang hiện tại"),
    page_size: int = Query(20, ge=1, le=100, description="Số items mỗi trang (max 100)"),
    sort_by: str = Query("created_at", description="Sort field: created_at, updated_at, co2_saved_kg"),
    sort_order: str = Query("DESC", regex="^(ASC|DESC)$", description="Sort order: ASC hoặc DESC"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    service = VerificationService(db)
    if current_user.role == "EV_OWNER":
        user_id = current_user.id
    items, total = service.get_verifications(
        status=status,
        user_id=user_id,
        verifier_id=verifier_id,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return VerificationListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )
