from fastapi import APIRouter

from app.api.v1.endpoints.verifications.create import router as create_router
from app.api.v1.endpoints.verifications.list import router as list_router
from app.api.v1.endpoints.verifications.detail import router as detail_router
from app.api.v1.endpoints.verifications.approve import router as approve_router
from app.api.v1.endpoints.verifications.reject import router as reject_router
from app.api.v1.endpoints.verifications.stats import router as stats_router


router = APIRouter()

router.include_router(create_router)
router.include_router(list_router)
router.include_router(detail_router)
router.include_router(approve_router)
router.include_router(reject_router)
router.include_router(stats_router)


