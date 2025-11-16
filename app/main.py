from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import threading

from app.config import settings
from app.database import init_db
from app.api.routes import router
from app.messaging.rabbitmq import rabbitmq_connection
from app.messaging.consumer import start_consumer


# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Consumer thread
consumer_thread = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    
    # Initialize database
    init_db()
    logger.info("Database initialized")
    
    # Connect to RabbitMQ
    if rabbitmq_connection.connect():
        logger.info("Connected to RabbitMQ")
        
        # Start consumer in separate thread
        global consumer_thread
        consumer_thread = threading.Thread(target=start_consumer, daemon=True)
        consumer_thread.start()
        logger.info("RabbitMQ consumer started")
    else:
        logger.warning("Failed to connect to RabbitMQ - running without message consumer")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application")
    rabbitmq_connection.close()

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Certificate Service for Carbon Credit Platform",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router)

# Health check endpoint
@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION
    }

# Root endpoint
@app.get("/", tags=["Root"])
def root():
    """
    Root endpoint
    """
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.APP_PORT,
        reload=settings.DEBUG
    )