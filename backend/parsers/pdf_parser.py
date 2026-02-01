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

    def _extract_transactions_from_text(self, raw_text: str) -> List[ParsedTransaction]:
        """
        Extract transactions from raw text when table extraction fails.
        Runs BOTH extraction methods and combines results since TDB multi-page PDFs
        have different formats: page 1 uses tab-separated (split dates),
        pages 2+ use line-based (full dates).
        """
        # Method 1: Tab-separated format (single-line TDB, typically page 1)
        tab_transactions = self._extract_from_tab_separated(raw_text)
        logger.info(
            f"[PDF Parser] Tab-separated extraction: {len(tab_transactions)} transactions"
        )

        # Method 2: Line-based format with full dates (pages 2+)
        line_transactions = self._extract_from_lines(raw_text)
        logger.info(
            f"[PDF Parser] Line-based extraction: {len(line_transactions)} transactions"
        )

        # Combine both results
        all_transactions = tab_transactions + line_transactions

        # Deduplicate by (date, amount, type) - same transaction might be extracted twice
        seen = set()
        unique_transactions = []
        for txn in all_transactions:
            key = (txn.date, txn.amount, txn.transaction_type)
            if key not in seen:
                seen.add(key)
                unique_transactions.append(txn)

        logger.info(
            f"[PDF Parser] Total from raw text: {len(unique_transactions)} transactions "
            f"(after dedup from {len(all_transactions)})"
        )
        return unique_transactions

    def _extract_from_tab_separated(self, raw_text: str) -> List[ParsedTransaction]:
        """
        Extract from tab-separated single-line format (TDB single page).

        TDB columns: Огноо | Теллер | Орлого | Зарлага | Ханш | Харьцсан данс | Үлдэгдэл | Гүйлгээний утга
        Offsets from date cell:
          +0 = Date (split: 25.1.1)
          +1 = Teller ID (numeric, like 1, 2, 3 - NOT the amount!)
          +2 = Income (Орлого)
          +3 = Expense (Зарлага)
          +4 = Exchange Rate (Ханш)
          +5 = Related Account (Харьцсан данс)
          +6 = Balance (Үлдэгдэл)
          +7 = Description (Гүйлгээний утга) - LAST
        """
        transactions = []
        parts = raw_text.split("\t")

        i = 0
        while i < len(parts) - 7:  # Need at least 8 parts after date
            cell = parts[i].strip()

            # Look for split date pattern: 25.1.1 (yy.mm.dd)
            if re.match(r"^\d{1,2}\.\d{1,2}\.\d{1,2}$", cell):
                prev_cell = parts[i - 1].strip() if i > 0 else ""
                # Previous cell should end with year prefix (like "ШИМТГЭЛ20" or just "20")
                if prev_cell.endswith("20") or prev_cell.endswith("19"):
                    date_parts_match = re.match(
                        r"^(\d{1,2})\.(\d{1,2})\.(\d{1,2})$", cell
                    )
                    if date_parts_match:
                        yy, mm, dd = date_parts_match.groups()
                        full_year = f"20{yy}" if int(yy) < 50 else f"19{yy}"
                        date_str = f"{full_year}.{mm}.{dd}"

                        parsed_date = self._parse_date(date_str)
                        if parsed_date:
                            try:
                                # Print raw parts for debugging (print shows in Railway logs)
                                print(
                                    f"[TDB] date={date_str} | "
                                    f"+1={parts[i + 1][:15] if i + 1 < len(parts) else '-'} | "
                                    f"+2={parts[i + 2][:15] if i + 2 < len(parts) else '-'} | "
                                    f"+3={parts[i + 3][:15] if i + 3 < len(parts) else '-'} | "
                                    f"+4={parts[i + 4][:15] if i + 4 < len(parts) else '-'} | "
                                    f"+5={parts[i + 5][:15] if i + 5 < len(parts) else '-'} | "
                                    f"+6={parts[i + 6][:15] if i + 6 < len(parts) else '-'} | "
                                    f"+7={parts[i + 7][:15] if i + 7 < len(parts) else '-'}",
                                    flush=True,
                                )

                                # Correct offsets based on TDB format:
                                # +1 = Teller (skip this!)
                                # +2 = Income (Орлого)
                                # +3 = Expense (Зарлага)
                                income_str = (
                                    parts[i + 2].strip() if i + 2 < len(parts) else "0"
                                )
                                expense_str = (
                                    parts[i + 3].strip() if i + 3 < len(parts) else "0"
                                )

                                income = self._parse_amount(income_str)
                                expense = self._parse_amount(expense_str)

                                if expense > 0 and income == 0:
                                    txn_type = "debit"
                                    amount = expense
                                elif income > 0 and expense == 0:
                                    txn_type = "credit"
                                    amount = income
                                elif income > 0:
                                    txn_type = "credit"
                                    amount = income
                                else:
                                    i += 1
                                    continue

                                # Skip if amount is too small (likely parsing error)
                                if amount < 10:
                                    i += 1
                                    continue

                                # Description is at the END - look for it after balance
                                # Try offset +7, +8, or search for text
                                description = ""
                                for j in range(i + 7, min(i + 12, len(parts))):
                                    desc_cell = parts[j].strip()
                                    if not desc_cell or len(desc_cell) < 2:
                                        continue
                                    # Skip pure numeric cells
                                    if re.match(r"^[\d,.\s]+$", desc_cell):
                                        continue
                                    # Skip very short codes
                                    if len(desc_cell) < 3:
                                        continue
                                    description = desc_cell
                                    break

                                description = re.sub(r"\s+", " ", description).strip()[
                                    :100
                                ]

                                # Try to get balance from offset +6
                                balance = None
                                if i + 6 < len(parts):
                                    balance = self._parse_amount(parts[i + 6].strip())

                                txn = ParsedTransaction(
                                    date=parsed_date.date(),
                                    description=description or "Гүйлгээ",
                                    amount=amount,
                                    transaction_type=txn_type,
                                    balance=balance
                                    if balance and balance > 0
                                    else None,
                                    raw_data={"parts": parts[i : i + 10]},
                                )
                                transactions.append(txn)

                            except (IndexError, ValueError) as e:
                                logger.debug(f"Tab parse failed at {i}: {e}")

            i += 1

        return transactions

    def _extract_from_lines(self, raw_text: str) -> List[ParsedTransaction]:
        """
        Extract from multi-line format with full dates (multi-page PDFs).

        TDB columns: Огноо | Теллер | Орлого | Зарлага | Ханш | Харьцсан данс | Үлдэгдэл | Гүйлгээний утга
        In line format, amounts appear as: 0.00 for income, then 500.00 for expense (or vice versa)
        The FIRST amount after teller is Income, SECOND is Expense.
        Description is typically at the END of the line.
        """
        transactions = []

        # Split by newlines
        lines = raw_text.split("\n")

        # Pattern for full date: 2025.2.1 or 2025.02.01 or 2025-02-01
        date_pattern = r"(20\d{2}[.\-/]\d{1,2}[.\-/]\d{1,2})"
        # Pattern for amounts: 0.00, 500.00, 20,000.00
        amount_pattern = r"([\d,]+\.\d{2})"

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Skip header/summary lines
            line_lower = line.lower()
            if any(
                kw in line_lower
                for kw in ["огноо", "теллер", "нийт:", "total", "үлдэгдэл:", "хамра"]
            ):
                continue

            # Find date in line
            date_match = re.search(date_pattern, line)
            if not date_match:
                continue

            parsed_date = self._parse_date(date_match.group(1))
            if not parsed_date:
                continue

            # Find all amounts in line
            amounts = re.findall(amount_pattern, line)
            if len(amounts) < 2:
                continue

            # TDB format: amounts[0] = Income (Орлого), amounts[1] = Expense (Зарлага)
            # One will be 0.00, the other will have the actual amount
            income = self._parse_amount(amounts[0])
            expense = self._parse_amount(amounts[1])

            if expense > 0 and income == 0:
                txn_type = "debit"
                amount = expense
            elif income > 0 and expense == 0:
                txn_type = "credit"
                amount = income
            elif income > 0:
                txn_type = "credit"
                amount = income
            else:
                continue

            # Skip if amount is too small (likely parsing error - teller ID is 1-9)
            if amount < 10:
                continue

            # Extract description - it's typically the LAST text part on the line
            # Look for Mongolian/English text
            desc_parts = re.findall(
                r"[А-Яа-яҮүӨөA-Za-z][А-Яа-яҮүӨөA-Za-z\s\-:()0-9]+", line, re.UNICODE
            )
            description = ""
            # Take the LAST meaningful text part (description is at the end in TDB)
            for part in reversed(desc_parts):
                part = part.strip()
                # Skip short parts, header-like text, and AM/PM
                if len(part) > 3 and part.lower() not in ["am", "pm"]:
                    # Skip if it's just a number with text prefix
                    if not re.match(r"^[A-Za-z]{1,2}\d+$", part):
                        description = part[:100]
                        break

            txn = ParsedTransaction(
                date=parsed_date.date(),
                description=description or "Гүйлгээ",
                amount=amount,
                transaction_type=txn_type,
                balance=None,
                raw_data={"line": line[:200]},
            )
            transactions.append(txn)

        return transactions

    async def parse(
        self, file_content: bytes, filename: str, max_chars: int = 2000000
    ) -> ParseResult:
        """
        Extract text from a PDF file.

        Args:
            file_content: Raw bytes of the PDF file
            filename: Original filename
            max_chars: Maximum characters to extract (default 2MB for large statements)

        Returns:
            ParseResult with extracted text and metadata
        """
        try:
            text_parts = []
            total_chars = 0
            page_count = 0
            all_transactions = []
            all_tables = []  # Store raw tables for transaction extraction
            text_limit_reached = False

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
                logger.info(f"[PDF Parser] Starting PDF with {page_count} pages")

                for page_num, page in enumerate(pdf.pages):
                    logger.info(
                        f"[PDF Parser] Processing page {page_num + 1}/{page_count}"
                    )
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
                                    f"Page {page_num + 1}: Table extraction successful"
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
                            logger.debug(
                                f"Page {page_num + 1}: Using text extraction fallback"
                            )

                    # Add text to results (up to limit)
                    if not text_limit_reached:
                        for line in page_text_parts:
                            text_parts.append(line)
                            total_chars += len(line)
                            if total_chars >= max_chars:
                                text_limit_reached = True
                                text_parts.append(
                                    "\n\n[Текст хэт урт тул товчилсон...]"
                                )
                                break

                    # Always collect tables for transaction extraction (even after text limit)
                    all_tables.extend(page_tables)

                    logger.info(
                        f"[PDF Parser] Page {page_num + 1}: extracted {len(page_text_parts)} text parts, "
                        f"{len(page_tables)} tables, total_chars={total_chars}, text_limit_reached={text_limit_reached}"
                    )

                logger.info(
                    f"[PDF Parser] Finished all pages: {page_count} pages, {len(all_tables)} total tables, {total_chars} total chars"
                )

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
            logger.info(
                f"[PDF Parser] Extracting transactions from {len(all_tables)} tables"
            )
            for idx, table in enumerate(all_tables):
                txns = self._extract_transactions_from_table(table, bank_name)
                logger.info(
                    f"[PDF Parser] Table {idx + 1}: extracted {len(txns)} transactions"
                )
                all_transactions.extend(txns)

            # Fallback: if no transactions from tables, try extracting from raw text
            if not all_transactions:
                logger.info(
                    "[PDF Parser] No transactions from tables, trying raw text extraction"
                )
                all_transactions = self._extract_transactions_from_text(full_text)
                logger.info(
                    f"[PDF Parser] Raw text extraction: {len(all_transactions)} transactions"
                )

            logger.info(
                f"[PDF Parser] COMPLETE: {len(all_transactions)} total transactions extracted from {page_count} pages"
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
