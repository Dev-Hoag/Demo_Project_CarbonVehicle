from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.schemas.report import ReportListResponse

router = APIRouter()

@router.get("/", response_model=ReportListResponse, summary="Lấy danh sách báo cáo")
async def get_reports(
    db: Session = Depends(get_db),
):
    """
    Lấy danh sách các báo cáo xác minh.
    """
    # TODO: Implement logic to fetch reports
    return ReportListResponse(items=[], total=0)