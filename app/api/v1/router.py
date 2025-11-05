# ============================================
# Router tổng hợp
# ============================================
from fastapi import APIRouter
from app.api.v1.endpoints import verifications

# Tạo API router chính
api_router = APIRouter()

# Include verification routes
api_router.include_router(
    verifications.router,
    prefix="/verifications",
    tags=["Verifications"]
)