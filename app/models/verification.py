# ============================================
# SQLAlchemy Models (Database Tables)
# ============================================
from sqlalchemy import Column, String, DECIMAL, Enum, Text, TIMESTAMP
from sqlalchemy.sql import func
import enum
from app.config.database import Base

class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_REVIEW = "IN_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class Priority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class Verification(Base):
    __tablename__ = "verifications"
    
    id = Column(String(36), primary_key=True)
    trip_id = Column(String(36), nullable=False, unique=True)
    user_id = Column(String(36), nullable=False)
    cva_id = Column(String(36), nullable=True)
    
    co2_saved_kg = Column(DECIMAL(15, 4), nullable=False)
    credits_suggested = Column(DECIMAL(15, 4), nullable=False)
    trip_distance_km = Column(DECIMAL(10, 2), nullable=False)
    trip_date = Column(TIMESTAMP, nullable=False)
    
    status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING)
    priority = Column(Enum(Priority), default=Priority.MEDIUM)
    
    verified_co2_kg = Column(DECIMAL(15, 4), nullable=True)
    verified_credits = Column(DECIMAL(15, 4), nullable=True)
    verifier_remarks = Column(Text, nullable=True)
    
    signature_hash = Column(String(255), nullable=True)
    
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

