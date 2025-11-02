# ============================================
# Router tổng hợp
# ============================================
from fastapi import APIRouter
from app.api.v1.endpoints import verifications

api_router = APIRouter()

api_router.include_router(
    verifications.router,
    prefix="/verifications",
    tags=["Verifications"]
)