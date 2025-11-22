from fastapi import APIRouter
from pydantic import BaseModel
from app.core.security import create_access_token

router = APIRouter()


class TestTokenRequest(BaseModel):
    user_id: str = "user-001"
    email: str = "test@example.com"
    role: str = "EV_OWNER"  # Có thể là "EV_OWNER", "CVA", "ADMIN"


@router.post("/test-token", summary="Tạo test token (Development only)")
async def create_test_token(request: TestTokenRequest):
    """
    Endpoint để tạo JWT token test (chỉ dùng cho development)
    
    Không cần authentication để gọi endpoint này.
    Copy access_token và paste vào Swagger Authorize.
    
    **Roles available:**
    - `EV_OWNER`: Để test tạo verification
    - `CVA`: Để test approve/reject verification
    - `ADMIN`: Để test tất cả chức năng
    """
    token = create_access_token({
        "sub": request.user_id,
        "id": request.user_id,
        "email": request.email,
        "role": request.role
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": request.user_id,
        "role": request.role,
        "note": "Copy 'access_token' và paste vào Swagger Authorize (không cần 'Bearer')"
    }

