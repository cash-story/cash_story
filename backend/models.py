"""
Pydantic models for API request/response schemas.
"""

from typing import Optional

from pydantic import BaseModel

# --- User Models ---


class UserCreate(BaseModel):
    google_id: str
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    google_id: str
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    created_at: str


# --- Analysis Models ---


class AnalysisCreate(BaseModel):
    file_name: str
    bank_name: Optional[str] = None
    result: dict


class AnalysisResponse(BaseModel):
    id: str
    user_id: str
    file_name: str
    bank_name: Optional[str] = None
    result: dict
    created_at: str


class AnalysisListItem(BaseModel):
    id: str
    file_name: str
    bank_name: Optional[str] = None
    created_at: str
