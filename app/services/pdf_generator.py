import os
from datetime import datetime
from typing import Dict, Any
from app.config import settings
import logging

# ReportLab imports
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_LEFT

logger = logging.getLogger(__name__)

class PDFGenerator:
    """
    Service for generating PDF certificates using ReportLab
    """
    
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        self.page_width, self.page_height = A4
        
        # Ensure upload directory exists
        os.makedirs(self.upload_dir, exist_ok=True)
        logger.info("PDFGenerator initialized with ReportLab")
    
    def generate_certificate_pdf(
        self,
        certificate_data: Dict[str, Any],
        template_name: str = "certificate_template.html"
    ) -> str:
        """
        Generate PDF certificate using ReportLab
        
        Args:
            certificate_data: Dictionary containing certificate information
            template_name: Ignored (kept for compatibility)
            
        Returns:
            Path to generated PDF file
        """
        try:
            # Extract data
            cert_id = str(certificate_data.get("id"))
            cert_hash = certificate_data.get("cert_hash", "")
            user_id = str(certificate_data.get("user_id"))
            credit_amount = float(certificate_data.get("credit_amount", 0))
            issue_date = certificate_data.get("issue_date", datetime.now())
            if isinstance(issue_date, str):
                issue_date_str = issue_date
            else:
                issue_date_str = issue_date.strftime("%Y-%m-%d %H:%M:%S")
            
            # Generate filename
            filename = f"certificate_{cert_id}_{cert_hash[:8]}.pdf"
            pdf_path = os.path.join(self.upload_dir, filename)
            
            # Create PDF document
            doc = SimpleDocTemplate(
                pdf_path,
                pagesize=A4,
                rightMargin=2*cm,
                leftMargin=2*cm,
                topMargin=2*cm,
                bottomMargin=2*cm
            )
            
            # Build content
            story = []
            styles = getSampleStyleSheet()
            
            # Custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=32,
                textColor=colors.HexColor('#0d47a1'),
                spaceAfter=10,
                alignment=TA_CENTER,
                fontName='Helvetica-Bold',
                leading=38
            )
            
            subtitle_style = ParagraphStyle(
                'Subtitle',
                parent=styles['Normal'],
                fontSize=11,
                textColor=colors.HexColor('#1976d2'),
                alignment=TA_CENTER,
                spaceAfter=30,
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=14,
                textColor=colors.white,
                spaceAfter=10,
                fontName='Helvetica-Bold',
                backColor=colors.HexColor('#1976d2'),
                leftIndent=10,
                rightIndent=10,
                spaceBefore=4,
            )
            
            body_style = ParagraphStyle(
                'CustomBody',
                parent=styles['Normal'],
                fontSize=11,
                spaceAfter=12,
                leading=16,
                alignment=TA_LEFT,
            )
            
            # Decorative top border
            top_border = Table([['']], colWidths=[16*cm])
            top_border.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#1976d2')),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
            ]))
            story.append(top_border)
            story.append(Spacer(1, 0.8*cm))
            
            # Title with decorative elements
            story.append(Paragraph("🌱 CARBON CREDIT CERTIFICATE 🌱", title_style))
            story.append(Paragraph("Official Verification of Carbon Emission Reduction", subtitle_style))
            
            # Certificate ID badge (centered)
            cert_id_table = Table([[f"Certificate No: {cert_id}"]], colWidths=[16*cm])
            cert_id_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 13),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1976d2')),
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#e3f2fd')),
                ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#1976d2')),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('LEFTPADDING', (0, 0), (-1, -1), 15),
                ('RIGHTPADDING', (0, 0), (-1, -1), 15),
            ]))
            story.append(cert_id_table)
            story.append(Spacer(1, 1*cm))
            
            # Certificate Details Section
            story.append(Paragraph("  📋 CERTIFICATE DETAILS", heading_style))
            story.append(Spacer(1, 0.3*cm))
            
            cert_data_table = [
                ['Holder ID:', user_id],
                ['Credit Amount:', f"✓  {credit_amount:.2f} kg CO₂ equivalent"],
                ['Issue Date:', issue_date_str],
                ['Status:', '✓  VERIFIED & VALID'],
            ]
            
            cert_table = Table(cert_data_table, colWidths=[4.5*cm, 11.5*cm])
            cert_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 11),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#424242')),
                ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1976d2')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('TOPPADDING', (0, 0), (-1, -1), 12),
                ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.HexColor('#e0e0e0')),
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fafafa')),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#bdbdbd')),
            ]))
            
            story.append(cert_table)
            story.append(Spacer(1, 1.2*cm))
            
            # Description Section
            story.append(Paragraph("  📖 DESCRIPTION", heading_style))
            story.append(Spacer(1, 0.3*cm))
            
            desc_table = Table([[
                Paragraph(
                    f"This certificate verifies that holder <b>ID {user_id}</b> has been credited with "
                    f"<font color='#2e7d32'><b>{credit_amount:.2f} kg of CO₂ equivalent</b></font> carbon credits. "
                    "These credits represent verified emission reductions or carbon sequestration activities "
                    "contributing to environmental sustainability and climate change mitigation. "
                    "The credits can be used for carbon footprint offsetting and environmental reporting.",
                    body_style
                )
            ]], colWidths=[16*cm])
            desc_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fafafa')),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#bdbdbd')),
                ('TOPPADDING', (0, 0), (-1, -1), 15),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
                ('LEFTPADDING', (0, 0), (-1, -1), 15),
                ('RIGHTPADDING', (0, 0), (-1, -1), 15),
            ]))
            story.append(desc_table)
            story.append(Spacer(1, 1.2*cm))
            
            # Hash verification Section
            story.append(Paragraph("  🔐 CRYPTOGRAPHIC VERIFICATION", heading_style))
            story.append(Spacer(1, 0.3*cm))
            
            hash_style = ParagraphStyle(
                'HashStyle',
                parent=styles['Normal'],
                fontSize=8,
                fontName='Courier',
                textColor=colors.HexColor('#424242'),
                wordWrap='CJK',
                spaceAfter=0,
                alignment=TA_CENTER,
            )
            
            hash_table = Table([[Paragraph(cert_hash, hash_style)]], colWidths=[16*cm])
            hash_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fff3e0')),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#ff9800')),
                ('TOPPADDING', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
                ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ]))
            story.append(hash_table)
            story.append(Spacer(1, 1.5*cm))
            
            # Footer with border
            footer_style = ParagraphStyle(
                'Footer',
                parent=styles['Normal'],
                fontSize=9,
                textColor=colors.HexColor('#616161'),
                alignment=TA_CENTER,
                spaceAfter=4,
            )
            
            footer_table = Table([
                [Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %H:%M:%S')}", footer_style)],
                [Paragraph("Carbon Credit Marketplace System", footer_style)],
                [Paragraph("This certificate is digitally verifiable and legally binding", footer_style)]
            ], colWidths=[16*cm])
            footer_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f5f5f5')),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ]))
            story.append(footer_table)
            
            # Bottom decorative border
            bottom_border = Table([['']], colWidths=[16*cm])
            bottom_border.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#1976d2')),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
            ]))
            story.append(bottom_border)
            
            # Build PDF
            doc.build(story)
            
            logger.info(f"PDF certificate generated successfully: {pdf_path}")
            return pdf_path
            
        except Exception as e:
            logger.error(f"Error generating PDF with ReportLab: {str(e)}", exc_info=True)
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