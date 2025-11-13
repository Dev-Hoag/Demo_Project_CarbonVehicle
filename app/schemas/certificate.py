from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.models.certificate import CertificateStatus, VerificationMethod

# Certificate Schemas
class CertificateBase(BaseModel):
    verification_id: int
    trip_id: int
    user_id: int
    credit_amount: Decimal = Field(ge=0, decimal_places=2)

class CertificateCreate(CertificateBase):
    template_id: Optional[int] = 1

class CertificateUpdate(BaseModel):
    status: Optional[CertificateStatus] = None
    pdf_url: Optional[str] = None

class CertificateResponse(CertificateBase):
    id: int
    cert_hash: str
    issue_date: datetime
    pdf_url: Optional[str]
    template_id: Optional[int]
    status: CertificateStatus
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CertificateListResponse(BaseModel):
    total: int
    items: list[CertificateResponse]

# Template Schemas
class TemplateBase(BaseModel):
    template_name: str
    pdf_template_path: str
    description: Optional[str] = None
    is_active: bool = True

class TemplateCreate(TemplateBase):
    pass

class TemplateResponse(TemplateBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Verification Schemas
class VerificationCreate(BaseModel):
    cert_id: int
    verified_by: Optional[int] = None
    verification_method: VerificationMethod = VerificationMethod.system

class VerificationResponse(BaseModel):
    id: int
    cert_id: int
    verified_by: Optional[int]
    verified_at: datetime
    verification_method: VerificationMethod
    
    class Config:
        from_attributes = True

# Download Schemas
class DownloadCreate(BaseModel):
    cert_id: int
    downloaded_by: Optional[int] = None

class DownloadResponse(BaseModel):
    id: int
    cert_id: int
    downloaded_by: Optional[int]
    downloaded_at: datetime
    
    class Config:
        from_attributes = True

# Public Verification Response
class PublicVerificationResponse(BaseModel):
    valid: bool
    certificate: Optional[CertificateResponse] = None
    message: str

# Event Schemas
class TripVerifiedEvent(BaseModel):
    verification_id: int
    trip_id: int
    user_id: int
    credit_amount: Decimal
    verified_at: datetime
    
class CertificateGeneratedEvent(BaseModel):
    certificate_id: int
    user_id: int
    cert_hash: str
    credit_amount: Decimal
    pdf_url: Optional[str]
    issue_date: datetime