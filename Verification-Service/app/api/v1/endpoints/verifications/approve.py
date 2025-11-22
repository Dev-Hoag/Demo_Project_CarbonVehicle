from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.api.deps import get_current_cva_user, CurrentUser
from app.schemas.verification import VerificationApprove, VerificationResponse
from app.services.verification_service import VerificationService
from app.utils.logger import logger

router = APIRouter()

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
    service = VerificationService(db)
    verification = service.approve_verification(
        verification_id=verification_id,
        verifier_id=current_user.id,
        remarks=data.remarks
    )
    logger.info(f"✅ CVA {current_user.id} approved verification {verification_id}")
    return verification
