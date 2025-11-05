from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.api.deps import get_current_user, CurrentUser
from app.schemas.verification import VerificationCreate, VerificationResponse
from app.services.verification_service import VerificationService
from app.utils.logger import logger


router = APIRouter()


@router.post(
    "/",
    response_model=VerificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo verification mới",
    description="Endpoint để MRV Service tạo verification request sau khi tính CO2",
)
async def create_verification(
    data: VerificationCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    service = VerificationService(db)

    verification = service.create_verification(
        trip_id=data.trip_id,
        user_id=data.user_id,
        co2_saved_kg=data.co2_saved_kg,
        credits_suggested=data.credits_suggested,
    )

    logger.info(f"📝 Created verification {verification.id} via API")

    return verification


