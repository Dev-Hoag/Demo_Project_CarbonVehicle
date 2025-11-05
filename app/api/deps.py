from typing import Optional

from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedException, ForbiddenException


class CurrentUser:
    def __init__(self, id: str, email: str, role: str, full_name: Optional[str] = None):
        self.id = id
        self.email = email
        self.role = role
        self.full_name = full_name

    def __repr__(self):
        return f"<CurrentUser(id={self.id}, role={self.role})>"


def get_db_session():
    """Dependency: provide a SQLAlchemy session"""
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()


def get_current_user(authorization: Optional[str] = Header(None)) -> CurrentUser:
    """Decode JWT token from Authorization header and return CurrentUser"""
    if not authorization:
        raise UnauthorizedException("Missing Authorization header")
    if not authorization.startswith("Bearer "):
        raise UnauthorizedException("Invalid Authorization header")
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token)
    except Exception:
        raise UnauthorizedException("Invalid token")

    # Expect payload to contain sub, email, role
    user_id = payload.get("sub") or payload.get("id")
    email = payload.get("email")
    role = payload.get("role")
    if not user_id or not role:
        raise UnauthorizedException("Token missing required claims")

    return CurrentUser(id=user_id, email=email, role=role, full_name=payload.get("full_name"))


def get_current_cva_user(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if current_user.role != "CVA":
        raise ForbiddenException("CVA role required")
    return current_user


def check_roles(*allowed_roles: str):
    def role_checker(current_user: CurrentUser = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise ForbiddenException("Access denied")
        return current_user

    return role_checker