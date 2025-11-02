# ============================================
# Kết nối MySQL với SQLAlchemy
# ============================================
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config.settings import settings

# Tạo engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=settings.DEBUG
)

# Tạo session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class cho models
Base = declarative_base()

# Dependency để get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Init database
def init_db():
    """Tạo tất cả tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized")