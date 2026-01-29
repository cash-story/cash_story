#!/usr/bin/env python3
"""
FastAPI server for PDF text extraction and analysis storage.
Run with: uvicorn server:app --host 0.0.0.0 --port 8001
"""

import io
import json
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

import pdfplumber
from auth import require_auth, verify_google_token
from database import close_db, get_db, init_db
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from models import (
    AnalysisCreate,
    AnalysisListItem,
    AnalysisResponse,
    UserResponse,
)
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


# --- PDF Extraction ---


class ExtractionResult(BaseModel):
    success: bool
    text: Optional[str] = None
    error: Optional[str] = None
    pages: int = 0


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.post("/extract", response_model=ExtractionResult)
async def extract_text(file: UploadFile = File(...), max_chars: int = 50000):
    """
    Extract text from uploaded PDF file.

    - **file**: PDF file to extract text from
    - **max_chars**: Maximum characters to extract (default 50000)
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF файл биш байна")

    try:
        content = await file.read()
        pdf_stream = io.BytesIO(content)

        text_parts = []
        total_chars = 0
        num_pages = 0

        with pdfplumber.open(pdf_stream) as pdf:
            num_pages = len(pdf.pages)

            for page in pdf.pages:
                if total_chars >= max_chars:
                    text_parts.append("\n\n[Текст хэт урт тул товчилсон...]")
                    break

                tables = page.extract_tables()
                if tables:
                    for table in tables:
                        for row in table:
                            if row:
                                row_text = "\t".join(
                                    cell.strip() if cell else "" for cell in row
                                )
                                if row_text.strip():
                                    text_parts.append(row_text)
                                    total_chars += len(row_text)
                                    if total_chars >= max_chars:
                                        break
                        if total_chars >= max_chars:
                            break
                else:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
                        total_chars += len(page_text)

        full_text = "\n".join(text_parts).strip()

        if not full_text:
            return ExtractionResult(
                success=False,
                error="PDF файлаас текст олдсонгүй. Зураг PDF байж магадгүй.",
            )

        return ExtractionResult(
            success=True, text=full_text[:max_chars], pages=num_pages
        )

    except Exception as e:
        return ExtractionResult(
            success=False, error=f"PDF уншихад алдаа гарлаа: {str(e)}"
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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
