# ============================================
# Business Logic
# ============================================
from datetime import datetime
from decimal import Decimal
from typing import Optional
import uuid
import hashlib
import json

from sqlalchemy.orm import Session
from app.models.verification import Verification, VerificationStatus
from app.repositories.verification_repository import VerificationRepository
from app.core.exceptions import NotFoundException, ValidationException
from app.utils.logger import logger
from app.events.event_publisher import EventPublisher
from app.events.event_definitions import EventType

class VerificationService:
    """
    Service xử lý business logic cho Verification
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = VerificationRepository(db)
    
    def create_verification(
        self,
        trip_id: str,
        user_id: str,
        co2_saved_kg: Decimal,
        credits_suggested: Decimal
    ) -> Verification:
        """
        Tạo verification mới từ MRV Service
        
        Args:
            trip_id: ID của trip từ MRV Service
            user_id: ID của EV Owner
            co2_saved_kg: Lượng CO2 giảm (kg)
            credits_suggested: Tín chỉ đề xuất (tonnes)
            
        Returns:
            Verification object đã tạo
        """
        # Kiểm tra trip_id đã tồn tại chưa
        existing = self.repository.get_by_trip_id(trip_id)
        if existing:
            raise ValidationException(
                f"Verification already exists for trip {trip_id}"
            )
        
        # Tạo verification
        verification = Verification(
            id=str(uuid.uuid4()),
            trip_id=trip_id,
            user_id=user_id,
            co2_saved_kg=co2_saved_kg,
            credits_suggested=credits_suggested,
            status=VerificationStatus.PENDING
        )
        
        verification = self.repository.create(verification)
        
        logger.info(
            f"✅ Created verification {verification.id} "
            f"for trip {trip_id} (CO2: {co2_saved_kg}kg)"
        )
        
        return verification
    
    # ========================================
    # READ
    # ========================================
    def get_verification(self, verification_id: str) -> Verification:
        """Lấy verification theo ID"""
        verification = self.repository.get_by_id(verification_id)
        if not verification:
            raise NotFoundException(
                f"Verification {verification_id} not found"
            )
        return verification
    
    def get_verifications(
        self,
        status: Optional[VerificationStatus] = None,
        user_id: Optional[str] = None,
        verifier_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "DESC"
    ):
        """
        Lấy danh sách verifications với filter và sorting
        
        Returns:
            Tuple (items, total)
        """
        return self.repository.get_list(
            status=status,
            user_id=user_id,
            verifier_id=verifier_id,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order
        )
    
    # ========================================
    # UPDATE - APPROVE
    # ========================================
    def approve_verification(
        self,
        verification_id: str,
        verifier_id: str,
        remarks: Optional[str] = None
    ) -> Verification:
        """
        CVA phê duyệt verification
        
        Process:
        1. Kiểm tra status = PENDING
        2. Tạo digital signature
        3. Update status → APPROVED
        4. Log & return
        
        Args:
            verification_id: ID của verification
            verifier_id: ID của CVA
            remarks: Ghi chú (optional)
            
        Returns:
            Verification đã approve
        """
        verification = self.get_verification(verification_id)
        
        # Validate status
        if verification.status != VerificationStatus.PENDING:
            raise ValidationException(
                f"Can only approve PENDING verifications. "
                f"Current status: {verification.status}"
            )
        
        # Tạo digital signature
        signature_data = {
            "verification_id": verification_id,
            "trip_id": verification.trip_id,
            "user_id": verification.user_id,
            "verifier_id": verifier_id,
            "co2_saved_kg": str(verification.co2_saved_kg),
            "credits_suggested": str(verification.credits_suggested),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        signature_string = json.dumps(signature_data, sort_keys=True)
        signature_hash = hashlib.sha256(signature_string.encode()).hexdigest()
        
        # Update verification
        verification.status = VerificationStatus.APPROVED
        verification.verifier_id = verifier_id
        verification.remarks = remarks
        verification.signature_hash = signature_hash
        verification.signed_at = datetime.utcnow()
        
        verification = self.repository.update(verification)
        
        logger.info(
            f"✅ APPROVED verification {verification_id} "
            f"by CVA {verifier_id} "
            f"(Credits: {verification.credits_suggested})"
        )
        
        # Publish VerificationApproved event → Registry/Wallet Service sẽ mint credits vào ví
        EventPublisher.publish(
            EventType.VERIFICATION_APPROVED,
            {
                'verification_id': verification.id,
                'trip_id': verification.trip_id,
                'user_id': verification.user_id,
                'verifier_id': verifier_id,
                'credits_amount': float(verification.credits_suggested),
                'co2_saved_kg': float(verification.co2_saved_kg),
                'signature_hash': verification.signature_hash,
                'approved_at': verification.signed_at.isoformat() if verification.signed_at else datetime.utcnow().isoformat(),
                'remarks': remarks
            }
        )
        logger.info(f"📤 Published VerificationApproved event for verification {verification_id}")
        
        return verification
    
    # ========================================
    # UPDATE - REJECT
    # ========================================
    def reject_verification(
        self,
        verification_id: str,
        verifier_id: str,
        remarks: str
    ) -> Verification:
        """
        CVA từ chối verification
        
        Args:
            verification_id: ID của verification
            verifier_id: ID của CVA
            remarks: Lý do từ chối (bắt buộc)
            
        Returns:
            Verification đã reject
        """
        verification = self.get_verification(verification_id)
        
        # Validate status
        if verification.status != VerificationStatus.PENDING:
            raise ValidationException(
                f"Can only reject PENDING verifications. "
                f"Current status: {verification.status}"
            )
        
        # Validate remarks
        if not remarks or len(remarks) < 10:
            raise ValidationException(
                "Remarks must be at least 10 characters for rejection"
            )
        
        # Update verification
        verification.status = VerificationStatus.REJECTED
        verification.verifier_id = verifier_id
        verification.remarks = remarks
        
        verification = self.repository.update(verification)
        
        logger.warning(
            f"❌ REJECTED verification {verification_id} "
            f"by CVA {verifier_id} "
            f"Reason: {remarks[:50]}..."
        )
        
        # Publish VerificationRejected event → Notification Service thông báo cho EV Owner
        EventPublisher.publish(
            EventType.VERIFICATION_REJECTED,
            {
                'verification_id': verification.id,
                'trip_id': verification.trip_id,
                'user_id': verification.user_id,
                'verifier_id': verifier_id,
                'reason': remarks,
                'rejected_at': datetime.utcnow().isoformat()
            }
        )
        logger.info(f"📤 Published VerificationRejected event for verification {verification_id}")
        
        return verification
    
    # ========================================
    # STATISTICS
    # ========================================
    def get_statistics(
        self, 
        user_id: Optional[str] = None
    ) -> dict:
        """
        Thống kê verifications
        
        Returns:
            Dict chứa stats
        """
        stats = self.repository.get_statistics(user_id)
        
        return {
            "total": stats["total"],
            "pending": stats["pending"],
            "approved": stats["approved"],
            "rejected": stats["rejected"],
            "approval_rate": round(
                (stats["approved"] / stats["total"] * 100) 
                if stats["total"] > 0 else 0, 
                2
            ),
            "total_co2_saved": float(stats["total_co2"]),
            "total_credits": float(stats["total_credits"])
        }
