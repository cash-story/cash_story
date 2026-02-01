#!/usr/bin/env python3
"""
FastAPI server for PDF text extraction and analysis storage.
Run with: uvicorn server:app --host 0.0.0.0 --port 8001
"""

import io
import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

from auth import require_auth, verify_google_token
from database import close_db, get_db, init_db
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from models import (
    AnalysisCreate,
    AnalysisListItem,
    AnalysisResponse,
    CategoryListResponse,
    CategoryResponse,
    ExtractionResult,
    KeyInfoResponse,
    KeySetupRequest,
    KeySetupResponse,
    ReportGroupCreate,
    ReportGroupListItem,
    ReportGroupResponse,
    ReportGroupUpdate,
    StatementListItem,
    StatementResponse,
    TransactionCreate,
    TransactionListResponse,
    TransactionResponse,
    TransactionUpdate,
    UserResponse,
)
from parsers import ParserFactory
from pydantic import BaseModel


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup, close on shutdown."""
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title="Cash Story API",
    description="PDF extraction and financial analysis storage",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS: allow configured origins + localhost for dev
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://cashstory-production.up.railway.app",
]
frontend_url = os.environ.get("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)
# Allow all Vercel preview deployments
vercel_url = os.environ.get("VERCEL_URL")
if vercel_url:
    allowed_origins.append(f"https://{vercel_url}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- File Extraction (Multi-format) ---


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.post("/extract", response_model=ExtractionResult)
async def extract_text(file: UploadFile = File(...), max_chars: int = 500000):
    """
    Extract text from uploaded file (PDF, Excel, or CSV).

    - **file**: File to extract text from (PDF, xlsx, xls, or csv)
    - **max_chars**: Maximum characters to extract (default 50000)
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Файлын нэр байхгүй байна")

    # Validate file format
    file_format = ParserFactory.detect_format(file.filename)
    if not file_format:
        supported = ", ".join(ParserFactory.get_supported_extensions())
        raise HTTPException(
            status_code=400,
            detail=f"Дэмжигдээгүй файлын формат. Дэмжигдэх форматууд: {supported}",
        )

    try:
        content = await file.read()
        result = await ParserFactory.parse_file(content, file.filename, max_chars)

        if not result.success:
            return ExtractionResult(success=False, error=result.error)

        return ExtractionResult(
            success=True,
            text=result.raw_text,
            metadata=result.metadata,
        )

    except Exception as e:
        return ExtractionResult(
            success=False, error=f"Файл уншихад алдаа гарлаа: {str(e)}"
        )


# --- Auth Endpoints ---


class GoogleAuthRequest(BaseModel):
    access_token: str


@app.post("/auth/google", response_model=UserResponse)
async def google_auth(data: GoogleAuthRequest):
    """
    Authenticate with Google OAuth token.
    Creates user if doesn't exist, returns user info.
    """
    # Verify token with Google
    google_info = await verify_google_token(data.access_token)

    google_id = google_info.get("sub")
    email = google_info.get("email")
    name = google_info.get("name")
    picture = google_info.get("picture")

    if not google_id or not email:
        raise HTTPException(status_code=400, detail="Invalid Google token")

    async with get_db() as conn:
        # Check if user exists
        row = await conn.fetchrow(
            "SELECT id, google_id, email, name, picture, created_at FROM users WHERE google_id = $1",
            google_id,
        )

        if row:
            # Update user info (in case name/picture changed)
            await conn.execute(
                "UPDATE users SET name = $1, picture = $2 WHERE google_id = $3",
                name,
                picture,
                google_id,
            )
            return UserResponse(
                id=str(row["id"]),
                google_id=row["google_id"],
                email=row["email"],
                name=name,
                picture=picture,
                created_at=row["created_at"].isoformat(),
            )

        # Create new user
        row = await conn.fetchrow(
            """
            INSERT INTO users (google_id, email, name, picture)
            VALUES ($1, $2, $3, $4)
            RETURNING id, google_id, email, name, picture, created_at
            """,
            google_id,
            email,
            name,
            picture,
        )

        return UserResponse(
            id=str(row["id"]),
            google_id=row["google_id"],
            email=row["email"],
            name=row["name"],
            picture=row["picture"],
            created_at=row["created_at"].isoformat(),
        )


@app.get("/users/me", response_model=UserResponse)
async def get_me(user: dict = Depends(require_auth)):
    """Get current authenticated user."""
    return UserResponse(**user)


# --- Analysis CRUD ---


