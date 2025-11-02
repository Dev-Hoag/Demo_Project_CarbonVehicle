# ============================================
# Dependencies (DB session, Auth)
# ============================================
from fastapi import Depends
from sqlalchemy.orm import Session
from app.config.database import get_db

# Giả lập current user (sau này sẽ dùng JWT)
class CurrentUser:
    id: str = "cva-001"
    role: str = "CVA"

def get_current_user() -> CurrentUser:
    return CurrentUser()