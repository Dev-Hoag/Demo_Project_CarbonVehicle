from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VerificationCreate(BaseModel):
    code: str

class VerificationRead(BaseModel):
    id: int
    code: str
    status: str
    created_at: Optional[datetime]

    class Config:
        orm_mode = True
