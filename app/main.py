# ============================================
# Entry point - Swagger UI tự động sinh ra ở đây! 🎉
# ============================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config.settings import settings
from app.config.database import init_db
from app.api.v1.router import api_router
from app.utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("🚀 Starting Verification Service...")
    try:
        init_db()
        logger.info("✅ Database connected")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down...")


# Tạo FastAPI app - SWAGGER TỰ ĐỘNG TẠO TẠI ĐÂY!
app = FastAPI(
    title="🌿 Verification (CVA) Service API",
    description="""
    ## Carbon Verification & Audit Service
    
    API để xác minh tín chỉ carbon từ xe điện.
    
    ### Tính năng:
    * ✅ Tạo verification request
    * 🔍 Xem danh sách và chi tiết
    * ✔️ Phê duyệt verification (CVA)
    * ❌ Từ chối verification (CVA)
    * 🔐 Digital signature
    
    ### Roles:
    * **CVA**: Carbon Verification & Audit
    * **EV Owner**: Chủ xe điện
    * **Admin**: Quản trị viên
    """,
    version="1.0.0",
    docs_url="/docs",        # 👈 Swagger UI tại /docs
    redoc_url="/redoc",      # 👈 ReDoc tại /redoc
    openapi_url="/openapi.json",
    lifespan=lifespan
)


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get(
    "/health",
    tags=["Health"],
    summary="Health Check",
    description="Kiểm tra service có hoạt động không"
)
async def health_check():
    """
    Health check endpoint
    
    Returns:
        - status: OK nếu service đang chạy
        - service: Tên service
    """
    return {
        "status": "OK",
        "service": "Verification Service",
        "version": "1.0.0"
    }


# Root endpoint
@app.get(
    "/",
    tags=["Root"],
    summary="Welcome",
    description="Welcome message với links"
)
async def root():
    """
    Root endpoint với thông tin về API
    """
    return {
        "message": "🌿 Welcome to Verification Service API",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
        "version": "1.0.0"
    }


# Include API router
app.include_router(
    api_router,
    prefix="/api/v1"
)


# Run application
if __name__ == "__main__":
    import uvicorn
    
    logger.info("=" * 50)
    logger.info(f"🚀 Starting Verification Service v1.0.0")
    logger.info(f"📖 Swagger UI: http://localhost:{settings.PORT}/docs")
    logger.info(f"📚 ReDoc: http://localhost:{settings.PORT}/redoc")
    logger.info(f"💊 Health: http://localhost:{settings.PORT}/health")
    logger.info("=" * 50)
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG
    )