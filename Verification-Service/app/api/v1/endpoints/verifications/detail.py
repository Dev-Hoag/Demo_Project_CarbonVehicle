from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.api.deps import get_current_user, CurrentUser
from app.schemas.verification import VerificationResponse
from app.services.verification_service import VerificationService
from app.core.exceptions import NotFoundException

router = APIRouter()

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
    service = VerificationService(db)
    verification = service.get_verification(verification_id)
    if current_user.role == "EV_OWNER":
        if verification.user_id != current_user.id:
            raise NotFoundException("Verification not found")
    return verification
