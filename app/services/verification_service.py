# ============================================
# Business Logic
# ============================================
from datetime import datetime
from decimal import Decimal
from typing import Optional
import uuid
import hashlib

from sqlalchemy.orm import Session
from app.models.verification import Verification, VerificationStatus
from app.repositories.verification_repository import VerificationRepository
from app.core.exceptions import NotFoundException, ValidationException
from app.utils.logger import logger

class VerificationService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = VerificationRepository(db)
    
    def create_verification(
        self,
        trip_id: str,
        user_id: str,
        co2_saved_kg: Decimal,
        credits_suggested: Decimal,
        trip_distance_km: Decimal,
        trip_date: datetime
    ) -> Verification:
        """Tạo verification mới"""
        
        # Tạo verification object
        verification = Verification(
            id=str(uuid.uuid4()),
            trip_id=trip_id,
            user_id=user_id,
            co2_saved_kg=co2_saved_kg,
            credits_suggested=credits_suggested,
            trip_distance_km=trip_distance_km,
            trip_date=trip_date,
            status=VerificationStatus.PENDING
        )
        
        verification = self.repository.create(verification)
        logger.info(f"Created verification {verification.id}")
        
        return verification
    
    def get_verification(self, verification_id: str) -> Verification:
        """Lấy verification theo ID"""
        verification = self.repository.get_by_id(verification_id)
        if not verification:
            raise NotFoundException(f"Verification {verification_id} not found")
        return verification
    
    def get_verifications(
        self,
        status: Optional[VerificationStatus] = None,
        page: int = 1,
        page_size: int = 20
    ):
        """Lấy danh sách verifications"""
        items, total = self.repository.get_list(status, page, page_size)
        return items, total
    
    def approve_verification(
        self,
        verification_id: str,
        cva_id: str,
        verified_co2_kg: Decimal,
        verified_credits: Decimal,
        verifier_remarks: Optional[str] = None
    ) -> Verification:
        """CVA phê duyệt verification"""
        
        verification = self.get_verification(verification_id)
        
        if verification.status != VerificationStatus.IN_REVIEW:
            raise ValidationException("Can only approve IN_REVIEW verifications")
        
        # Tạo digital signature
        signature_data = f"{verification_id}{cva_id}{verified_credits}{datetime.utcnow()}"
        signature_hash = hashlib.sha256(signature_data.encode()).hexdigest()
        
        # Update verification
        verification.status = VerificationStatus.APPROVED
        verification.cva_id = cva_id
        verification.verified_co2_kg = verified_co2_kg
        verification.verified_credits = verified_credits
        verification.verifier_remarks = verifier_remarks
        verification.signature_hash = signature_hash
        
        verification = self.repository.update(verification)
        
        logger.info(f"Approved verification {verification_id} by CVA {cva_id}")
        
        return verification
    
    def reject_verification(
        self,
        verification_id: str,
        cva_id: str,
        verifier_remarks: str
    ) -> Verification:
        """CVA từ chối verification"""
        
        verification = self.get_verification(verification_id)
        
        if verification.status != VerificationStatus.IN_REVIEW:
            raise ValidationException("Can only reject IN_REVIEW verifications")
        
        verification.status = VerificationStatus.REJECTED
        verification.cva_id = cva_id
        verification.verifier_remarks = verifier_remarks
        
        verification = self.repository.update(verification)
        
        logger.info(f"Rejected verification {verification_id} by CVA {cva_id}")
        
        return verification