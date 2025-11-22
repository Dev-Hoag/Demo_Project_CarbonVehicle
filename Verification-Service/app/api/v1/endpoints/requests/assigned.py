from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.schemas.request import RequestListResponse

router = APIRouter()

@router.get("/assigned", response_model=RequestListResponse, summary="Lấy danh sách yêu cầu được gán")
async def get_assigned_requests(
    db: Session = Depends(get_db),
):
    """
    Lấy danh sách các yêu cầu được gán cho người dùng hiện tại.
    """
    # TODO: Implement logic to fetch assigned requests
    return RequestListResponse(items=[], total=0)