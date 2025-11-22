from fastapi import APIRouter
from app.api.v1.endpoints.requests.assigned import router as assigned_router
from app.api.v1.endpoints.requests.request_info import router as request_info_router


router = APIRouter()

router.include_router(assigned_router)
router.include_router(request_info_router)