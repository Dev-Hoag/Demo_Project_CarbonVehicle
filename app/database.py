from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.declarative import declarative_base
import time

from app.config import settings

Base = declarative_base()

DATABASE_URL = (
    f"mysql+pymysql://{settings.DB_USER}:{settings.DB_PASSWORD}"
    f"@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
)

# Engine & SessionLocal chỉ được set sau init_db()
engine = None
SessionLocal = None


def init_db(max_retries=10, delay=3):
    """
    Initialize the database connection with retry logic.
    Recreates engine every retry → avoids pymysql auth cache.
    """
    global engine, SessionLocal

    for attempt in range(1, max_retries + 1):
        try:
            print(f"[DB] Attempt #{attempt} connecting to MySQL...")

            # Create NEW ENGINE EVERY RETRY
            temp_engine = create_engine(
                DATABASE_URL,
                pool_pre_ping=True,
                pool_recycle=280,
                echo=settings.DEBUG,
            )

            # Test raw connection
            with temp_engine.connect() as conn:
                conn.execute(text("SELECT 1"))

            print("[DB] Connection OK. Creating tables...")

            Base.metadata.create_all(bind=temp_engine)

            print("[DB] Database initialized successfully!")

            # Set global engine & SessionLocal AFTER success
            engine = temp_engine
            SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=engine
            )

            return True

        except OperationalError as e:
            print(f"[DB] Attempt #{attempt} failed: {e}")

        except Exception as e:
            print(f"[DB] Unexpected error: {e}")

        # Dispose to clear cached auth
        try:
            temp_engine.dispose()
        except:
            pass

        time.sleep(delay)

    print("[DB] FATAL: All retry attempts failed.")
    return False


def get_db():
    """FastAPI dependency."""
    if SessionLocal is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
