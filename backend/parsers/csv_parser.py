"""
CSV parser with automatic encoding and delimiter detection.
Uses chardet for encoding detection.
"""

import csv
import io
from typing import Optional

from .base import BaseParser, ParseResult


class CsvParser(BaseParser):
    """Parser for CSV bank statements with automatic encoding detection."""

    async def parse(
        self, file_content: bytes, filename: str, max_chars: int = 50000
    ) -> ParseResult:
        """
        Extract text from a CSV file.

        Args:
            file_content: Raw bytes of the CSV file
            filename: Original filename
            max_chars: Maximum characters to extract

        Returns:
            ParseResult with extracted text and metadata
        """
        try:
            # Detect encoding
            encoding = self._detect_encoding(file_content)

            # Decode content
            try:
                text_content = file_content.decode(encoding)
            except UnicodeDecodeError:
                # Fallback to utf-8 with error handling
                text_content = file_content.decode("utf-8", errors="replace")

            # Detect delimiter
            delimiter = self._detect_delimiter(text_content)

            # Parse CSV
            text_parts = []
            total_chars = 0
            total_rows = 0

            reader = csv.reader(io.StringIO(text_content), delimiter=delimiter)

            for row in reader:
                if total_chars >= max_chars:
                    text_parts.append("\n\n[Текст хэт урт тул товчилсон...]")
                    break

                # Skip completely empty rows
                if all(cell.strip() == "" for cell in row):
                    continue

                row_text = "\t".join(cell.strip() for cell in row)
                if row_text.strip():
                    text_parts.append(row_text)
                    total_chars += len(row_text)
                    total_rows += 1

            full_text = "\n".join(text_parts).strip()

            if not full_text:
                return ParseResult(
                    success=False,
                    raw_text="",
                    error="CSV файлаас өгөгдөл олдсонгүй.",
                )

            bank_name = self.detect_bank(full_text)

            return ParseResult(
                success=True,
                raw_text=full_text[:max_chars],
                metadata={
                    "rows": total_rows,
                    "encoding": encoding,
                    "delimiter": delimiter,
                    "bank_name": bank_name,
                    "format": "csv",
                    "filename": filename,
                },
            )

        except Exception as e:
            return ParseResult(
                success=False,
                raw_text="",
                error=f"CSV файл уншихад алдаа гарлаа: {str(e)}",
            )

    def _detect_encoding(self, content: bytes) -> str:
        """
        Detect the encoding of the file content.

        Args:
            content: Raw bytes of the file

        Returns:
            Detected encoding name
        """
        try:
            import chardet

            result = chardet.detect(content)
            encoding = result.get("encoding", "utf-8")

            # Handle common encoding aliases
            if encoding:
                encoding = encoding.lower()
                if encoding in ("ascii", "iso-8859-1", "windows-1252"):
                    # These are often misdetected for UTF-8 files
                    try:
                        content.decode("utf-8")
                        return "utf-8"
                    except UnicodeDecodeError:
                        pass
                return encoding
            return "utf-8"

        except ImportError:
            # chardet not installed, try common encodings
            for encoding in ["utf-8", "utf-16", "cp1251", "iso-8859-1"]:
                try:
                    content.decode(encoding)
                    return encoding
                except UnicodeDecodeError:
                    continue
            return "utf-8"

    def _detect_delimiter(self, content: str) -> str:
        """
        Detect the CSV delimiter.

        Args:
            content: Decoded text content

        Returns:
            Detected delimiter character
        """
        # Take first few lines for detection
        lines = content.split("\n")[:10]
        sample = "\n".join(lines)

        # Try to use csv.Sniffer
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
            return dialect.delimiter
        except csv.Error:
            pass

        # Manual detection based on character frequency
        delimiters = {
            ",": sample.count(","),
            ";": sample.count(";"),
            "\t": sample.count("\t"),
            "|": sample.count("|"),
        }

        # Return the most common delimiter, default to comma
        max_delimiter = max(delimiters, key=delimiters.get)
        if delimiters[max_delimiter] > 0:
            return max_delimiter
        return ","
