from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.certificate import VerificationMethod

''' thêm các schema Pydantic cho chức năng xác minh chứng chỉ

- Tạo VerificationBase với các trường chung: cert_id, verified_by, verification_method
- Thêm VerificationCreate phục vụ tạo bản ghi xác minh mới
- Thêm VerificationUpdate hỗ trợ cập nhật phương thức xác minh
- Tạo VerificationResponse gồm id, thời gian xác minh và phương thức xác minh
- Bổ sung ví dụ minh họa dữ liệu trả về trong json_schema_extra
- Thêm VerificationListResponse để trả danh sách xác minh
- Thêm VerificationStatsResponse để thống kê tổng số xác minh theo từng loại'''

class VerificationBase(BaseModel):
    """Base schema for certificate verification"""
    cert_id: int = Field(..., gt=0, description="Certificate ID")
    verified_by: Optional[int] = Field(None, description="User ID who verified")
    verification_method: VerificationMethod = Field(
        default=VerificationMethod.SYSTEM,
        description="Verification method"
    )

class VerificationCreate(VerificationBase):
    """Schema for creating a verification record"""
    pass

class VerificationUpdate(BaseModel):
    """Schema for updating verification (rarely used)"""
    verification_method: Optional[VerificationMethod] = None

class VerificationResponse(BaseModel):
    """Schema for verification response"""
    id: int
    cert_id: int
    verified_by: Optional[int]
    verified_at: datetime
    verification_method: VerificationMethod
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "cert_id": 123,
                "verified_by": 456,
                "verified_at": "2024-01-01T12:00:00",
                "verification_method": "manual"
            }
        }

class VerificationListResponse(BaseModel):
    """Schema for list of verifications"""
    total: int
    items: list[VerificationResponse]

class VerificationStatsResponse(BaseModel):
    """Schema for verification statistics"""
    certificate_id: int
    total_verifications: int
    system_verifications: int
    manual_verifications: int
    public_verifications: int
    last_verified_at: Optional[datetime]
    
    class Config:
        json_schema_extra = {
            "example": {
                "certificate_id": 123,
                "total_verifications": 15,
                "system_verifications": 10,
                "manual_verifications": 3,
                "public_verifications": 2,
                "last_verified_at": "2024-01-01T12:00:00"
            }
        }