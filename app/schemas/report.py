from pydantic import BaseModel
from typing import List, Optional


class ReportResponse(BaseModel):
    id: str
    status: str


class ReportGenerateRequest(BaseModel):
    from_date: Optional[str] = None
    to_date: Optional[str] = None


class ReportListResponse(BaseModel):
    items: List[ReportResponse]
    total: int


