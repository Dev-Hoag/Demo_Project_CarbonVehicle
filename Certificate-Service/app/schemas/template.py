from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

''' 
#feat: thêm các schema Pydantic cho quản lý template chứng chỉ

- Tạo TemplateBase chứa các trường chung của template (tên, đường dẫn file HTML, mô tả, trạng thái)
- Thêm TemplateCreate phục vụ tạo mới template
- Thêm TemplateUpdate với các trường tùy chọn để cập nhật
- Thêm TemplateResponse gồm id và thời gian tạo, dùng cho phản hồi API
- Bổ sung ví dụ mẫu trong json_schema_extra để hỗ trợ tài liệu
- Thêm TemplateListResponse để trả danh sách template theo dạng phân trang
''' 


class TemplateBase(BaseModel):
    """Base schema for certificate templates"""
    template_name: str = Field(..., min_length=1, max_length=100, description="Template name")
    pdf_template_path: str = Field(..., min_length=1, max_length=255, description="Path to template file")
    description: Optional[str] = Field(None, description="Template description")
    is_active: bool = Field(True, description="Is template active")

class TemplateCreate(TemplateBase):
    """Schema for creating a new template"""
    pass

class TemplateUpdate(BaseModel):
    """Schema for updating a template"""
    template_name: Optional[str] = Field(None, min_length=1, max_length=100)
    pdf_template_path: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_active: Optional[bool] = None

class TemplateResponse(TemplateBase):
    """Schema for template response"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "template_name": "Default Certificate",
                "pdf_template_path": "certificate_template.html",
                "description": "Standard carbon credit certificate",
                "is_active": True,
                "created_at": "2024-01-01T12:00:00"
            }
        }

class TemplateListResponse(BaseModel):
    """Schema for list of templates"""
    total: int
    items: list[TemplateResponse]