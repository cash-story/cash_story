"""
PDF parser using pdfplumber.
Optimized for bank statement PDFs with tabular data.
"""

import io
import logging
from typing import Optional

import pdfplumber

from .base import BaseParser, ParseResult

logger = logging.getLogger(__name__)


class PdfParser(BaseParser):
    """Parser for PDF bank statements using pdfplumber."""

    def _extract_with_table_settings(
        self, page, settings: dict
    ) -> list[list[str]] | None:
        """Try to extract tables with specific settings."""
        try:
            tables = page.extract_tables(settings)
            if tables:
                return tables
        except Exception:
            pass
        return None

    def _has_valid_data_rows(self, text_parts: list[str]) -> bool:
        """Check if extracted text has actual data rows, not just headers."""
        if len(text_parts) < 2:
            return False

        # Check for duplicate lines (sign of bad extraction)
        unique_lines = set(text_parts[:10])
        if len(unique_lines) <= 2:
            return False

        # Check if we have date-like patterns in the data
        date_patterns = ["2024", "2025", "2026", "2023"]
        has_dates = any(
            any(dp in line for dp in date_patterns) for line in text_parts[1:5]
        )

        return has_dates

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

            # Different table extraction strategies for different bank formats
            table_settings_list = [
                # Strategy 1: Default settings
                {},
                # Strategy 2: Explicit line detection (good for TDB)
                {
                    "vertical_strategy": "lines",
                    "horizontal_strategy": "lines",
                },
                # Strategy 3: Text-based detection
                {
                    "vertical_strategy": "text",
                    "horizontal_strategy": "text",
                },
                # Strategy 4: Lines + text hybrid
                {
                    "vertical_strategy": "lines",
                    "horizontal_strategy": "text",
                },
                # Strategy 5: Relaxed tolerance
                {
                    "snap_tolerance": 5,
                    "join_tolerance": 5,
                },
            ]

            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                page_count = len(pdf.pages)

                for page in pdf.pages:
                    if total_chars >= max_chars:
                        text_parts.append("\n\n[Текст хэт урт тул товчилсон...]")
                        break

                    page_text_parts = []
                    extraction_success = False

                    # Try different table extraction strategies
                    for settings in table_settings_list:
                        tables = self._extract_with_table_settings(page, settings)
                        if tables:
                            temp_parts = []
                            for table in tables:
                                for row in table:
                                    if row:
                                        # Filter out None values and join
                                        cells = [
                                            str(cell).strip() if cell else ""
                                            for cell in row
                                        ]
                                        row_text = "\t".join(cells)
                                        if row_text.strip():
                                            temp_parts.append(row_text)

                            # Check if this extraction has valid data
                            if self._has_valid_data_rows(temp_parts):
                                page_text_parts = temp_parts
                                extraction_success = True
                                logger.debug(
                                    f"Table extraction successful with settings: {settings}"
                                )
                                break

                    # Fallback: Use regular text extraction
                    if not extraction_success:
                        page_text = page.extract_text(
                            layout=True,  # Preserve layout
                            x_tolerance=3,
                            y_tolerance=3,
                        )
                        if page_text:
                            # Split by lines and clean up
                            lines = page_text.split("\n")
                            page_text_parts = [
                                line.strip() for line in lines if line.strip()
                            ]
                            logger.debug("Using text extraction fallback")

                    # Add to results
                    for line in page_text_parts:
                        text_parts.append(line)
                        total_chars += len(line)
                        if total_chars >= max_chars:
                            break

            full_text = "\n".join(text_parts).strip()

            # Log extraction result for debugging
            logger.info(f"PDF extraction: {len(text_parts)} lines, {total_chars} chars")
            if text_parts:
                logger.debug(f"First 3 lines: {text_parts[:3]}")

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
            logger.exception("PDF parsing error")
            return ParseResult(
                success=False,
                raw_text="",
                error=f"PDF уншихад алдаа гарлаа: {str(e)}",
            )
