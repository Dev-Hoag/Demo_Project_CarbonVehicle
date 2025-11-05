from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.config.settings import settings
from app.core.exceptions import UnauthorizedException

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password với hash
    
    Args:
        plain_password: Password gốc
        hashed_password: Password đã hash
        
    Returns:
        True nếu match
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash password
    
    Args:
        password: Password gốc
        
    Returns:
        Hashed password
    """
    return pwd_context.hash(password)


def create_access_token(
    data: dict, 
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Tạo JWT access token
    
    Args:
        data: Data để encode (subject, email, role, etc.)
        expires_delta: Thời gian expire (optional)
        
    Returns:
        JWT token string
        
    Example:
        token = create_access_token({
            "sub": "user-001",
            "email": "user@example.com",
            "role": "CVA"
        })
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def decode_token(token: str) -> dict:
    """
    Decode JWT token
    
    Args:
        token: JWT token string
        
    Returns:
        Payload dict
        
    Raises:
        UnauthorizedException: Nếu token invalid/expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        raise UnauthorizedException(f"Invalid token: {str(e)}")