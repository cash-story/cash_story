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


# --- Report Group Models ---


class ReportGroupCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ReportGroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class ReportGroupListItem(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    status: str
    statement_count: int
    parent_report_id: Optional[str] = None
    created_at: str
    updated_at: str


class ReportGroupResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    status: str
    combined_result: Optional[dict] = None
    statements: list["StatementListItem"] = []
    parent_report_id: Optional[str] = None
    created_at: str
    updated_at: str


# --- Statement Models ---


class StatementListItem(BaseModel):
    id: str
    file_name: str
    file_format: str
    file_size: Optional[int] = None
    bank_name: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    created_at: str


class StatementResponse(BaseModel):
    id: str
    file_name: str
    file_format: str
    file_size: Optional[int] = None
    bank_name: Optional[str] = None
    encrypted_text: Optional[str] = None
    encryption_iv: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    created_at: str


class StatementUpload(BaseModel):
    encrypted_text: Optional[str] = None
    encryption_iv: Optional[str] = None


# --- Encryption Key Models ---


class KeySetupRequest(BaseModel):
    salt: str
    verification_hash: str


class KeySetupResponse(BaseModel):
    success: bool
    message: str


class KeyInfoResponse(BaseModel):
    has_key: bool
    salt: Optional[str] = None


# --- Extraction Models ---


class ExtractionResult(BaseModel):
    success: bool
    text: Optional[str] = None
    error: Optional[str] = None
    metadata: Optional[dict] = None
