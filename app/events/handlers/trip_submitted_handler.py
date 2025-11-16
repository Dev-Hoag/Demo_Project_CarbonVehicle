from loguru import logger
from app.config.database import get_db
from app.models.verification import Verification, VerificationStatus
from app.events.event_publisher import EventPublisher
from app.events.event_definitions import EventType
from sqlalchemy.orm import Session
import uuid


def handle_trip_submitted(payload: dict):
    """
    Xử lý event TripSubmitted (từ MRV Service)
    
    Flow theo yêu cầu:
    1. MRV Service tính CO2 và gửi dữ liệu → CVA Service nhận event TripSubmitted
    2. Lưu verification record vào DB với status PENDING
    3. CVA sẽ xem xét và phê duyệt thủ công qua API (không tự động)
    4. Sau khi CVA approve → Publish VerificationApproved event để Registry/Wallet Service mint credits
    """
    db: Session = next(get_db())

    try:
        trip_id = payload.get("trip_id")
        user_id = payload.get("user_id")
        co2_saved = payload.get("co2_saved_kg") or payload.get("co2_saved")
        credits = payload.get("credits_suggested") or payload.get("credit_amount") or payload.get("credits")

        # Validate required fields
        if not trip_id or not user_id:
            logger.error(f"❌ Missing required fields: trip_id={trip_id}, user_id={user_id}")
            raise ValueError("trip_id and user_id are required")

        # Tạo verification record với status PENDING - chờ CVA xem xét
        verification_id = str(uuid.uuid4())
        new_verif = Verification(
            id=verification_id,
            trip_id=str(trip_id),
            user_id=str(user_id),
            co2_saved_kg=float(co2_saved) if co2_saved else 0.0,
            credits_suggested=float(credits) if credits else 0.0,
            status=VerificationStatus.PENDING
        )

        db.add(new_verif)
        db.commit()
        db.refresh(new_verif)
        logger.info(
            f"✅ Created verification record {verification_id} for trip {trip_id} "
            f"(CO2: {co2_saved}kg, Credits: {credits}) - Status: PENDING - Awaiting CVA review"
        )

    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to handle TripSubmitted event: {e}")
        raise
    finally:
        db.close()
