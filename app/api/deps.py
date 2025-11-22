from typing import Optional

from fastapi import Depends, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
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


# HTTPBearer scheme for Swagger UI
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme)
) -> CurrentUser:
    """
    Decode JWT token from HTTP Bearer auth and return CurrentUser
    
    Using Security(HTTPBearer) enables Swagger's Authorize button.
    """
    from app.utils.logger import logger
    
    if not credentials or not credentials.credentials:
        logger.warning("❌ Missing credentials in get_current_user")
        raise UnauthorizedException("Missing or invalid Authorization header")
    
    token = credentials.credentials
    logger.debug(f"🔑 Received token: {token[:20]}...")
    
    try:
        payload = decode_token(token)
        logger.debug(f"✅ Token decoded successfully: user_id={payload.get('sub')}, role={payload.get('role')}")
    except Exception as e:
        logger.error(f"❌ Token decode failed: {str(e)}")
        raise UnauthorizedException("Invalid token")

    # Expect payload to contain sub, email, role
    user_id = payload.get("sub") or payload.get("id")
    # Convert to string if it's a number (User Service sends number)
    if user_id is not None and not isinstance(user_id, str):
        user_id = str(user_id)
    email = payload.get("email")
    role = payload.get("role") or payload.get("userType")  # Support both role and userType
    if not user_id or not role:
        logger.error(f"❌ Token missing claims: user_id={user_id}, role={role}")
        raise UnauthorizedException("Token missing required claims")

    return CurrentUser(id=user_id, email=email, role=role, full_name=payload.get("full_name"))


def get_current_cva_user(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    from app.utils.logger import logger
    # Allow both CVA and ADMIN roles to access CVA reports
    logger.info(f"🔍 CVA access check: user_id={current_user.id}, role={current_user.role}")
    if current_user.role not in ["CVA", "ADMIN"]:
        logger.warning(f"❌ Access denied: role '{current_user.role}' not in ['CVA', 'ADMIN']")
        raise ForbiddenException("CVA or ADMIN role required")
    logger.info(f"✅ CVA access granted for role: {current_user.role}")
    return current_user


def check_roles(*allowed_roles: str):
    def role_checker(current_user: CurrentUser = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise ForbiddenException("Access denied")
        return current_user

    return role_checker