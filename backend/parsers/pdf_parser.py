"""
PDF parser using pdfplumber.
Optimized for bank statement PDFs with tabular data.
"""

from __future__ import annotations

import io
import logging
import re
from datetime import datetime
from typing import List, Optional

import pdfplumber

from .base import BaseParser, ParsedTransaction, ParseResult

logger = logging.getLogger(__name__)


class PdfParser(BaseParser):
    """Parser for PDF bank statements using pdfplumber."""

    def _extract_with_table_settings(
        self, page, settings: dict
    ) -> Optional[List[List[str]]]:
        """Try to extract tables with specific settings."""
        try:
            tables = page.extract_tables(settings)
            if tables:
                return tables
        except Exception:
            pass
        return None

    def _has_valid_data_rows(self, text_parts: List[str]) -> bool:
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

    def _parse_amount(self, amount_str: str) -> float:
        """Parse amount string to float, handling Mongolian number formats."""
        if not amount_str:
            return 0.0
        # Remove commas and spaces, handle both . and , as decimal separators
        cleaned = amount_str.replace(",", "").replace(" ", "").strip()
        try:
            return float(cleaned)
        except ValueError:
            return 0.0

    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse various date formats from bank statements."""
        if not date_str:
            return None

        date_str = date_str.strip()

        # Common date formats in Mongolian bank statements
        formats = [
            "%Y.%m.%d",  # 2026.02.01
            "%Y.%m.%d %H:%M:%S%p",  # 2026.2.1 3:32:01AM
            "%Y.%m.%d %I:%M:%S%p",  # 2026.2.1 3:32:01AM (12-hour)
            "%Y-%m-%d",  # 2026-02-01
            "%d.%m.%Y",  # 01.02.2026
            "%d/%m/%Y",  # 01/02/2026
            "%Y/%m/%d",  # 2026/02/01
        ]

        # Try to extract just the date part if there's time info
        date_part = re.split(r"\s+", date_str)[0]

        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                pass
            try:
                return datetime.strptime(date_part, fmt.split()[0])
            except ValueError:
                pass

        return None

    def _extract_transactions_from_table(
        self, table: List[List[str]], bank_name: Optional[str]
    ) -> List[ParsedTransaction]:
        """Extract transactions from a parsed table based on bank format."""
        transactions = []

        if not table or len(table) < 2:
            return transactions

        # Find header row and column indices
        header_row = None
        header_idx = -1

        for idx, row in enumerate(table):
            if not row:
                continue
            row_lower = [str(cell).lower() if cell else "" for cell in row]
            row_text = " ".join(row_lower)

            # Look for common header patterns
            if any(
                kw in row_text
                for kw in ["огноо", "date", "орлого", "зарлага", "дебит", "кредит"]
            ):
                header_row = row
                header_idx = idx
                break

        if header_row is None:
            return transactions

        # Map column indices
        col_map = {}
        for i, cell in enumerate(header_row):
            if not cell:
                continue
            cell_lower = str(cell).lower().strip()

            if "огноо" in cell_lower or "date" in cell_lower:
                col_map["date"] = i
            elif (
                "орлого" in cell_lower
                or "credit" in cell_lower
                or "кредит" in cell_lower
            ):
                col_map["income"] = i
            elif (
                "зарлага" in cell_lower
                or "debit" in cell_lower
                or "дебит" in cell_lower
            ):
                col_map["expense"] = i
            elif (
                "утга" in cell_lower
                or "description" in cell_lower
                or "тайлбар" in cell_lower
            ):
                col_map["description"] = i
            elif "үлдэгдэл" in cell_lower or "balance" in cell_lower:
                col_map["balance"] = i

        # Need at least date and one of income/expense
        if "date" not in col_map:
            return transactions
        if "income" not in col_map and "expense" not in col_map:
            return transactions

        logger.info(f"Found column mapping: {col_map}")

        # Process data rows
        for row in table[header_idx + 1 :]:
            if not row:
                continue

            # Skip summary rows (Нийт:, Total:, etc.)
            first_cell = str(row[0]).lower() if row[0] else ""
            if any(kw in first_cell for kw in ["нийт", "total", "дүн", "sum"]):
                continue

            try:
                # Extract date
                date_str = row[col_map["date"]] if col_map["date"] < len(row) else None
                parsed_date = self._parse_date(str(date_str) if date_str else "")
                if not parsed_date:
                    continue

                # Extract amounts
                income_amount = 0.0
                expense_amount = 0.0

                if "income" in col_map and col_map["income"] < len(row):
                    income_amount = self._parse_amount(
                        str(row[col_map["income"]] or "")
                    )

                if "expense" in col_map and col_map["expense"] < len(row):
                    expense_amount = self._parse_amount(
                        str(row[col_map["expense"]] or "")
                    )

                # Determine transaction type and amount
                if income_amount > 0 and expense_amount == 0:
                    txn_type = "credit"
                    amount = income_amount
                elif expense_amount > 0 and income_amount == 0:
                    txn_type = "debit"
                    amount = expense_amount
                elif income_amount > 0:
                    txn_type = "credit"
                    amount = income_amount
                elif expense_amount > 0:
                    txn_type = "debit"
                    amount = expense_amount
                else:
                    continue  # Skip rows with no amounts

                # Extract description
                description = ""
                if "description" in col_map and col_map["description"] < len(row):
                    description = str(row[col_map["description"]] or "").strip()

                # If no description column, try to build from other cells
                if not description:
                    # Use non-numeric cells as description
                    desc_parts = []
                    for i, cell in enumerate(row):
                        if i in col_map.values():
                            continue
                        if cell and not re.match(r"^[\d,.\s]+$", str(cell)):
                            desc_parts.append(str(cell).strip())
                    description = " ".join(desc_parts)[:200]

                # Extract balance if available
                balance = None
                if "balance" in col_map and col_map["balance"] < len(row):
                    balance = self._parse_amount(str(row[col_map["balance"]] or ""))

                txn = ParsedTransaction(
                    date=parsed_date.date(),
                    description=description or "Гүйлгээ",
                    amount=amount,
                    transaction_type=txn_type,
                    balance=balance,
                    raw_data={"row": row},
                )
                transactions.append(txn)

            except Exception as e:
                logger.debug(f"Failed to parse row: {row}, error: {e}")
                continue

        logger.info(f"Extracted {len(transactions)} transactions from table")
        return transactions

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
            all_transactions = []
            all_tables = []  # Store raw tables for transaction extraction

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
                    page_tables = []

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
                                page_tables = (
                                    tables  # Save tables for transaction extraction
                                )
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

                    # Collect tables for transaction extraction
                    all_tables.extend(page_tables)

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

            # Extract transactions from tables
            for table in all_tables:
                txns = self._extract_transactions_from_table(table, bank_name)
                all_transactions.extend(txns)

            logger.info(
                f"PDF parsing complete: {len(all_transactions)} transactions extracted"
            )

            return ParseResult(
                success=True,
                raw_text=full_text[:max_chars],
                transactions=all_transactions,
                metadata={
                    "pages": page_count,
                    "bank_name": bank_name,
                    "format": "pdf",
                    "filename": filename,
                    "transactions_extracted": len(all_transactions),
                },
            )

        except Exception as e:
            logger.exception("PDF parsing error")
            return ParseResult(
                success=False,
                raw_text="",
                error=f"PDF уншихад алдаа гарлаа: {str(e)}",
            )
