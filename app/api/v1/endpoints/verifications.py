# ============================================
# API Endpoints với Swagger tự động
# ============================================
from typing import Optional
from fastapi import APIRouter, Depends, Query, Path, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.api.deps import (
    get_current_user, 
    get_current_cva_user,
    check_roles,
    CurrentUser
)
from app.schemas.verification import (
    VerificationCreate,
    VerificationResponse,
    VerificationApprove,
    VerificationReject,
    VerificationListResponse,
    VerificationStats,
    VerificationStatus
)
from app.services.verification_service import VerificationService
from app.core.exceptions import NotFoundException
from app.utils.logger import logger

router = APIRouter()


# ============================================
# 1. CREATE - Tạo verification mới
# ============================================
@router.post(
    "",
    response_model=VerificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo verification mới",
    description="Endpoint để MRV Service tạo verification request sau khi tính CO2"
)
async def create_verification(
    data: VerificationCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Tạo verification mới từ MRV Service
    
    **Flow:**
    1. MRV Service tính toán CO2 từ trip
    2. Call endpoint này để tạo verification
    3. Status mặc định: PENDING
    4. CVA sẽ review và approve/reject
    
    **Required:**
    - trip_id: ID của trip (unique)
    - user_id: EV Owner ID
    - co2_saved_kg: Lượng CO2 giảm (kg)
    - credits_suggested: Tín chỉ đề xuất (tonnes)
    """
    service = VerificationService(db)
    
    verification = service.create_verification(
        trip_id=data.trip_id,
        user_id=data.user_id,
        co2_saved_kg=data.co2_saved_kg,
        credits_suggested=data.credits_suggested
    )
    
    logger.info(f"📝 Created verification {verification.id} via API")
    
    return verification


# ============================================
# 2. READ - Lấy danh sách verifications
# ============================================
@router.get(
    "",
    response_model=VerificationListResponse,
    summary="Lấy danh sách verifications",
    description="Lấy danh sách với filter, pagination và sorting"
)
async def get_verifications(
    status: Optional[VerificationStatus] = Query(
        None, 
        description="Filter theo status: PENDING, APPROVED, REJECTED"
    ),
    user_id: Optional[str] = Query(
        None, 
        description="Filter theo EV Owner ID"
    ),
    verifier_id: Optional[str] = Query(
        None,
        description="Filter theo CVA ID"
    ),
    page: int = Query(
        1, 
        ge=1, 
        description="Trang hiện tại"
    ),
    page_size: int = Query(
        20, 
        ge=1, 
        le=100, 
        description="Số items mỗi trang (max 100)"
    ),
    sort_by: str = Query(
        "created_at",
        description="Sort field: created_at, updated_at, co2_saved_kg"
    ),
    sort_order: str = Query(
        "DESC",
        regex="^(ASC|DESC)$",
        description="Sort order: ASC hoặc DESC"
    ),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Lấy danh sách verifications với filters
    
    **Filters:**
    - `status`: PENDING, APPROVED, REJECTED
    - `user_id`: Lọc theo EV Owner
    - `verifier_id`: Lọc theo CVA
    
    **Pagination:**
    - `page`: Trang hiện tại (default: 1)
    - `page_size`: Items per page (default: 20, max: 100)
    
    **Sorting:**
    - `sort_by`: Field để sort (default: created_at)
    - `sort_order`: ASC hoặc DESC (default: DESC)
    
    **Authorization:**
    - EV Owner: Chỉ xem verifications của mình
    - CVA: Xem tất cả hoặc của mình
    - Admin: Xem tất cả
    """
    service = VerificationService(db)
    
    # EV Owner chỉ xem của mình
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


# ============================================
# 3. READ - Lấy chi tiết verification
# ============================================
@router.get(
    "/{verification_id}",
    response_model=VerificationResponse,
    summary="Lấy chi tiết verification",
    description="Lấy thông tin đầy đủ của một verification"
)
async def get_verification(
    verification_id: str = Path(..., description="Verification ID (UUID)"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Lấy chi tiết verification theo ID
    
    **Returns:**
    - Tất cả thông tin của verification
    - Bao gồm signature_hash nếu đã approve
    
    **Authorization:**
    - EV Owner: Chỉ xem verifications của mình
    - CVA/Admin: Xem tất cả
    """
    service = VerificationService(db)
    verification = service.get_verification(verification_id)
    
    # Check permission
    if current_user.role == "EV_OWNER":
        if verification.user_id != current_user.id:
            raise NotFoundException("Verification not found")
    
    return verification


# ============================================
# 4. UPDATE - Approve verification (CVA only)
# ============================================
@router.post(
    "/{verification_id}/approve",
    response_model=VerificationResponse,
    summary="Phê duyệt verification",
    description="CVA phê duyệt verification sau khi xác minh"
)
async def approve_verification(
    verification_id: str = Path(..., description="Verification ID"),
    data: VerificationApprove = ...,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_cva_user)
):
    """
    CVA phê duyệt verification
    
    **Process:**
    1. Kiểm tra status = PENDING
    2. Tạo digital signature (SHA256)
    3. Update status → APPROVED
    4. Publish event VerificationApproved
    5. Registry Service nhận event và mint credits
    
    **Input:**
    - remarks: Ghi chú của CVA (optional)
    
    **Output:**
    - Verification với signature_hash và signed_at
    
    **Authorization:**
    - Chỉ CVA mới được approve
    """
    service = VerificationService(db)
    
    verification = service.approve_verification(
        verification_id=verification_id,
        verifier_id=current_user.id,
        remarks=data.remarks
    )
    
    logger.info(
        f"✅ CVA {current_user.id} approved verification {verification_id}"
    )
    
    return verification


# ============================================
# 5. UPDATE - Reject verification (CVA only)
# ============================================
@router.post(
    "/{verification_id}/reject",
    response_model=VerificationResponse,
    summary="Từ chối verification",
    description="CVA từ chối verification nếu dữ liệu không hợp lệ"
)
async def reject_verification(
    verification_id: str = Path(..., description="Verification ID"),
    data: VerificationReject = ...,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_cva_user)
):
    """
    CVA từ chối verification
    
    **Lý do thường gặp:**
    - GPS data không chính xác
    - Khoảng cách không khớp
    - Thông tin xe không hợp lệ
    - Phát hiện dấu hiệu gian lận
    
    **Process:**
    1. Kiểm tra status = PENDING
    2. Update status → REJECTED
    3. Lưu remarks (bắt buộc, min 10 chars)
    4. Publish event VerificationRejected
    5. Notification Service thông báo EV Owner
    
    **Input:**
    - remarks: Lý do từ chối (required, min 10 chars)
    
    **Authorization:**
    - Chỉ CVA mới được reject
    """
    service = VerificationService(db)
    
    verification = service.reject_verification(
        verification_id=verification_id,
        verifier_id=current_user.id,
        remarks=data.remarks
    )
    
    logger.warning(
        f"❌ CVA {current_user.id} rejected verification {verification_id}"
    )
    
    return verification


# ============================================
# 6. STATISTICS - Thống kê
# ============================================
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
    """
    Thống kê verifications
    
    **Returns:**
    - total: Tổng số verifications
    - pending: Số đang chờ duyệt
    - approved: Số đã duyệt
    - rejected: Số bị từ chối
    - approval_rate: Tỷ lệ phê duyệt (%)
    - total_co2_saved: Tổng CO2 saved (approved only)
    - total_credits: Tổng credits (approved only)
    
    **Authorization:**
    - EV Owner: Chỉ xem stats của mình
    - CVA/Admin: Xem tất cả hoặc filter theo user
    """
    service = VerificationService(db)
    
    # EV Owner chỉ xem stats của mình
    if current_user.role == "EV_OWNER":
        user_id = current_user.id
    
    stats = service.get_statistics(user_id=user_id)
    
    return VerificationStats(**stats)