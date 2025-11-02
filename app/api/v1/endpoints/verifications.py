# ============================================
# API Endpoints với Swagger tự động
# ============================================
from fastapi import APIRouter, Depends, Query, Path, status
from sqlalchemy.orm import Session
from typing import Optional

from app.config.database import get_db
from app.api.deps import get_current_user, CurrentUser
from app.schemas.verification import (
    VerificationCreate,
    VerificationResponse,
    VerificationApprove,
    VerificationReject,
    VerificationListResponse,
    ApiResponse,
    VerificationStatus
)
from app.services.verification_service import VerificationService

router = APIRouter()


@router.post(
    "",
    response_model=VerificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo verification mới",
    description="Endpoint để tạo verification request từ MRV Service"
)
async def create_verification(
    data: VerificationCreate,
    db: Session = Depends(get_db)
):
    """
    Tạo verification mới:
    - **trip_id**: ID của chuyến đi
    - **user_id**: ID của EV Owner
    - **co2_saved_kg**: Lượng CO2 giảm (kg)
    - **credits_suggested**: Tín chỉ đề xuất
    """
    service = VerificationService(db)
    verification = service.create_verification(
        trip_id=data.trip_id,
        user_id=data.user_id,
        co2_saved_kg=data.co2_saved_kg,
        credits_suggested=data.credits_suggested,
        trip_distance_km=data.trip_distance_km,
        trip_date=data.trip_date
    )
    return verification


@router.get(
    "",
    response_model=VerificationListResponse,
    summary="Lấy danh sách verifications",
    description="Lấy danh sách với filter và pagination"
)
async def get_verifications(
    status: Optional[VerificationStatus] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách verifications với:
    - **status**: PENDING, IN_REVIEW, APPROVED, REJECTED
    - **page**: Trang hiện tại
    - **page_size**: Số items mỗi trang
    """
    service = VerificationService(db)
    items, total = service.get_verifications(status, page, page_size)
    
    return VerificationListResponse(
        items=items,
        total=total,
        page=page
    )


@router.get(
    "/{verification_id}",
    response_model=VerificationResponse,
    summary="Lấy chi tiết verification",
    description="Lấy thông tin chi tiết của một verification"
)
async def get_verification(
    verification_id: str = Path(..., description="Verification ID"),
    db: Session = Depends(get_db)
):
    """Lấy chi tiết verification theo ID"""
    service = VerificationService(db)
    return service.get_verification(verification_id)


@router.post(
    "/{verification_id}/approve",
    response_model=VerificationResponse,
    summary="Phê duyệt verification",
    description="CVA phê duyệt verification"
)
async def approve_verification(
    verification_id: str = Path(..., description="Verification ID"),
    data: VerificationApprove = ...,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    CVA phê duyệt verification:
    - Xác nhận số lượng CO2 và credits
    - Tạo digital signature
    - Chuyển status sang APPROVED
    """
    service = VerificationService(db)
    return service.approve_verification(
        verification_id=verification_id,
        cva_id=current_user.id,
        verified_co2_kg=data.verified_co2_kg,
        verified_credits=data.verified_credits,
        verifier_remarks=data.verifier_remarks
    )


@router.post(
    "/{verification_id}/reject",
    response_model=VerificationResponse,
    summary="Từ chối verification",
    description="CVA từ chối verification"
)
async def reject_verification(
    verification_id: str = Path(..., description="Verification ID"),
    data: VerificationReject = ...,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    CVA từ chối verification:
    - Ghi rõ lý do từ chối
    - Chuyển status sang REJECTED
    """
    service = VerificationService(db)
    return service.reject_verification(
        verification_id=verification_id,
        cva_id=current_user.id,
        verifier_remarks=data.verifier_remarks
    )