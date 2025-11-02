# ============================================
# Database operations (CRUD)
# ============================================
from sqlalchemy.orm import Session
from app.models.verification import Verification, VerificationStatus
from typing import List, Optional

class VerificationRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, verification: Verification) -> Verification:
        """Tạo verification mới"""
        self.db.add(verification)
        self.db.commit()
        self.db.refresh(verification)
        return verification
    
    def get_by_id(self, verification_id: str) -> Optional[Verification]:
        """Lấy verification theo ID"""
        return self.db.query(Verification).filter(
            Verification.id == verification_id
        ).first()
    
    def get_list(
        self, 
        status: Optional[VerificationStatus] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Verification], int]:
        """Lấy danh sách verifications"""
        query = self.db.query(Verification)
        
        if status:
            query = query.filter(Verification.status == status)
        
        total = query.count()
        
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        
        return items, total
    
    def update(self, verification: Verification) -> Verification:
        """Cập nhật verification"""
        self.db.commit()
        self.db.refresh(verification)
        return verification

