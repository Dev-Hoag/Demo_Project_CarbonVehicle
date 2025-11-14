from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class DownloadBase(BaseModel):
    """Base schema for certificate download"""
    cert_id: int = Field(..., gt=0, description="Certificate ID")
    downloaded_by: Optional[int] = Field(None, description="User ID who downloaded")

class DownloadCreate(DownloadBase):
    """Schema for creating a download record"""
    pass

class DownloadResponse(BaseModel):
    """Schema for download response"""
    id: int
    cert_id: int
    downloaded_by: Optional[int]
    downloaded_at: datetime
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "cert_id": 123,
                "downloaded_by": 456,
                "downloaded_at": "2024-01-01T12:00:00"
            }
        }

class DownloadListResponse(BaseModel):
    """Schema for list of downloads"""
    total: int
    items: list[DownloadResponse]

class DownloadStatsResponse(BaseModel):
    """Schema for download statistics"""
    certificate_id: int
    total_downloads: int
    unique_users: int
    last_downloaded_at: Optional[datetime]
    download_count_by_user: dict[int, int] = Field(default_factory=dict)
    
    class Config:
        json_schema_extra = {
            "example": {
                "certificate_id": 123,
                "total_downloads": 25,
                "unique_users": 10,
                "last_downloaded_at": "2024-01-01T12:00:00",
                "download_count_by_user": {
                    "456": 5,
                    "789": 3
                }
            }
        }