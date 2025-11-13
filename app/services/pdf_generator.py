import os
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
from datetime import datetime
from typing import Dict, Any
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class PDFGenerator:
    """
    Service for generating PDF certificates from templates
    """
    
    def __init__(self):
        self.template_dir = settings.TEMPLATE_DIR
        self.upload_dir = settings.UPLOAD_DIR
        self.jinja_env = Environment(loader=FileSystemLoader(self.template_dir))
        
        # Ensure upload directory exists
        os.makedirs(self.upload_dir, exist_ok=True)
    
    def generate_certificate_pdf(
        self,
        certificate_data: Dict[str, Any],
        template_name: str = "certificate_template.html"
    ) -> str:
        """
        Generate PDF certificate from template
        
        Args:
            certificate_data: Dictionary containing certificate information
            template_name: Name of the template file
            
        Returns:
            Path to generated PDF file
        """
        try:
            # Load template
            template = self.jinja_env.get_template(template_name)
            
            # Prepare data for template
            context = {
                "certificate_id": certificate_data.get("id"),
                "cert_hash": certificate_data.get("cert_hash"),
                "user_id": certificate_data.get("user_id"),
                "trip_id": certificate_data.get("trip_id"),
                "credit_amount": certificate_data.get("credit_amount"),
                "issue_date": certificate_data.get("issue_date", datetime.now()).strftime("%Y-%m-%d %H:%M:%S"),
                "verification_id": certificate_data.get("verification_id"),
                "author": settings.PDF_AUTHOR,
                "subject": settings.PDF_SUBJECT,
                "current_year": datetime.now().year
            }
            
            # Render HTML from template
            html_content = template.render(**context)
            
            # Generate filename
            filename = f"certificate_{certificate_data.get('id')}_{certificate_data.get('cert_hash')[:8]}.pdf"
            pdf_path = os.path.join(self.upload_dir, filename)
            
            # Generate PDF
            HTML(string=html_content).write_pdf(pdf_path)
            
            logger.info(f"PDF certificate generated: {pdf_path}")
            return pdf_path
            
        except Exception as e:
            logger.error(f"Error generating PDF: {str(e)}")
            raise
    
    def get_pdf_url(self, pdf_path: str) -> str:
        """
        Convert local file path to accessible URL
        
        Args:
            pdf_path: Local path to PDF file
            
        Returns:
            URL to access the PDF
        """
        filename = os.path.basename(pdf_path)
        return f"/api/certificates/files/{filename}"
    
    def delete_pdf(self, pdf_path: str) -> bool:
        """
        Delete PDF file
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            True if deleted successfully
        """
        try:
            if os.path.exists(pdf_path):
                os.remove(pdf_path)
                logger.info(f"PDF deleted: {pdf_path}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting PDF: {str(e)}")
            return False