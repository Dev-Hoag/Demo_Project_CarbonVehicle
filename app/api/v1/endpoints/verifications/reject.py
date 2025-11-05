from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.api.deps import get_current_cva_user, CurrentUser
from app.schemas.verification import VerificationReject, VerificationResponse
from app.services.verification_service import VerificationService
from app.utils.logger import logger


router = APIRouter()


@router.post(
    "/{verification_id}/reject",
    response_model=VerificationResponse,
    summary="Từ chối verification",
    description="CVA từ chối verification nếu dữ liệu không hợp lệ",
)
async def reject_verification(
    verification_id: str = Path(..., description="Verification ID"),
    data: VerificationReject = ...,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_cva_user),
):
    service = VerificationService(db)
    verification = service.reject_verification(
        verification_id=verification_id,
        verifier_id=current_user.id,
        remarks=data.remarks,
    )
    logger.warning(f"❌ CVA {current_user.id} rejected verification {verification_id}")
    return verification


