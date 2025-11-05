# ============================================
# SQLAlchemy Models (Database Tables)
# ============================================
import enum

from sqlalchemy import DECIMAL, TIMESTAMP, Column, Enum, Index, String, Text, Boolean
from sqlalchemy.sql import func

from app.config.database import Base


class VerificationStatus(str, enum.Enum):
    """Trạng thái xác minh"""
    PENDING = "PENDING"      # Chờ CVA xác minh
    APPROVED = "APPROVED"    # Đã phê duyệt
    REJECTED = "REJECTED"    # Bị từ chối

class Priority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class Verification(Base):
    """
    Bảng verifications - Lưu hồ sơ xác minh tín chỉ carbon
    
    Các trường chính:
    - id: UUID của verification 
    - trip_id: Liên kết đến Trip trong MRV Service
    - user_id: EV Owner ID (người sở hữu trip)
    - verifier_id: CVA ID (người xác minh)
    - co2_saved_kg: Lượng CO2 giảm phát thải (kg)           
    - credits_suggested: Số tín chỉ đề xuất (tonnes CO2e)
    - status: Trạng thái xác minh (PENDING, APPROVED, REJECTED
    - remarks: Ghi chú của CVA (lý do approve/reject)
    - signature_hash: Chữ ký số SHA256 của CVA
    - signed_at: Thời gian CVA ký
    - created_at: Thời gian tạo record
    - updated_at: Thời gian cập nhật cuối
    """
    __tablename__ = "verifications"
    

    id = Column(
        String(36), 
        primary_key=True,
        comment="UUID của verification"
    )
    
    trip_id = Column(
        String(36), 
        nullable=False, 
        unique=True,
        comment="Link đến Trip trong MRV Service"
    )
    
    user_id = Column(
        String(36), 
        nullable=False,
        comment="EV Owner ID (người sở hữu trip)"
    )
    
    verifier_id = Column(
        String(36), 
        nullable=True,
        comment="CVA ID (người xác minh)"
    )
    
    co2_saved_kg = Column(
        DECIMAL(15, 4), 
        nullable=False,
        comment="Lượng CO2 giảm phát thải (kg)"
    )
    
    credits_suggested = Column(
        DECIMAL(15, 4), 
        nullable=False,
        comment="Số tín chỉ đề xuất (tonnes CO2e)"
    )
    
    status = Column(
        Enum(VerificationStatus), 
        default=VerificationStatus.PENDING,
        nullable=False,
        comment="Trạng thái xác minh"
    )
    
    remarks = Column(
        Text, 
        nullable=True,
        comment="Ghi chú của CVA (lý do approve/reject)"
    )
    
    signature_hash = Column(
        String(255), 
        nullable=True,
        comment="Chữ ký số SHA256 của CVA"
    )
    
    signed_at = Column(
        TIMESTAMP, 
        nullable=True,
        comment="Thời gian CVA ký"
    )
    
    created_at = Column(
        TIMESTAMP, 
        server_default=func.now(),
        nullable=False,
        comment="Thời gian tạo record"
    )
    
    updated_at = Column(
        TIMESTAMP, 
        server_default=func.now(), 
        onupdate=func.now(),
        nullable=False,
        comment="Thời gian cập nhật cuối"
    )

    __table_args__ = (
        Index('idx_status', 'status'),
        Index('idx_user_id', 'user_id'),
        Index('idx_verifier_id', 'verifier_id'),
        Index('idx_trip_id', 'trip_id'),
        Index('idx_created_at', 'created_at'),
    )
    
    def __repr__(self):
        return f"<Verification(id={self.id}, trip_id={self.trip_id}, status={self.status})>"


class VerificationEvent(Base):
    """
    Bảng verification_events - Lưu events để publish qua Kafka
    (Outbox Pattern - đảm bảo eventual consistency)
    """
    __tablename__ = "verification_events"
    
    id = Column(String(36), primary_key=True)
    verification_id = Column(String(36), nullable=False)
    
    event_type = Column(
        String(50), 
        nullable=False,
        comment="APPROVED, REJECTED"
    )
    
    payload = Column(
        Text, 
        nullable=False,
        comment="JSON data của event"
    )
    
    published = Column(
        Boolean,
        default=False,
        comment="Đã publish qua Kafka chưa"
    )
    
    created_at = Column(TIMESTAMP, server_default=func.now())
    published_at = Column(TIMESTAMP, nullable=True)
    
    __table_args__ = (
        Index('idx_published', 'published'),
        Index('idx_verification_id', 'verification_id'),
    )
