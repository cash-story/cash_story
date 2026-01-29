#!/usr/bin/env python3
"""
FastAPI server for PDF text extraction and analysis storage.
Run with: uvicorn server:app --host 0.0.0.0 --port 8001
"""

import io
import json
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

import pdfplumber
from database import get_db, init_db
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from models import AnalysisCreate, AnalysisListItem, AnalysisResponse
from pydantic import BaseModel


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    await init_db()
    yield


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


# --- Analysis CRUD ---


@app.post("/analyses", response_model=AnalysisResponse, status_code=201)
async def save_analysis(data: AnalysisCreate):
    """Save a financial analysis result."""
    analysis_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO analyses (id, file_name, bank_name, result, created_at) VALUES (?, ?, ?, ?, ?)",
            (
                analysis_id,
                data.file_name,
                data.bank_name,
                json.dumps(data.result, ensure_ascii=False),
                created_at,
            ),
        )
        await db.commit()
    finally:
        await db.close()

    return AnalysisResponse(
        id=analysis_id,
        file_name=data.file_name,
        bank_name=data.bank_name,
        result=data.result,
        created_at=created_at,
    )


@app.get("/analyses", response_model=list[AnalysisListItem])
async def list_analyses(limit: int = 20):
    """List recent analyses (without full result data)."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, file_name, bank_name, created_at FROM analyses ORDER BY created_at DESC LIMIT ?",
            (limit,),
        )
        rows = await cursor.fetchall()
    finally:
        await db.close()

    return [
        AnalysisListItem(
            id=row["id"],
            file_name=row["file_name"],
            bank_name=row["bank_name"],
            created_at=row["created_at"],
        )
        for row in rows
    ]


@app.get("/analyses/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: str):
    """Get a saved analysis by ID."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, file_name, bank_name, result, created_at FROM analyses WHERE id = ?",
            (analysis_id,),
        )
        row = await cursor.fetchone()
    finally:
        await db.close()

    if not row:
        raise HTTPException(status_code=404, detail="Шинжилгээ олдсонгүй")

    return AnalysisResponse(
        id=row["id"],
        file_name=row["file_name"],
        bank_name=row["bank_name"],
        result=json.loads(row["result"]),
        created_at=row["created_at"],
    )


@app.delete("/analyses/{analysis_id}")
async def delete_analysis(analysis_id: str):
    """Delete a saved analysis."""
    db = await get_db()
    try:
        cursor = await db.execute("DELETE FROM analyses WHERE id = ?", (analysis_id,))
        await db.commit()
        deleted = cursor.rowcount
    finally:
        await db.close()

    if not deleted:
        raise HTTPException(status_code=404, detail="Шинжилгээ олдсонгүй")

    return {"deleted": True}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
