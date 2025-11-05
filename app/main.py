# ============================================
# Entry point - Swagger UI tự động sinh ra ở đây! 🎉
# ============================================
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time

from app.config.settings import settings
from app.config.database import init_db
from app.api.v1.router import api_router
from app.utils.logger import logger


# ============================================
# Lifespan Events
# ============================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Xử lý startup và shutdown events
    """
    # Startup
    logger.info("=" * 60)
    logger.info("🚀 Starting Verification (CVA) Service...")
    logger.info(f"📦 Version: 1.0.0")
    logger.info(f"🌍 Environment: {settings.APP_ENV}")
    logger.info(f"🔌 Port: {settings.PORT}")
    logger.info("=" * 60)
    
    try:
        init_db()
        logger.info("✅ Database connected successfully")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {str(e)}")
        raise
    
    logger.info("✅ Service started successfully")
    logger.info(f"📖 Swagger UI: http://localhost:{settings.PORT}/docs")
    logger.info(f"📚 ReDoc: http://localhost:{settings.PORT}/redoc")
    logger.info("=" * 60)
    
    yield
    
    # Shutdown
    logger.info("=" * 60)
    logger.info("🛑 Shutting down Verification Service...")
    logger.info("=" * 60)


# ============================================
# Create FastAPI Application
# ============================================
app = FastAPI(
    title="🌿 Verification (CVA) Service API",
    description="""
    ## Carbon Verification & Audit Service
    
    Service để xác minh tín chỉ carbon từ dữ liệu hành trình xe điện.
    
    ---
    
    ### 🎯 Chức năng chính:
    
    * ✅ **Tạo verification request** từ MRV Service
    * 🔍 **Xem danh sách** verifications với filter & pagination
    * 📊 **Thống kê** CO2 và credits
    * ✔️ **Phê duyệt** verification (CVA only)
    * ❌ **Từ chối** verification (CVA only)
    * 🔐 **Digital signature** cho tín chỉ approved
    
    ---
    
    ### 👥 Vai trò người dùng:
    
    * **CVA** (Carbon Verification & Audit): Xác minh và phê duyệt
    * **EV Owner**: Xem trạng thái verification của mình
    * **Admin**: Quản trị toàn bộ hệ thống
    
    ---
    
    ### 🔄 Luồng hoạt động:
    
    ```
    1. MRV Service tính CO2 → Tạo verification (PENDING)
    2. CVA nhận và xem xét dữ liệu
    3. CVA approve/reject
    4. Nếu approve → Tạo signature → Publish event
    5. Registry Service mint credits
    ```
    
    ---
    
    ### 📡 Events:
    
    **Outgoing:**
    - `VerificationApproved` → Registry Service
    - `VerificationRejected` → Notification Service
    
    **Incoming:**
    - `CreditProposalCreated` ← MRV Service
    
    ---
    
    ### 🛠️ Tech Stack:
    
    * **Framework**: FastAPI (Python 3.11)
    * **Database**: MySQL 8.0
    * **ORM**: SQLAlchemy 2.0
    * **Validation**: Pydantic 2.5
    * **Documentation**: Swagger UI / ReDoc (auto-generated)
    * **Deployment**: Docker + Docker Compose
    
    ---
    
    ### 📞 Support:
    
    * **Email**: support@carboncredit.com
    * **Docs**: https://docs.carboncredit.com/verification
    """,
    version="1.0.0",
    contact={
        "name": "Verification Service Team",
        "email": "cva@carboncredit.com",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)


# ============================================
# Middleware
# ============================================

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log tất cả requests với timing"""
    start_time = time.time()
    
    # Log request
    logger.info(f"📨 {request.method} {request.url.path}")
    
    try:
        response = await call_next(request)
        
        # Calculate process time
        process_time = time.time() - start_time
        
        # Log response
        logger.info(
            f"✅ {request.method} {request.url.path} "
            f"→ {response.status_code} "
            f"({process_time:.3f}s)"
        )
        
        # Add custom header
        response.headers["X-Process-Time"] = f"{process_time:.3f}"
        
        return response
        
    except Exception as e:
        logger.error(
            f"❌ {request.method} {request.url.path} "
            f"→ Error: {str(e)}"
        )
        raise


# ============================================
# Exception Handlers
# ============================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(
        f"❌ Unhandled exception: {str(exc)}",
        exc_info=True
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "An error occurred"
        }
    )


# ============================================
# Root Endpoints
# ============================================

@app.get(
    "/",
    tags=["Root"],
    summary="Welcome",
    description="Service information và links"
)
async def root():
    """
    Root endpoint với thông tin về API
    
    Returns thông tin:
    - Service name & version
    - Links đến docs
    - Health check endpoint
    """
    return {
        "service": "🌿 Verification (CVA) Service",
        "version": "1.0.0",
        "description": "Carbon Verification & Audit Service",
        "docs": {
            "swagger": "/docs",
            "redoc": "/redoc",
            "openapi": "/openapi.json"
        },
        "endpoints": {
            "health": "/health",
            "verifications": "/api/v1/verifications",
            "statistics": "/api/v1/verifications/stats/summary"
        },
        "status": "running"
    }


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
    - status: OK nếu service running
    - service: Service name
    - version: API version
    - timestamp: Current time
    """
    from datetime import datetime
    
    return {
        "status": "OK",
        "service": "Verification Service",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected"  # TODO: Add actual DB health check
    }


# ============================================
# Include API Routers
# ============================================
app.include_router(
    api_router,
    prefix="/api/v1"
)


# ============================================
# Run Application
# ============================================
if __name__ == "__main__":
    import uvicorn
    
    logger.info("🚀 Starting Verification Service...")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )