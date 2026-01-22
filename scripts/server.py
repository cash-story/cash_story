#!/usr/bin/env python3
"""
FastAPI server for fast PDF text extraction.
Run with: uvicorn scripts.server:app --host 0.0.0.0 --port 8001
"""

import io

import pdfplumber
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="PDF Extractor API",
    description="Fast PDF text extraction service",
    version="1.0.0",
)

# Allow CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
)


class ExtractionResult(BaseModel):
    success: bool
    text: str | None = None
    error: str | None = None
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
    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF файл биш байна")

    try:
        # Read file content
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

                # Extract tables first (better for bank statements)
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
                    # Fallback to regular text extraction
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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
