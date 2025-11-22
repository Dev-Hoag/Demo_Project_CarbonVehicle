# ============================================
# Kết nối MySQL với SQLAlchemy
# ============================================
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from app.config.settings import settings
from app.utils.logger import logger


# Create engine với connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,   # Recycle connections after 1 hour
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    future=True
)


# Event listener để log connection info
@event.listens_for(engine, "connect")
def receive_connect(dbapi_conn, connection_record):
    """Log khi có connection mới"""
    logger.debug("🔌 New database connection established")


@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_conn, connection_record, connection_proxy):
    """Log khi checkout connection từ pool"""
    logger.debug("📤 Connection checked out from pool")


# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)


# Base class cho tất cả models
Base = declarative_base()


# ============================================
# Dependencies
# ============================================

def get_db():
    """
    Dependency để get database session
    
    Usage trong API:
        @router.get("/verifications")
        async def get_verifications(db: Session = Depends(get_db)):
            ...
    
    Yields:
        Session: SQLAlchemy session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database
    - Tạo tất cả tables nếu chưa có
    - Log connection info
    
    Raises:
        Exception: Nếu không connect được database
    """
    try:
        # Test connection
        with engine.connect() as conn:
            logger.info("✅ Database connection successful")
            logger.info(f"📊 Database: {settings.DB_NAME}")
            logger.info(f"🔗 Host: {settings.DB_HOST}:{settings.DB_PORT}")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables initialized")
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {str(e)}")
        raise


def dispose_db():
    """
    Dispose database engine và đóng tất cả connections
    Call khi shutdown service
    """
    try:
        engine.dispose()
        logger.info("✅ Database connections disposed")
    except Exception as e:
        logger.error(f"❌ Error disposing database: {str(e)}")


# ============================================
# Database Utilities
# ============================================

def check_db_health() -> bool:
    """
    Kiểm tra database có healthy không
    
    Returns:
        bool: True nếu database OK
    """
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"❌ Database health check failed: {str(e)}")
        return False


def get_db_info() -> dict:
    """
    Lấy thông tin database
    
    Returns:
        dict: Database info
    """
    return {
        "host": settings.DB_HOST,
        "port": settings.DB_PORT,
        "database": settings.DB_NAME,
        "pool_size": engine.pool.size(),
        "checked_in_connections": engine.pool.checkedin(),
        "checked_out_connections": engine.pool.checkedout(),
        "overflow": engine.pool.overflow(),
        "healthy": check_db_health()
    }