@app.post("/analyses", response_model=AnalysisResponse, status_code=201)
async def save_analysis(data: AnalysisCreate, user: dict = Depends(require_auth)):
    """Save a financial analysis result (requires auth)."""
    async with get_db() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO analyses (user_id, file_name, bank_name, result)
            VALUES ($1, $2, $3, $4)
            RETURNING id, user_id, file_name, bank_name, result, created_at
            """,
            user["id"],
            data.file_name,
            data.bank_name,
            json.dumps(data.result, ensure_ascii=False),
        )

    return AnalysisResponse(
        id=str(row["id"]),
        user_id=str(row["user_id"]),
        file_name=row["file_name"],
        bank_name=row["bank_name"],
        result=json.loads(row["result"])
        if isinstance(row["result"], str)
        else row["result"],
        created_at=row["created_at"].isoformat(),
    )


@app.get("/analyses", response_model=list[AnalysisListItem])
async def list_analyses(limit: int = 20, user: dict = Depends(require_auth)):
    """List current user's analyses (requires auth)."""
    async with get_db() as conn:
        rows = await conn.fetch(
            """
            SELECT id, file_name, bank_name, created_at
            FROM analyses
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2
            """,
            user["id"],
            limit,
        )

    return [
        AnalysisListItem(
            id=str(row["id"]),
            file_name=row["file_name"],
            bank_name=row["bank_name"],
            created_at=row["created_at"].isoformat(),
        )
        for row in rows
    ]


@app.get("/analyses/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: str, user: dict = Depends(require_auth)):
    """Get a saved analysis by ID (requires auth, must own the analysis)."""
    async with get_db() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, user_id, file_name, bank_name, result, created_at
            FROM analyses
            WHERE id = $1 AND user_id = $2
            """,
            analysis_id,
            user["id"],
        )

    if not row:
        raise HTTPException(status_code=404, detail="Шинжилгээ олдсонгүй")

    return AnalysisResponse(
        id=str(row["id"]),
        user_id=str(row["user_id"]),
        file_name=row["file_name"],
        bank_name=row["bank_name"],
        result=json.loads(row["result"])
        if isinstance(row["result"], str)
        else row["result"],
        created_at=row["created_at"].isoformat(),
    )


@app.delete("/analyses/{analysis_id}")
async def delete_analysis(analysis_id: str, user: dict = Depends(require_auth)):
    """Delete a saved analysis (requires auth, must own the analysis)."""
    async with get_db() as conn:
        result = await conn.execute(
            "DELETE FROM analyses WHERE id = $1 AND user_id = $2",
            analysis_id,
            user["id"],
        )

    # Check if any row was deleted
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Шинжилгээ олдсонгүй")

    return {"deleted": True}


# --- Report Groups CRUD ---


@app.post("/report-groups", response_model=ReportGroupResponse, status_code=201)
async def create_report_group(
    data: ReportGroupCreate, user: dict = Depends(require_auth)
):
    """Create a new report group for combined statements."""
    async with get_db() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO report_groups (user_id, name, description, status)
            VALUES ($1, $2, $3, 'draft')
            RETURNING id, user_id, name, description, status, combined_result,
                      parent_report_id, created_at, updated_at
            """,
            user["id"],
            data.name,
            data.description,
        )

    return ReportGroupResponse(
        id=str(row["id"]),
        name=row["name"],
        description=row["description"],
        status=row["status"],
        combined_result=json.loads(row["combined_result"])
        if row["combined_result"]
        else None,
        statements=[],
        parent_report_id=str(row["parent_report_id"])
        if row["parent_report_id"]
        else None,
        created_at=row["created_at"].isoformat(),
        updated_at=row["updated_at"].isoformat(),
    )


@app.get("/report-groups", response_model=list[ReportGroupListItem])
async def list_report_groups(
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    user: dict = Depends(require_auth),
):
    """List user's report groups with optional status filter."""
    async with get_db() as conn:
        if status:
            rows = await conn.fetch(
                """
                SELECT rg.id, rg.name, rg.description, rg.status, rg.parent_report_id,
                       rg.created_at, rg.updated_at,
                       COUNT(s.id) as statement_count
                FROM report_groups rg
                LEFT JOIN statements s ON s.report_group_id = rg.id
                WHERE rg.user_id = $1 AND rg.status = $2
                GROUP BY rg.id
                ORDER BY rg.updated_at DESC
                LIMIT $3 OFFSET $4
                """,
                user["id"],
                status,
                limit,
                offset,
            )
        else:
            rows = await conn.fetch(
                """
                SELECT rg.id, rg.name, rg.description, rg.status, rg.parent_report_id,
                       rg.created_at, rg.updated_at,
                       COUNT(s.id) as statement_count
                FROM report_groups rg
                LEFT JOIN statements s ON s.report_group_id = rg.id
                WHERE rg.user_id = $1
                GROUP BY rg.id
                ORDER BY rg.updated_at DESC
                LIMIT $2 OFFSET $3
                """,
                user["id"],
                limit,
                offset,
            )

    return [
        ReportGroupListItem(
            id=str(row["id"]),
            name=row["name"],
            description=row["description"],
            status=row["status"],
            statement_count=row["statement_count"],
            parent_report_id=str(row["parent_report_id"])
            if row["parent_report_id"]
            else None,
            created_at=row["created_at"].isoformat(),
            updated_at=row["updated_at"].isoformat(),
        )
        for row in rows
    ]


