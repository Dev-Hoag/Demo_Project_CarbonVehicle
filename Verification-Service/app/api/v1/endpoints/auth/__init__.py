from fastapi import APIRouter
from app.api.v1.endpoints.auth.test_token import router as test_token_router

router = APIRouter()

router.include_router(test_token_router)

