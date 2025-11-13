from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

from app.models import (
    Certificate,
    CertificateTemplate,
    CertificateVerification,
    CertificateDownload,
    CertificateStatus,
    VerificationMethod
)
from app.schemas import (
    CertificateCreate,
    CertificateUpdate,
    VerificationCreate,
    DownloadCreate
)
from app.services.hash_service import HashService
from app.services.pdf_generator import PDFGenerator
import logging

logger = logging.getLogger(__name__)

class CertificateService:
    """
    Business logic for certificate operations
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.hash_service = HashService()
        self.pdf_generator = PDFGenerator()
    
    def create_certificate(self, cert_data: CertificateCreate) -> Certificate:
        """
        Create a new certificate
        """
        # Tạo băm chứng chỉ
        hash_data = {
            "verification_id": cert_data.verification_id,
            "trip_id": cert_data.trip_id,
            "user_id": cert_data.user_id,
            "credit_amount": cert_data.credit_amount,
            "timestamp": datetime.utcnow().isoformat()
        }
        cert_hash = self.hash_service.generate_certificate_hash(hash_data)
        
        # Tạo bản ghi chứng chỉ trong cơ sở dữ liệu
        certificate = Certificate(
            verification_id=cert_data.verification_id,
            trip_id=cert_data.trip_id,
            user_id=cert_data.user_id,
            credit_amount=cert_data.credit_amount,
            cert_hash=cert_hash,
            template_id=cert_data.template_id,
            status=CertificateStatus.valid
        )
        
        self.db.add(certificate)
        self.db.commit()
        self.db.refresh(certificate)
        
        # Generate PDF
        try:
            pdf_data = {
                "id": certificate.id,
                "cert_hash": certificate.cert_hash,
                "user_id": certificate.user_id,
                "trip_id": certificate.trip_id,
                "credit_amount": certificate.credit_amount,
                "issue_date": certificate.issue_date,
                "verification_id": certificate.verification_id
            }
            
            pdf_path = self.pdf_generator.generate_certificate_pdf(pdf_data)
            pdf_url = self.pdf_generator.get_pdf_url(pdf_path)
            
            # Update certificate with PDF URL
            certificate.pdf_url = pdf_url
            self.db.commit()
            self.db.refresh(certificate)
            
        except Exception as e:
            logger.error(f"Error generating PDF for certificate {certificate.id}: {str(e)}")
        
        return certificate
    
    def get_certificate(self, cert_id: int) -> Optional[Certificate]:
        """
        Get certificate by ID
        """
        return self.db.query(Certificate).filter(Certificate.id == cert_id).first()
    
    def get_certificate_by_hash(self, cert_hash: str) -> Optional[Certificate]:
        """
        Get certificate by hash
        """
        return self.db.query(Certificate).filter(Certificate.cert_hash == cert_hash).first()
    
    def get_user_certificates(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Certificate], int]:
        """
        Get all certificates for a user
        """
        query = self.db.query(Certificate).filter(Certificate.user_id == user_id)
        total = query.count()
        certificates = query.offset(skip).limit(limit).all()
        return certificates, total
    
    def update_certificate(
        self,
        cert_id: int,
        update_data: CertificateUpdate
    ) -> Optional[Certificate]:
        """
        Update certificate
        """
        certificate = self.get_certificate(cert_id)
        if not certificate:
            return None
        
        for field, value in update_data.dict(exclude_unset=True).items():
            setattr(certificate, field, value)
        
        self.db.commit()
        self.db.refresh(certificate)
        return certificate
    
    def verify_certificate(
        self,
        cert_id: int,
        verified_by: Optional[int] = None,
        verification_method: VerificationMethod = VerificationMethod.system
    ) -> Optional[CertificateVerification]:
        """
        Create verification record for certificate
        """
        certificate = self.get_certificate(cert_id)
        if not certificate:
            return None
        
        verification = CertificateVerification(
            cert_id=cert_id,
            verified_by=verified_by,
            verification_method=verification_method
        )
        
        self.db.add(verification)
        self.db.commit()
        self.db.refresh(verification)
        
        return verification
    
    def log_download(
        self,
        cert_id: int,
        downloaded_by: Optional[int] = None
    ) -> Optional[CertificateDownload]:
        """
        Log certificate download
        """
        certificate = self.get_certificate(cert_id)
        if not certificate:
            return None
        
        download = CertificateDownload(
            cert_id=cert_id,
            downloaded_by=downloaded_by
        )
        
        self.db.add(download)
        self.db.commit()
        self.db.refresh(download)
        
        return download
    
    def verify_certificate_hash(self, cert_hash: str) -> tuple[bool, Optional[Certificate]]:
        """
        Verify certificate by hash
        """
        certificate = self.get_certificate_by_hash(cert_hash)
        
        if not certificate:
            return False, None
        
        if certificate.status != CertificateStatus.valid:
            return False, certificate
        
        return True, certificate
    
    # Template methods
    def get_template(self, template_id: int) -> Optional[CertificateTemplate]:
        """
        Get template by ID
        """
        return self.db.query(CertificateTemplate).filter(
            CertificateTemplate.id == template_id
        ).first()
    
    def get_active_templates(self) -> List[CertificateTemplate]:
        """
        Get all active templates
        """
        return self.db.query(CertificateTemplate).filter(
            CertificateTemplate.is_active == True
        ).all()