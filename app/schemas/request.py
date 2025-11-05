from pydantic import BaseModel
from typing import List


class RequestInfoResponse(BaseModel):
    id: str
    status: str


class RequestListResponse(BaseModel):
    items: List[RequestInfoResponse]
    total: int


