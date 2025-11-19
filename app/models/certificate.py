from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, Enum, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class CertificateStatus(str, enum.Enum):
    valid = "valid"
    expired = "expired"
    revoked = "revoked"

class Certificate(Base):
    __tablename__ = "certificates"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    verification_id = Column(Integer, nullable=False, index=True)
    trip_id = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    credit_amount = Column(DECIMAL(10, 2), nullable=False)
    cert_hash = Column(String(255), unique=True, nullable=False, index=True)
    issue_date = Column(DateTime, default=func.now())
    pdf_url = Column(String(255), nullable=True)
    template_id = Column(Integer, ForeignKey('certificate_templates.id'), nullable=True)
    status = Column(Enum(CertificateStatus), default=CertificateStatus.valid)
    
    # Revocation fields
    revoke_reason = Column(Text, nullable=True)
    revoked_at = Column(DateTime, nullable=True)
    revoked_by = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    template = relationship("CertificateTemplate", back_populates="certificates")
    verifications = relationship("CertificateVerification", back_populates="certificate", cascade="all, delete-orphan")
    downloads = relationship("CertificateDownload", back_populates="certificate", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Certificate(id={self.id}, cert_hash={self.cert_hash}, status={self.status})>"


class CertificateTemplate(Base):
    __tablename__ = "certificate_templates"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    template_name = Column(String(100), nullable=False)
    pdf_template_path = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    certificates = relationship("Certificate", back_populates="template")
    
    def __repr__(self):
        return f"<CertificateTemplate(id={self.id}, name={self.template_name})>"


class VerificationMethod(str, enum.Enum):
    system = "system"
    manual = "manual"
    public = "public"

class CertificateVerification(Base):
    __tablename__ = "certificate_verifications"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    cert_id = Column(Integer, ForeignKey('certificates.id', ondelete='CASCADE'), nullable=False)
    verified_by = Column(Integer, nullable=True)
    verified_at = Column(DateTime, default=func.now())
    verification_method = Column(Enum(VerificationMethod), default=VerificationMethod.system)
    
    # Relationships
    certificate = relationship("Certificate", back_populates="verifications")
    
    def __repr__(self):
        return f"<CertificateVerification(id={self.id}, cert_id={self.cert_id}, method={self.verification_method})>"


class CertificateDownload(Base):
    __tablename__ = "certificate_downloads"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    cert_id = Column(Integer, ForeignKey('certificates.id', ondelete='CASCADE'), nullable=False)
    downloaded_by = Column(Integer, nullable=True)
    downloaded_at = Column(DateTime, default=func.now())
    
    # Relationships
    certificate = relationship("Certificate", back_populates="downloads")
    
    def __repr__(self):
        return f"<CertificateDownload(id={self.id}, cert_id={self.cert_id})>"