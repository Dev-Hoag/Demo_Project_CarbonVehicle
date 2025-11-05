# ============================================
# Database operations (CRUD)
# ============================================
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, asc, func

from app.models.verification import Verification, VerificationStatus
from app.utils.logger import logger


class VerificationRepository:
    """
    Repository để tương tác với database cho Verification
    Pattern: Repository Pattern (tách biệt data access khỏi business logic)
    """
    
    def __init__(self, db: Session):
        """
        Args:
            db: SQLAlchemy Session
        """
        self.db = db
    
    # ========================================
    # CREATE
    # ========================================
    def create(self, verification: Verification) -> Verification:
        """
        Tạo verification mới trong database
        
        Args:
            verification: Verification object
            
        Returns:
            Verification đã tạo (với timestamps)
            
        Raises:
            IntegrityError: Nếu trip_id đã tồn tại (unique constraint)
        """
        try:
            self.db.add(verification)
            self.db.commit()
            self.db.refresh(verification)
            logger.info(f"✅ Created verification {verification.id}")
            return verification
        except Exception as e:
            self.db.rollback()
            logger.error(f"❌ Error creating verification: {str(e)}")
            raise
    
    # ========================================
    # READ - Single
    # ========================================
    def get_by_id(self, verification_id: str) -> Optional[Verification]:
        """
        Lấy verification theo ID
        
        Args:
            verification_id: UUID của verification
            
        Returns:
            Verification object hoặc None
        """
        return self.db.query(Verification).filter(
            Verification.id == verification_id
        ).first()
    
    def get_by_trip_id(self, trip_id: str) -> Optional[Verification]:
        """
        Lấy verification theo trip_id
        
        Args:
            trip_id: UUID của trip
            
        Returns:
            Verification object hoặc None
        """
        return self.db.query(Verification).filter(
            Verification.trip_id == trip_id
        ).first()
    
    # ========================================
    # READ - List với Filter & Pagination
    # ========================================
    def get_list(
        self,
        status: Optional[VerificationStatus] = None,
        user_id: Optional[str] = None,
        verifier_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "DESC"
    ) -> Tuple[List[Verification], int]:
        """
        Lấy danh sách verifications với filter và pagination
        
        Args:
            status: Filter theo status (PENDING, APPROVED, REJECTED)
            user_id: Filter theo EV Owner
            verifier_id: Filter theo CVA
            page: Trang hiện tại (bắt đầu từ 1)
            page_size: Số items mỗi trang
            sort_by: Field để sort (created_at, updated_at, co2_saved_kg)
            sort_order: ASC hoặc DESC
            
        Returns:
            Tuple (danh sách verifications, tổng số records)
            
        Example:
            items, total = repo.get_list(
                status=VerificationStatus.PENDING,
                page=1,
                page_size=10
            )
        """
        try:
            # Base query
            query = self.db.query(Verification)
            
            # Build filters
            filters = []
            
            if status:
                filters.append(Verification.status == status)
            
            if user_id:
                filters.append(Verification.user_id == user_id)
            
            if verifier_id:
                filters.append(Verification.verifier_id == verifier_id)
            
            # Apply filters
            if filters:
                query = query.filter(and_(*filters))
            
            # Get total count (before pagination)
            total = query.count()
            
            # Apply sorting
            sort_column = getattr(Verification, sort_by, Verification.created_at)
            if sort_order.upper() == "DESC":
                query = query.order_by(desc(sort_column))
            else:
                query = query.order_by(asc(sort_column))
            
            # Apply pagination
            offset = (page - 1) * page_size
            items = query.offset(offset).limit(page_size).all()
            
            logger.info(
                f"📋 Retrieved {len(items)}/{total} verifications "
                f"(page {page}, status: {status})"
            )
            
            return items, total
            
        except Exception as e:
            logger.error(f"❌ Error getting verification list: {str(e)}")
            raise
    
    # ========================================
    # UPDATE
    # ========================================
    def update(self, verification: Verification) -> Verification:
        """
        Cập nhật verification trong database
        
        Args:
            verification: Verification object đã modify
            
        Returns:
            Verification đã update
            
        Note:
            Không cần gọi db.add() vì object đã trong session
            Chỉ cần commit để persist changes
        """
        try:
            self.db.commit()
            self.db.refresh(verification)
            logger.info(f"✅ Updated verification {verification.id}")
            return verification
        except Exception as e:
            self.db.rollback()
            logger.error(f"❌ Error updating verification: {str(e)}")
            raise
    
    # ========================================
    # DELETE (soft delete - update status thay vì xóa)
    # ========================================
    def delete(self, verification_id: str) -> bool:
        """
        Xóa verification (hard delete)
        
        Args:
            verification_id: UUID của verification
            
        Returns:
            True nếu xóa thành công, False nếu không tìm thấy
            
        Note:
            Trong production nên dùng soft delete (update status thay vì xóa)
        """
        try:
            verification = self.get_by_id(verification_id)
            if not verification:
                return False
            
            self.db.delete(verification)
            self.db.commit()
            logger.warning(f"🗑️ Deleted verification {verification_id}")
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"❌ Error deleting verification: {str(e)}")
            raise
    
    # ========================================
    # STATISTICS
    # ========================================
    def get_statistics(self, user_id: Optional[str] = None) -> dict:
        """
        Lấy thống kê verifications
        
        Args:
            user_id: Filter theo user (optional)
            
        Returns:
            Dict chứa stats:
            - total: Tổng số verifications
            - pending: Số PENDING
            - approved: Số APPROVED
            - rejected: Số REJECTED
            - total_co2: Tổng CO2 saved (approved only)
            - total_credits: Tổng credits (approved only)
        """
        query = self.db.query(Verification)
        
        if user_id:
            query = query.filter(Verification.user_id == user_id)
        
        total = query.count()
        pending = query.filter(
            Verification.status == VerificationStatus.PENDING
        ).count()
        approved = query.filter(
            Verification.status == VerificationStatus.APPROVED
        ).count()
        rejected = query.filter(
            Verification.status == VerificationStatus.REJECTED
        ).count()
        
        # Total CO2 và credits (chỉ approved)
        approved_query = query.filter(
            Verification.status == VerificationStatus.APPROVED
        )
        
        total_co2 = approved_query.with_entities(
            func.sum(Verification.co2_saved_kg)
        ).scalar() or 0
        
        total_credits = approved_query.with_entities(
            func.sum(Verification.credits_suggested)
        ).scalar() or 0
        
        return {
            "total": total,
            "pending": pending,
            "approved": approved,
            "rejected": rejected,
            "total_co2": float(total_co2),
            "total_credits": float(total_credits)
        }
    
    # ========================================
    # BATCH OPERATIONS
    # ========================================
    def get_pending_count(self) -> int:
        """Đếm số verifications PENDING"""
        return self.db.query(Verification).filter(
            Verification.status == VerificationStatus.PENDING
        ).count()
    
    def get_by_verifier(self, verifier_id: str) -> List[Verification]:
        """Lấy tất cả verifications của một CVA"""
        return self.db.query(Verification).filter(
            Verification.verifier_id == verifier_id
        ).order_by(desc(Verification.created_at)).all()
