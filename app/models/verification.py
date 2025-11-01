from sqlalchemy import Column, Integer, String, DateTime, func
from app.config.database import Base


class Verification(Base):
    __tablename__ = "verifications"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(128), nullable=False, index=True)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, server_default=func.now())
