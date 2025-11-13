from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
import os

from app.database import get_db
from app.services import CertificateService
from app.schemas import (
    CertificateCreate,
    CertificateResponse,
    CertificateListResponse,
    PublicVerificationResponse,
    VerificationResponse
)
from app.models import VerificationMethod
from app.messaging.publisher import (
    publish_certificate_verified,
    publish_certificate_downloaded
)
from fastapi.responses import FileResponse
from app.config import settings

router = APIRouter(prefix="/api/certificates", tags=["Certificates"])

# Internal endpoint - Generate certificate
@router.post("/generate", response_model=CertificateResponse, status_code=status.HTTP_201_CREATED)
def generate_certificate(
    cert_data: CertificateCreate,
    db: Session = Depends(get_db)
):
    """
    [Internal] Generate a new certificate after trip verification
    """
    try:
        service = CertificateService(db)
        certificate = service.create_certificate(cert_data)
        return certificate
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate certificate: {str(e)}"
        )

# List user's certificates
@router.get("", response_model=CertificateListResponse)
def list_certificates(
    user_id: int = Query(..., description="User ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    List all certificates for a user
    """
    service = CertificateService(db)
    certificates, total = service.get_user_certificates(user_id, skip, limit)
    
    return {
        "total": total,
        "items": certificates
    }

# Get certificate details
@router.get("/{cert_id}", response_model=CertificateResponse)
def get_certificate(
    cert_id: int,
    db: Session = Depends(get_db)
):
    """
    Get certificate details by ID
    """
    service = CertificateService(db)
    certificate = service.get_certificate(cert_id)
    
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found"
        )
    
    return certificate

# Download certificate PDF
@router.get("/{cert_id}/download")
def download_certificate(
    cert_id: int,
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Download certificate PDF file
    """
    service = CertificateService(db)
    certificate = service.get_certificate(cert_id)
    
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found"
        )
    
    if not certificate.pdf_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate PDF not available"
        )
    
    # Log download
    service.log_download(cert_id, user_id)
    publish_certificate_downloaded(cert_id, user_id)
    
    # Get file path
    filename = certificate.pdf_url.split("/")[-1]
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate file not found"
        )
    
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=filename
    )

# Verify certificate
@router.post("/{cert_id}/verify", response_model=VerificationResponse)
def verify_certificate(
    cert_id: int,
    verified_by: Optional[int] = Query(None),
    method: VerificationMethod = Query(VerificationMethod.manual),
    db: Session = Depends(get_db)
):
    """
    Verify certificate validity
    """
    service = CertificateService(db)
    
    verification = service.verify_certificate(cert_id, verified_by, method)
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found"
        )
    
    # Publish event
    publish_certificate_verified(cert_id, verified_by, method.value)
    
    return verification

# Public verification by hash
@router.get("/public/{cert_hash}", response_model=PublicVerificationResponse)
def verify_certificate_public(
    cert_hash: str,
    db: Session = Depends(get_db)
):
    """
    Public endpoint to verify certificate by hash (for QR codes, blockchain links)
    """
    service = CertificateService(db)
    
    is_valid, certificate = service.verify_certificate_hash(cert_hash)
    
    if not certificate:
        return {
            "valid": False,
            "certificate": None,
            "message": "Certificate not found"
        }
    
    if not is_valid:
        return {
            "valid": False,
            "certificate": certificate,
            "message": f"Certificate status: {certificate.status}"
        }
    
    # Log public verification
    service.verify_certificate(certificate.id, None, VerificationMethod.PUBLIC)
    
    return {
        "valid": True,
        "certificate": certificate,
        "message": "Certificate is valid"
    }