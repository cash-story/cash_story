"""
Parser factory for creating appropriate parser based on file format.
"""

from typing import Optional

from .base import BaseParser, FileFormat, ParseResult
from .csv_parser import CsvParser
from .excel_parser import ExcelParser
from .pdf_parser import PdfParser


class ParserFactory:
    """
    Factory class for creating file parsers.
    Detects file format and returns appropriate parser.
    """

    _parsers: dict[FileFormat, type[BaseParser]] = {
        FileFormat.PDF: PdfParser,
        FileFormat.XLSX: ExcelParser,
        FileFormat.XLS: ExcelParser,
        FileFormat.CSV: CsvParser,
    }

    @classmethod
    def get_parser(cls, file_format: FileFormat) -> BaseParser:
        """
        Get a parser instance for the specified format.

        Args:
            file_format: The file format to get a parser for

        Returns:
            Parser instance

        Raises:
            ValueError: If format is not supported
        """
        parser_class = cls._parsers.get(file_format)
        if not parser_class:
            raise ValueError(f"Дэмжигдээгүй формат: {file_format}")
        return parser_class()

    @classmethod
    def detect_format(cls, filename: str) -> Optional[FileFormat]:
        """
        Detect file format from filename extension.

        Args:
            filename: The filename to detect format from

        Returns:
            FileFormat if detected, None otherwise
        """
        if not filename:
            return None

        ext = filename.lower().split(".")[-1]
        format_map = {
            "pdf": FileFormat.PDF,
            "xlsx": FileFormat.XLSX,
            "xls": FileFormat.XLS,
            "csv": FileFormat.CSV,
        }
        return format_map.get(ext)

    @classmethod
    def get_supported_extensions(cls) -> list[str]:
        """
        Get list of supported file extensions.

        Returns:
            List of supported extensions (without dots)
        """
        return ["pdf", "xlsx", "xls", "csv"]

    @classmethod
    def get_supported_mime_types(cls) -> list[str]:
        """
        Get list of supported MIME types.

        Returns:
            List of supported MIME types
        """
        return [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  # xlsx
            "application/vnd.ms-excel",  # xls
            "text/csv",
            "application/csv",
        ]

    @classmethod
    async def parse_file(
        cls, file_content: bytes, filename: str, max_chars: int = 50000
    ) -> ParseResult:
        """
        Parse a file by detecting its format and using the appropriate parser.

        Args:
            file_content: Raw bytes of the file
            filename: Original filename
            max_chars: Maximum characters to extract

        Returns:
            ParseResult with extracted data
        """
        file_format = cls.detect_format(filename)
        if not file_format:
            ext = filename.split(".")[-1] if "." in filename else "unknown"
            return ParseResult(
                success=False,
                raw_text="",
                error=f"Дэмжигдээгүй файлын формат: .{ext}. Дэмжигдэх форматууд: PDF, Excel (xlsx, xls), CSV",
            )

        parser = cls.get_parser(file_format)
        return await parser.parse(file_content, filename, max_chars)