@app.get("/report-groups/{group_id}", response_model=ReportGroupResponse)
async def get_report_group(group_id: str, user: dict = Depends(require_auth)):
    """Get a report group with all its statements."""
    async with get_db() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, user_id, name, description, status, combined_result,
                   parent_report_id, created_at, updated_at
            FROM report_groups
            WHERE id = $1 AND user_id = $2
            """,
            group_id,
            user["id"],
        )

        if not row:
            raise HTTPException(status_code=404, detail="Тайлангийн бүлэг олдсонгүй")

        # Get statements
        statement_rows = await conn.fetch(
            """
            SELECT id, file_name, file_format, file_size, bank_name, status,
                   error_message, created_at
            FROM statements
            WHERE report_group_id = $1
            ORDER BY created_at ASC
            """,
            group_id,
        )

    statements = [
        StatementListItem(
            id=str(s["id"]),
            file_name=s["file_name"],
            file_format=s["file_format"],
            file_size=s["file_size"],
            bank_name=s["bank_name"],
            status=s["status"],
            error_message=s["error_message"],
            created_at=s["created_at"].isoformat(),
        )
        for s in statement_rows
    ]

    return ReportGroupResponse(
        id=str(row["id"]),
        name=row["name"],
        description=row["description"],
        status=row["status"],
        combined_result=json.loads(row["combined_result"])
        if row["combined_result"]
        else None,
        statements=statements,
        parent_report_id=str(row["parent_report_id"])
        if row["parent_report_id"]
        else None,
        created_at=row["created_at"].isoformat(),
        updated_at=row["updated_at"].isoformat(),
    )


@app.put("/report-groups/{group_id}", response_model=ReportGroupResponse)
async def update_report_group(
    group_id: str, data: ReportGroupUpdate, user: dict = Depends(require_auth)
):
    """Update a report group's metadata."""
    async with get_db() as conn:
        # Build dynamic update query
        updates = []
        values = []
        param_idx = 1

        if data.name is not None:
            updates.append(f"name = ${param_idx}")
            values.append(data.name)
            param_idx += 1

        if data.description is not None:
            updates.append(f"description = ${param_idx}")
            values.append(data.description)
            param_idx += 1

        if data.status is not None:
            if data.status not in ["draft", "analyzed", "archived"]:
                raise HTTPException(status_code=400, detail="Буруу статус")
            updates.append(f"status = ${param_idx}")
            values.append(data.status)
            param_idx += 1

        if not updates:
            raise HTTPException(status_code=400, detail="Шинэчлэх өгөгдөл байхгүй")

        updates.append("updated_at = NOW()")
        values.extend([group_id, user["id"]])

        query = f"""
            UPDATE report_groups
            SET {", ".join(updates)}
            WHERE id = ${param_idx} AND user_id = ${param_idx + 1}
            RETURNING id, name, description, status, combined_result,
                      parent_report_id, created_at, updated_at
        """

        row = await conn.fetchrow(query, *values)

        if not row:
            raise HTTPException(status_code=404, detail="Тайлангийн бүлэг олдсонгүй")

        # Get statements
        statement_rows = await conn.fetch(
            """
            SELECT id, file_name, file_format, file_size, bank_name, status,
                   error_message, created_at
            FROM statements
            WHERE report_group_id = $1
            ORDER BY created_at ASC
            """,
            group_id,
        )

    statements = [
        StatementListItem(
            id=str(s["id"]),
            file_name=s["file_name"],
            file_format=s["file_format"],
            file_size=s["file_size"],
            bank_name=s["bank_name"],
            status=s["status"],
            error_message=s["error_message"],
            created_at=s["created_at"].isoformat(),
        )
        for s in statement_rows
    ]

    return ReportGroupResponse(
        id=str(row["id"]),
        name=row["name"],
        description=row["description"],
        status=row["status"],
        combined_result=json.loads(row["combined_result"])
        if row["combined_result"]
        else None,
        statements=statements,
        parent_report_id=str(row["parent_report_id"])
        if row["parent_report_id"]
        else None,
        created_at=row["created_at"].isoformat(),
        updated_at=row["updated_at"].isoformat(),
    )


@app.delete("/report-groups/{group_id}")
async def delete_report_group(group_id: str, user: dict = Depends(require_auth)):
    """Delete a report group and all its statements."""
    async with get_db() as conn:
        result = await conn.execute(
            "DELETE FROM report_groups WHERE id = $1 AND user_id = $2",
            group_id,
            user["id"],
        )

    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Тайлангийн бүлэг олдсонгүй")

    return {"deleted": True}


# --- Statements Management ---


