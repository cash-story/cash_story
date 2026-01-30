"""
PDF parser using pdfplumber.
Optimized for bank statement PDFs with tabular data.
"""

import io
from typing import Optional

import pdfplumber

from .base import BaseParser, ParseResult


class PdfParser(BaseParser):
    """Parser for PDF bank statements using pdfplumber."""

    async def parse(
        self, file_content: bytes, filename: str, max_chars: int = 50000
    ) -> ParseResult:
        """
        Extract text from a PDF file.

        Args:
            file_content: Raw bytes of the PDF file
            filename: Original filename
            max_chars: Maximum characters to extract

        Returns:
            ParseResult with extracted text and metadata
        """
        try:
            text_parts = []
            total_chars = 0
            page_count = 0

            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                page_count = len(pdf.pages)

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
                return ParseResult(
                    success=False,
                    raw_text="",
                    error="PDF файлаас текст олдсонгүй. Зураг PDF байж магадгүй.",
                )

            # Detect bank name
            bank_name = self.detect_bank(full_text)

            return ParseResult(
                success=True,
                raw_text=full_text[:max_chars],
                metadata={
                    "pages": page_count,
                    "bank_name": bank_name,
                    "format": "pdf",
                    "filename": filename,
                },
            )

        except Exception as e:
            return ParseResult(
                success=False,
                raw_text="",
                error=f"PDF уншихад алдаа гарлаа: {str(e)}",
            )
