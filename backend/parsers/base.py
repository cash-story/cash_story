"""
Base parser class and common data structures for file parsing.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date
from enum import Enum
from typing import Any, Optional


class FileFormat(Enum):
    """Supported file formats for bank statements."""

    PDF = "pdf"
    XLSX = "xlsx"
    XLS = "xls"
    CSV = "csv"


@dataclass
class ParsedTransaction:
    """
    Normalized transaction format across all file types.
    This is the standard format that all parsers should output.
    """

    date: date
    description: str
    amount: float
    transaction_type: str  # 'credit' or 'debit'
    balance: Optional[float] = None
    category: Optional[str] = None
    reference: Optional[str] = None
    raw_data: Optional[dict[str, Any]] = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "date": self.date.isoformat(),
            "description": self.description,
            "amount": self.amount,
            "transaction_type": self.transaction_type,
            "balance": self.balance,
            "category": self.category,
            "reference": self.reference,
            "raw_data": self.raw_data,
        }


@dataclass
class ParseResult:
    """Result of parsing a bank statement file."""

    success: bool
    raw_text: str  # For AI analysis
    transactions: list[ParsedTransaction] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "success": self.success,
            "raw_text": self.raw_text,
            "transactions": [t.to_dict() for t in self.transactions],
            "metadata": self.metadata,
            "error": self.error,
        }


class BaseParser(ABC):
    """
    Abstract base class for all file parsers.
    Each parser implements extraction logic for a specific file format.
    """

    @abstractmethod
    async def parse(
        self, file_content: bytes, filename: str, max_chars: int = 50000
    ) -> ParseResult:
        """
        Parse the file content and extract text and transactions.

        Args:
            file_content: Raw bytes of the file
            filename: Original filename (used for format detection)
            max_chars: Maximum characters to extract

        Returns:
            ParseResult with extracted data
        """
        pass

    def detect_bank(self, content: str) -> Optional[str]:
        """
        Detect the bank name from the content.
        Can be overridden by specific parsers for better detection.

        Args:
            content: Extracted text content

        Returns:
            Bank name if detected, None otherwise
        """
        # Common Mongolian banks
        banks = {
            "хаан банк": "Хаан Банк",
            "khan bank": "Хаан Банк",
            "голомт банк": "Голомт Банк",
            "golomt bank": "Голомт Банк",
            "худалдаа хөгжлийн банк": "Худалдаа Хөгжлийн Банк",
            "trade and development bank": "Худалдаа Хөгжлийн Банк",
            "tdb": "Худалдаа Хөгжлийн Банк",
            "төрийн банк": "Төрийн Банк",
            "state bank": "Төрийн Банк",
            "хас банк": "Хас Банк",
            "xac bank": "Хас Банк",
            "капитрон банк": "Капитрон Банк",
            "capitron bank": "Капитрон Банк",
            "богд банк": "Богд Банк",
            "bogd bank": "Богд Банк",
            "үндэсний хөрөнгө оруулалтын банк": "Үндэсний Хөрөнгө Оруулалтын Банк",
            "national investment bank": "Үндэсний Хөрөнгө Оруулалтын Банк",
            "чингис хаан банк": "Чингис Хаан Банк",
            "chinggis khaan bank": "Чингис Хаан Банк",
            "транс банк": "Транс Банк",
            "trans bank": "Транс Банк",
            "ариг банк": "Ариг Банк",
            "arig bank": "Ариг Банк",
            "кредит банк": "Кредит Банк",
            "credit bank": "Кредит Банк",
        }

        content_lower = content.lower()
        for pattern, bank_name in banks.items():
            if pattern in content_lower:
                return bank_name

        return None
