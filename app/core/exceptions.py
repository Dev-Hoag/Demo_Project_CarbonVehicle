# ============================================
# Custom exceptions
# ============================================
from fastapi import HTTPException, status


class VerificationException(HTTPException):
    """Base exception cho Verification Service"""
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)


class NotFoundException(VerificationException):
    """Resource không tồn tại"""
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(
            detail=detail, 
            status_code=status.HTTP_404_NOT_FOUND
        )


class UnauthorizedException(VerificationException):
    """Chưa authenticate"""
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_401_UNAUTHORIZED
        )


class ForbiddenException(VerificationException):
    """Không có quyền truy cập"""
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_403_FORBIDDEN
        )


class ValidationException(VerificationException):
    """Validation lỗi"""
    def __init__(self, detail: str = "Validation error"):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
        )


class ConflictException(VerificationException):
    """Resource bị conflict (duplicate)"""
    def __init__(self, detail: str = "Conflict"):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_409_CONFLICT
        )