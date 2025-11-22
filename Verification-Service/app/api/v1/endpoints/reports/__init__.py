from fastapi import APIRouter
from app.api.v1.endpoints.reports.list import router as list_router
from app.api.v1.endpoints.reports.generate import router as generate_router
from app.api.v1.endpoints.reports.download import router as download_router
from app.api.v1.endpoints.reports.cva_credit_report import router as cva_report_router


router = APIRouter()

router.include_router(list_router)
router.include_router(generate_router)
router.include_router(download_router)
router.include_router(cva_report_router, tags=["CVA Reports"])