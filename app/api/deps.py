from fastapi import Depends, HTTPException, status, Header
from app.config.database import get_db
from app.core.security import verify_jwt
from sqlalchemy.orm import Session
from typing import Optional


def get_db_session():
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()


def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Authorization header")
    token = authorization.split(" ", 1)[1]
    try:
        payload = verify_jwt(token)
        return payload
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
