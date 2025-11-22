# ============================================
# Pydantic Schemas (Validation & Serialization)
# ============================================
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from decimal import Decimal
from enum import Enum



class VerificationStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class Priority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class VerificationCreate(BaseModel):
    """
    Schema để tạo verification mới (từ MRV Service)
    """
    trip_id: str = Field(..., description="Trip ID từ MRV Service")
    user_id: str = Field(..., description="EV Owner ID")
    co2_saved_kg: Decimal = Field(..., gt=0, description="CO2 giảm (kg)")
    credits_suggested: Decimal = Field(..., gt=0, description="Tín chỉ đề xuất (tonnes)")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "trip_id": "trip-001",
                "user_id": "user-001",
                "co2_saved_kg": 2.5,
                "credits_suggested": 0.0025
            }
        }
    )


class VerificationApprove(BaseModel):
    """
    Schema để CVA phê duyệt verification
    """
    remarks: Optional[str] = Field(
        None, 
        max_length=2000,
        description="Ghi chú của CVA"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "remarks": "Data verified, GPS log checked, approved"
            }
        }
    )

class VerificationReject(BaseModel):
    """
    Schema để CVA từ chối verification
    """
    remarks: str = Field(
        ..., 
        min_length=10,
        max_length=2000,
        description="Lý do từ chối (bắt buộc)"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "remarks": "GPS data inconsistent, distance calculation error"
            }
        }
    )



class VerificationResponse(BaseModel):
    """
    Schema response cho verification
    """
    id: str
    trip_id: str
    user_id: str
    verifier_id: Optional[str] = None
    
    co2_saved_kg: Decimal
    credits_suggested: Decimal
    
    status: VerificationStatus
    remarks: Optional[str] = None
    
    signature_hash: Optional[str] = None
    signed_at: Optional[datetime] = None
    
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "verif-001",
                "trip_id": "trip-001",
                "user_id": "user-001",
                "verifier_id": "cva-001",
                "co2_saved_kg": 2.5,
                "credits_suggested": 0.0025,
                "status": "APPROVED",
                "remarks": "Approved",
                "signature_hash": "abc123...",
                "signed_at": "2024-01-15T10:30:00",
                "created_at": "2024-01-15T10:00:00",
                "updated_at": "2024-01-15T10:30:00"
            }
        }
    )


class VerificationListResponse(BaseModel):
    """
    Schema response cho danh sách verifications
    """
    items: list[VerificationResponse]
    total: int
    page: int
    page_size: int
    
    @property
    def total_pages(self) -> int:
        return (self.total + self.page_size - 1) // self.page_size

class ApiResponse(BaseModel):
    """
    Generic wrapper cho tất cả API responses
    """
    success: bool
    message: str
    data: Optional[dict] = None
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "message": "Operation successful",
                "data": {}
            }
        }
    )


class VerificationStats(BaseModel):
    """
    Thống kê verifications
    """
    total: int
    pending: int
    approved: int
    rejected: int
    approval_rate: float
    total_co2_saved: Decimal
    total_credits: Decimal