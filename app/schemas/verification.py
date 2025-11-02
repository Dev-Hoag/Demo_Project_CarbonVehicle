# ============================================
# Pydantic Schemas (Validation & Serialization)
# ============================================
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal
from enum import Enum

class VerificationStatus(str, Enum):
    PENDING = "PENDING"
    IN_REVIEW = "IN_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class Priority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

# Request Schemas
class VerificationCreate(BaseModel):
    trip_id: str
    user_id: str
    co2_saved_kg: Decimal = Field(gt=0)
    credits_suggested: Decimal = Field(gt=0)
    trip_distance_km: Decimal = Field(gt=0)
    trip_date: datetime

class VerificationApprove(BaseModel):
    verified_co2_kg: Decimal = Field(gt=0)
    verified_credits: Decimal = Field(gt=0)
    verifier_remarks: Optional[str] = None

class VerificationReject(BaseModel):
    verifier_remarks: str = Field(min_length=10)

# Response Schema
class VerificationResponse(BaseModel):
    id: str
    trip_id: str
    user_id: str
    cva_id: Optional[str]
    co2_saved_kg: Decimal
    credits_suggested: Decimal
    status: VerificationStatus
    verified_credits: Optional[Decimal]
    created_at: datetime
    
    class Config:
        from_attributes = True

# List Response
class VerificationListResponse(BaseModel):
    items: list[VerificationResponse]
    total: int
    page: int

# Generic API Response
class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None