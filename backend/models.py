"""
Pydantic models for API request/response schemas.
"""

from typing import Optional

from pydantic import BaseModel


class AnalysisCreate(BaseModel):
    file_name: str
    bank_name: Optional[str] = None
    result: dict


class AnalysisResponse(BaseModel):
    id: str
    file_name: str
    bank_name: Optional[str] = None
    result: dict
    created_at: str


class AnalysisListItem(BaseModel):
    id: str
    file_name: str
    bank_name: Optional[str] = None
    created_at: str