@app.post(
    "/report-groups/{group_id}/statements",
    response_model=StatementResponse,
    status_code=201,
)
async def upload_statement(
    group_id: str,
    file: UploadFile = File(...),
    encrypted_text: Optional[str] = Form(None),
    encryption_iv: Optional[str] = Form(None),
    user: dict = Depends(require_auth),
):
    """Upload and parse a statement file for a report group."""
    # Verify report group exists and belongs to user
    async with get_db() as conn:
        rg = await conn.fetchrow(
            "SELECT id FROM report_groups WHERE id = $1 AND user_id = $2",
            group_id,
            user["id"],
        )
        if not rg:
            raise HTTPException(status_code=404, detail="Тайлангийн бүлэг олдсонгүй")

    if not file.filename:
        raise HTTPException(status_code=400, detail="Файлын нэр байхгүй байна")

    # Validate file format
    file_format = ParserFactory.detect_format(file.filename)
    if not file_format:
        supported = ", ".join(ParserFactory.get_supported_extensions())
        raise HTTPException(
            status_code=400,
            detail=f"Дэмжигдээгүй файлын формат. Дэмжигдэх форматууд: {supported}",
        )

    content = await file.read()
    file_size = len(content)

    # Parse the file
    result = await ParserFactory.parse_file(content, file.filename)

    if result.success:
        status = "extracted"
        error_message = None
        extracted_text = encrypted_text if encrypted_text else result.raw_text
        bank_name = result.metadata.get("bank_name")
    else:
        status = "error"
        error_message = result.error
        extracted_text = None
        bank_name = None

    async with get_db() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO statements (
                user_id, report_group_id, file_name, file_format, file_size,
                bank_name, encrypted_text, encryption_iv, status, error_message
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, file_name, file_format, file_size, bank_name,
                      encrypted_text, encryption_iv, status, error_message, created_at
            """,
            user["id"],
            group_id,
            file.filename,
            file_format.value,
            file_size,
            bank_name,
            extracted_text,
            encryption_iv,
            status,
            error_message,
        )

        statement_id = row["id"]

        # If transactions were extracted directly from the file, save them
        if result.success and result.transactions:
            for txn in result.transactions:
                txn_type = "income" if txn.transaction_type == "credit" else "expense"
                await conn.execute(
                    """
                    INSERT INTO transactions (
                        statement_id, user_id, date, description, amount, type,
                        is_categorized
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, false)
                    """,
                    statement_id,
                    user["id"],
                    txn.date,
                    txn.description,
                    txn.amount,
                    txn_type,
                )
            logger.info(
                f"Saved {len(result.transactions)} transactions for statement {statement_id}"
            )

        # Update report group's updated_at
        await conn.execute(
            "UPDATE report_groups SET updated_at = NOW() WHERE id = $1",
            group_id,
        )

    return StatementResponse(
        id=str(row["id"]),
        file_name=row["file_name"],
        file_format=row["file_format"],
        file_size=row["file_size"],
        bank_name=row["bank_name"],
        encrypted_text=row["encrypted_text"],
        encryption_iv=row["encryption_iv"],
        status=row["status"],
        error_message=row["error_message"],
        created_at=row["created_at"].isoformat(),
    )


@app.get("/report-groups/{group_id}/statements", response_model=list[StatementListItem])
async def list_statements(group_id: str, user: dict = Depends(require_auth)):
    """List all statements in a report group."""
    async with get_db() as conn:
        # Verify report group exists and belongs to user
        rg = await conn.fetchrow(
            "SELECT id FROM report_groups WHERE id = $1 AND user_id = $2",
            group_id,
            user["id"],
        )
        if not rg:
            raise HTTPException(status_code=404, detail="Тайлангийн бүлэг олдсонгүй")

        rows = await conn.fetch(
            """
            SELECT id, file_name, file_format, file_size, bank_name, status,
                   error_message, created_at
            FROM statements
            WHERE report_group_id = $1
            ORDER BY created_at ASC
            """,
            group_id,
        )

    return [
        StatementListItem(
            id=str(row["id"]),
            file_name=row["file_name"],
            file_format=row["file_format"],
            file_size=row["file_size"],
            bank_name=row["bank_name"],
            status=row["status"],
            error_message=row["error_message"],
            created_at=row["created_at"].isoformat(),
        )
        for row in rows
    ]


@app.get(
    "/report-groups/{group_id}/statements/{statement_id}",
    response_model=StatementResponse,
)
async def get_statement(
    group_id: str, statement_id: str, user: dict = Depends(require_auth)
):
    """Get a single statement with its encrypted text."""
    async with get_db() as conn:
        row = await conn.fetchrow(
            """
            SELECT s.id, s.file_name, s.file_format, s.file_size, s.bank_name,
                   s.encrypted_text, s.encryption_iv, s.status, s.error_message,
                   s.created_at
            FROM statements s
            JOIN report_groups rg ON rg.id = s.report_group_id
            WHERE s.id = $1 AND s.report_group_id = $2 AND rg.user_id = $3
            """,
            statement_id,
            group_id,
            user["id"],
        )

    if not row:
        raise HTTPException(status_code=404, detail="Хуулга олдсонгүй")

    return StatementResponse(
        id=str(row["id"]),
        file_name=row["file_name"],
        file_format=row["file_format"],
        file_size=row["file_size"],
        bank_name=row["bank_name"],
        encrypted_text=row["encrypted_text"],
        encryption_iv=row["encryption_iv"],
        status=row["status"],
        error_message=row["error_message"],
        created_at=row["created_at"].isoformat(),
    )


@app.delete("/report-groups/{group_id}/statements/{statement_id}")
async def delete_statement(
    group_id: str, statement_id: str, user: dict = Depends(require_auth)
):
    """Remove a statement from a report group."""
    async with get_db() as conn:
        # Verify ownership through report group
        result = await conn.execute(
            """
            DELETE FROM statements s
            USING report_groups rg
            WHERE s.id = $1 AND s.report_group_id = $2
              AND rg.id = s.report_group_id AND rg.user_id = $3
            """,
            statement_id,
            group_id,
            user["id"],
        )

        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Хуулга олдсонгүй")

        # Update report group's updated_at
        await conn.execute(
            "UPDATE report_groups SET updated_at = NOW() WHERE id = $1",
            group_id,
        )

    return {"deleted": True}


# --- Combined Analysis ---


@app.post("/report-groups/{group_id}/analyze")
async def analyze_report_group(group_id: str, user: dict = Depends(require_auth)):
    """
    Get combined text from all statements in a report group for AI analysis.
    The actual AI analysis happens on the frontend.
    """
    async with get_db() as conn:
        # Verify report group exists and belongs to user
        rg = await conn.fetchrow(
            "SELECT id, name FROM report_groups WHERE id = $1 AND user_id = $2",
            group_id,
            user["id"],
        )
        if not rg:
            raise HTTPException(status_code=404, detail="Тайлангийн бүлэг олдсонгүй")

        # Get all successfully extracted statements
        rows = await conn.fetch(
            """
            SELECT id, file_name, bank_name, encrypted_text
            FROM statements
            WHERE report_group_id = $1 AND status = 'extracted'
            ORDER BY created_at ASC
            """,
            group_id,
        )

    if not rows:
        raise HTTPException(
            status_code=400,
            detail="Шинжлэх хуулга олдсонгүй. Хуулга оруулна уу.",
        )

    # Combine all statement texts
    combined_parts = []
    for row in rows:
        combined_parts.append(
            f"\n--- {row['file_name']} ({row['bank_name'] or 'Unknown'}) ---\n"
        )
        combined_parts.append(row["encrypted_text"] or "")

    combined_text = "\n".join(combined_parts)

    return {
        "success": True,
        "combined_text": combined_text,
        "statement_count": len(rows),
        "report_name": rg["name"],
    }


@app.post("/report-groups/{group_id}/save-result")
async def save_report_result(
    group_id: str,
    result: dict,
    user: dict = Depends(require_auth),
):
    """Save the AI analysis result to the report group."""
    async with get_db() as conn:
        row = await conn.fetchrow(
            """
            UPDATE report_groups
            SET combined_result = $1, status = 'analyzed', updated_at = NOW()
            WHERE id = $2 AND user_id = $3
            RETURNING id
            """,
            json.dumps(result, ensure_ascii=False),
            group_id,
            user["id"],
        )

    if not row:
        raise HTTPException(status_code=404, detail="Тайлангийн бүлэг олдсонгүй")

    return {"success": True, "id": str(row["id"])}


# --- Extend Report ---


@app.post("/report-groups/{group_id}/extend", response_model=ReportGroupResponse)
async def extend_report(group_id: str, user: dict = Depends(require_auth)):
    """Create a new report group extending an existing one."""
    async with get_db() as conn:
        # Get original report group
        original = await conn.fetchrow(
            """
            SELECT id, name, description
            FROM report_groups
            WHERE id = $1 AND user_id = $2
            """,
            group_id,
            user["id"],
        )

        if not original:
            raise HTTPException(status_code=404, detail="Тайлангийн бүлэг олдсонгүй")

        # Create new report group with parent reference
        new_name = f"{original['name']} (Өргөтгөсөн)"
        new_row = await conn.fetchrow(
            """
            INSERT INTO report_groups (user_id, name, description, status, parent_report_id)
            VALUES ($1, $2, $3, 'draft', $4)
            RETURNING id, name, description, status, combined_result,
                      parent_report_id, created_at, updated_at
            """,
            user["id"],
            new_name,
            original["description"],
            group_id,
        )

        # Copy statements to new group
        await conn.execute(
            """
            INSERT INTO statements (
                user_id, report_group_id, file_name, file_format, file_size,
                bank_name, encrypted_text, encryption_iv, status
            )
            SELECT user_id, $1, file_name, file_format, file_size,
                   bank_name, encrypted_text, encryption_iv, status
            FROM statements
            WHERE report_group_id = $2
            """,
            str(new_row["id"]),
            group_id,
        )

        # Get copied statements
        statement_rows = await conn.fetch(
            """
            SELECT id, file_name, file_format, file_size, bank_name, status,
                   error_message, created_at
            FROM statements
            WHERE report_group_id = $1
            ORDER BY created_at ASC
            """,
            str(new_row["id"]),
        )

    statements = [
        StatementListItem(
            id=str(s["id"]),
            file_name=s["file_name"],
            file_format=s["file_format"],
            file_size=s["file_size"],
            bank_name=s["bank_name"],
            status=s["status"],
            error_message=s["error_message"],
            created_at=s["created_at"].isoformat(),
        )
        for s in statement_rows
    ]

    return ReportGroupResponse(
        id=str(new_row["id"]),
        name=new_row["name"],
        description=new_row["description"],
        status=new_row["status"],
        combined_result=None,
        statements=statements,
        parent_report_id=str(new_row["parent_report_id"]),
        created_at=new_row["created_at"].isoformat(),
        updated_at=new_row["updated_at"].isoformat(),
    )


# --- Encryption Key Management ---


@app.post("/users/encryption-key", response_model=KeySetupResponse)
async def setup_encryption_key(
    data: KeySetupRequest, user: dict = Depends(require_auth)
):
    """Store user's encryption key salt for key derivation."""
    async with get_db() as conn:
        # Check if key already exists
        existing = await conn.fetchrow(
            "SELECT id FROM user_keys WHERE user_id = $1",
            user["id"],
        )

        if existing:
            # Update existing key
            await conn.execute(
                """
                UPDATE user_keys
                SET salt = $1, verification_hash = $2, created_at = NOW()
                WHERE user_id = $3
                """,
                data.salt,
                data.verification_hash,
                user["id"],
            )
        else:
            # Create new key
            await conn.execute(
                """
                INSERT INTO user_keys (user_id, salt, verification_hash)
                VALUES ($1, $2, $3)
                """,
                user["id"],
                data.salt,
                data.verification_hash,
            )

    return KeySetupResponse(success=True, message="Түлхүүр амжилттай хадгалагдлаа")


@app.get("/users/encryption-key", response_model=KeyInfoResponse)
async def get_encryption_key_info(user: dict = Depends(require_auth)):
    """Get user's key salt for re-deriving encryption key."""
    async with get_db() as conn:
        row = await conn.fetchrow(
            "SELECT salt FROM user_keys WHERE user_id = $1",
            user["id"],
        )

    if not row:
        return KeyInfoResponse(has_key=False)

    return KeyInfoResponse(has_key=True, salt=row["salt"])


# --- Categories Endpoints ---


@app.get("/categories", response_model=CategoryListResponse)
async def get_categories(user: dict = Depends(require_auth)):
    """Get all categories (default + user custom) grouped by type."""
    async with get_db() as conn:
        rows = await conn.fetch(
            """
            SELECT id, name, name_en, type, icon, color, is_default, sort_order, created_at
            FROM categories
            WHERE user_id IS NULL OR user_id = $1
            ORDER BY is_default DESC, sort_order ASC, name ASC
            """,
            user["id"],
        )

    income_categories = []
    expense_categories = []

    for row in rows:
        category = CategoryResponse(
            id=str(row["id"]),
            name=row["name"],
            name_en=row["name_en"],
            type=row["type"],
            icon=row["icon"],
            color=row["color"],
            is_default=row["is_default"],
            sort_order=row["sort_order"],
            created_at=row["created_at"].isoformat(),
        )
        if row["type"] == "income":
            income_categories.append(category)
        else:
            expense_categories.append(category)

    return CategoryListResponse(income=income_categories, expense=expense_categories)


# --- Transactions Endpoints ---


@app.get(
    "/statements/{statement_id}/transactions", response_model=TransactionListResponse
)
async def get_statement_transactions(
    statement_id: str, user: dict = Depends(require_auth)
):
    """Get all transactions for a statement."""
    async with get_db() as conn:
        # Verify statement belongs to user
        stmt = await conn.fetchrow(
            """
            SELECT s.id FROM statements s
            JOIN report_groups rg ON rg.id = s.report_group_id
            WHERE s.id = $1 AND rg.user_id = $2
            """,
            statement_id,
            user["id"],
        )
        if not stmt:
            raise HTTPException(status_code=404, detail="Хуулга олдсонгүй")

        rows = await conn.fetch(
            """
            SELECT t.id, t.statement_id, t.date, t.description, t.amount, t.type,
                   t.category_id, c.name as category_name,
                   t.is_categorized, t.ai_suggested_category_id,
                   ac.name as ai_suggested_category_name,
                   t.created_at, t.updated_at
            FROM transactions t
            LEFT JOIN categories c ON c.id = t.category_id
            LEFT JOIN categories ac ON ac.id = t.ai_suggested_category_id
            WHERE t.statement_id = $1
            ORDER BY t.date DESC, t.created_at DESC
            """,
            statement_id,
        )

    transactions = [
        TransactionResponse(
            id=str(row["id"]),
            statement_id=str(row["statement_id"]) if row["statement_id"] else None,
            date=row["date"].isoformat(),
            description=row["description"],
            amount=float(row["amount"]),
            type=row["type"],
            category_id=str(row["category_id"]) if row["category_id"] else None,
            category_name=row["category_name"],
            is_categorized=row["is_categorized"],
            ai_suggested_category_id=str(row["ai_suggested_category_id"])
            if row["ai_suggested_category_id"]
            else None,
            ai_suggested_category_name=row["ai_suggested_category_name"],
            created_at=row["created_at"].isoformat(),
            updated_at=row["updated_at"].isoformat(),
        )
        for row in rows
    ]

    categorized = sum(1 for t in transactions if t.is_categorized)

    return TransactionListResponse(
        transactions=transactions,
        total=len(transactions),
        categorized_count=categorized,
        uncategorized_count=len(transactions) - categorized,
    )


@app.post(
    "/statements/{statement_id}/transactions",
    response_model=TransactionResponse,
    status_code=201,
)
async def create_transaction(
    statement_id: str, data: TransactionCreate, user: dict = Depends(require_auth)
):
    """Manually add a transaction to a statement."""
    from datetime import date as date_type

    async with get_db() as conn:
        # Verify statement belongs to user
        stmt = await conn.fetchrow(
            """
            SELECT s.id FROM statements s
            JOIN report_groups rg ON rg.id = s.report_group_id
            WHERE s.id = $1 AND rg.user_id = $2
            """,
            statement_id,
            user["id"],
        )
        if not stmt:
            raise HTTPException(status_code=404, detail="Хуулга олдсонгүй")

        # Validate type
        if data.type not in ("income", "expense"):
            raise HTTPException(status_code=400, detail="Төрөл буруу байна")

        # Parse date string to date object
        try:
            txn_date = date_type.fromisoformat(data.date)
        except ValueError:
            try:
                txn_date = datetime.strptime(data.date, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(
                    status_code=400, detail="Огноо буруу форматтай байна"
                )

        is_categorized = data.category_id is not None

        row = await conn.fetchrow(
            """
            INSERT INTO transactions (
                statement_id, user_id, date, description, amount, type,
                category_id, is_categorized
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, statement_id, date, description, amount, type,
                      category_id, is_categorized, ai_suggested_category_id,
                      created_at, updated_at
            """,
            statement_id,
            user["id"],
            txn_date,
            data.description,
            data.amount,
            data.type,
            data.category_id,
            is_categorized,
        )

        # Get category name if exists
        category_name = None
        if row["category_id"]:
            cat = await conn.fetchrow(
                "SELECT name FROM categories WHERE id = $1", row["category_id"]
            )
            if cat:
                category_name = cat["name"]

    return TransactionResponse(
        id=str(row["id"]),
        statement_id=str(row["statement_id"]) if row["statement_id"] else None,
        date=row["date"].isoformat(),
        description=row["description"],
        amount=float(row["amount"]),
        type=row["type"],
        category_id=str(row["category_id"]) if row["category_id"] else None,
        category_name=category_name,
        is_categorized=row["is_categorized"],
        ai_suggested_category_id=None,
        ai_suggested_category_name=None,
        created_at=row["created_at"].isoformat(),
        updated_at=row["updated_at"].isoformat(),
    )


@app.put("/transactions/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: str, data: TransactionUpdate, user: dict = Depends(require_auth)
):
    """Update a transaction (e.g., assign category)."""
    from datetime import date as date_type

    async with get_db() as conn:
        # Verify transaction belongs to user
        txn = await conn.fetchrow(
            "SELECT id FROM transactions WHERE id = $1 AND user_id = $2",
            transaction_id,
            user["id"],
        )
        if not txn:
            raise HTTPException(status_code=404, detail="Гүйлгээ олдсонгүй")

        # Build dynamic update
        updates = ["updated_at = NOW()"]
        values = []
        param_idx = 1

        if data.date is not None:
            # Parse date string to date object
            try:
                txn_date = date_type.fromisoformat(data.date)
            except ValueError:
                try:
                    txn_date = datetime.strptime(data.date, "%Y-%m-%d").date()
                except ValueError:
                    raise HTTPException(
                        status_code=400, detail="Огноо буруу форматтай байна"
                    )
            updates.append(f"date = ${param_idx}")
            values.append(txn_date)
            param_idx += 1

        if data.description is not None:
            updates.append(f"description = ${param_idx}")
            values.append(data.description)
            param_idx += 1

        if data.amount is not None:
            updates.append(f"amount = ${param_idx}")
            values.append(data.amount)
            param_idx += 1

        if data.type is not None:
            if data.type not in ("income", "expense"):
                raise HTTPException(status_code=400, detail="Төрөл буруу байна")
            updates.append(f"type = ${param_idx}")
            values.append(data.type)
            param_idx += 1

        if data.category_id is not None:
            updates.append(f"category_id = ${param_idx}")
            values.append(data.category_id if data.category_id != "" else None)
            param_idx += 1
            # Auto-set is_categorized when category is set
            if data.category_id != "":
                updates.append(f"is_categorized = true")
            else:
                updates.append(f"is_categorized = false")

        if data.is_categorized is not None:
            updates.append(f"is_categorized = ${param_idx}")
            values.append(data.is_categorized)
            param_idx += 1

        values.extend([transaction_id, user["id"]])

        query = f"""
            UPDATE transactions
            SET {", ".join(updates)}
            WHERE id = ${param_idx} AND user_id = ${param_idx + 1}
            RETURNING id, statement_id, date, description, amount, type,
                      category_id, is_categorized, ai_suggested_category_id,
                      created_at, updated_at
        """

        row = await conn.fetchrow(query, *values)

        # Get category names
        category_name = None
        ai_suggested_category_name = None
        if row["category_id"]:
            cat = await conn.fetchrow(
                "SELECT name FROM categories WHERE id = $1", row["category_id"]
            )
            if cat:
                category_name = cat["name"]
        if row["ai_suggested_category_id"]:
            cat = await conn.fetchrow(
                "SELECT name FROM categories WHERE id = $1",
                row["ai_suggested_category_id"],
            )
            if cat:
                ai_suggested_category_name = cat["name"]

    return TransactionResponse(
        id=str(row["id"]),
        statement_id=str(row["statement_id"]) if row["statement_id"] else None,
        date=row["date"].isoformat(),
        description=row["description"],
        amount=float(row["amount"]),
        type=row["type"],
        category_id=str(row["category_id"]) if row["category_id"] else None,
        category_name=category_name,
        is_categorized=row["is_categorized"],
        ai_suggested_category_id=str(row["ai_suggested_category_id"])
        if row["ai_suggested_category_id"]
        else None,
        ai_suggested_category_name=ai_suggested_category_name,
        created_at=row["created_at"].isoformat(),
        updated_at=row["updated_at"].isoformat(),
    )


@app.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, user: dict = Depends(require_auth)):
    """Delete a transaction."""
    async with get_db() as conn:
        result = await conn.execute(
            "DELETE FROM transactions WHERE id = $1 AND user_id = $2",
            transaction_id,
            user["id"],
        )

    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Гүйлгээ олдсонгүй")

    return {"deleted": True}


class BulkCreateTransaction(BaseModel):
    date: str
    description: str
    amount: float
    type: str
    ai_suggested_category_id: Optional[str] = None


class BulkCreateRequest(BaseModel):
    transactions: list[BulkCreateTransaction]


@app.post("/statements/{statement_id}/transactions/bulk", status_code=201)
async def bulk_create_transactions(
    statement_id: str,
    data: BulkCreateRequest,
    user: dict = Depends(require_auth),
):
    """Bulk create transactions for a statement (from AI parsing)."""
    from datetime import date as date_type

    async with get_db() as conn:
        # Verify statement belongs to user
        stmt = await conn.fetchrow(
            """
            SELECT s.id FROM statements s
            JOIN report_groups rg ON rg.id = s.report_group_id
            WHERE s.id = $1 AND rg.user_id = $2
            """,
            statement_id,
            user["id"],
        )
        if not stmt:
            raise HTTPException(status_code=404, detail="Хуулга олдсонгүй")

        created_ids = []
        for txn in data.transactions:
            if txn.type not in ("income", "expense"):
                continue

            # Parse date string to date object
            try:
                txn_date = date_type.fromisoformat(txn.date)
            except ValueError:
                # Try to parse common date formats
                try:
                    txn_date = datetime.strptime(txn.date, "%Y-%m-%d").date()
                except ValueError:
                    continue  # Skip invalid dates

            row = await conn.fetchrow(
                """
                INSERT INTO transactions (
                    statement_id, user_id, date, description, amount, type,
                    ai_suggested_category_id, is_categorized
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, false)
                RETURNING id
                """,
                statement_id,
                user["id"],
                txn_date,
                txn.description,
                txn.amount,
                txn.type,
                txn.ai_suggested_category_id,
            )
            created_ids.append(str(row["id"]))

    return {"created": len(created_ids), "ids": created_ids}


class BulkUpdateRequest(BaseModel):
    transaction_ids: list[str]
    category_id: str


@app.post("/transactions/bulk-update")
async def bulk_update_transactions(
    data: BulkUpdateRequest,
    user: dict = Depends(require_auth),
):
    """Bulk update multiple transactions with the same category."""
    if not data.transaction_ids:
        raise HTTPException(status_code=400, detail="Гүйлгээ сонгоогүй байна")

    async with get_db() as conn:
        # Update all transactions that belong to user
        result = await conn.execute(
            """
            UPDATE transactions
            SET category_id = $1, is_categorized = true, updated_at = NOW()
            WHERE id = ANY($2) AND user_id = $3
            """,
            data.category_id if data.category_id else None,
            data.transaction_ids,
            user["id"],
        )

    # Extract count from result string like "UPDATE 5"
    updated_count = int(result.split(" ")[1]) if result else 0

    return {"updated": updated_count}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
