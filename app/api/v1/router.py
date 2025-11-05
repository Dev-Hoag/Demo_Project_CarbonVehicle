# ============================================
# Router tổng hợp
# ============================================
from fastapi import APIRouter
from app.api.v1.endpoints import verifications, reports, requests

# Tạo API router chính
api_router = APIRouter()

# Include verification routes
api_router.include_router(
    verifications.router,
    prefix="/verifications",
    tags=["Verifications"]
)

# Include reports routes
api_router.include_router(
    reports.router,
    prefix="/reports",
    tags=["Reports"]
)

# Include requests routes
api_router.include_router(
    requests.router,
    prefix="/requests",
    tags=["Requests"]
)