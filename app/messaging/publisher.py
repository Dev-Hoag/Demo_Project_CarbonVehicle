import logging
from datetime import datetime
from app.messaging.rabbitmq import rabbitmq_connection
from app.models import Certificate

logger = logging.getLogger(__name__)

def publish_certificate_generated(certificate: Certificate):
    """
    Publish CertificateGenerated event
    """
    try:
        message = {
            "event_type": "CertificateGenerated",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "certificate_id": certificate.id,
                "user_id": certificate.user_id,
                "cert_hash": certificate.cert_hash,
                "credit_amount": float(certificate.credit_amount),
                "pdf_url": certificate.pdf_url,
                "issue_date": certificate.issue_date.isoformat(),
                "trip_id": certificate.trip_id,
                "verification_id": certificate.verification_id
            }
        }
        
        routing_key = "certificate.generated"
        rabbitmq_connection.publish_message(routing_key, message)
        
        logger.info(f"Published CertificateGenerated event for certificate {certificate.id}")
        
    except Exception as e:
        logger.error(f"Failed to publish CertificateGenerated event: {str(e)}")

def publish_certificate_verified(cert_id: int, verified_by: int = None, method: str = "system"):
    """
    Publish CertificateVerified event
    """
    try:
        message = {
            "event_type": "CertificateVerified",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "certificate_id": cert_id,
                "verified_by": verified_by,
                "verification_method": method,
                "verified_at": datetime.utcnow().isoformat()
            }
        }
        
        routing_key = "certificate.verified"
        rabbitmq_connection.publish_message(routing_key, message)
        
        logger.info(f"Published CertificateVerified event for certificate {cert_id}")
        
    except Exception as e:
        logger.error(f"Failed to publish CertificateVerified event: {str(e)}")

def publish_certificate_downloaded(cert_id: int, downloaded_by: int = None):
    """
    Publish CertificateDownloaded event
    """
    try:
        message = {
            "event_type": "CertificateDownloaded",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "certificate_id": cert_id,
                "downloaded_by": downloaded_by,
                "downloaded_at": datetime.utcnow().isoformat()
            }
        }
        
        routing_key = "certificate.downloaded"
        rabbitmq_connection.publish_message(routing_key, message)
        
        logger.info(f"Published CertificateDownloaded event for certificate {cert_id}")
        
    except Exception as e:
        logger.error(f"Failed to publish CertificateDownloaded event: {str(e)}")