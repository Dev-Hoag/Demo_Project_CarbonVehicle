from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.schemas.request import RequestInfoResponse

router = APIRouter()

@router.post("/{request_id}/request-info", response_model=RequestInfoResponse, summary="Yêu cầu thêm thông tin")
async def request_more_info(
    request_id: str = Path(..., description="ID của yêu cầu"),
    db: Session = Depends(get_db),
):
    """
    Yêu cầu thêm thông tin cho một yêu cầu cụ thể.
    """
    # TODO: Implement logic to request more information
    return RequestInfoResponse(id=request_id, status="info_requested")