#!/usr/bin/env python3
"""
Fast PDF text extraction script using pdfplumber.
Optimized for bank statement PDFs with tabular data.
"""

import sys
import json
import pdfplumber
from pathlib import Path


def extract_text_from_pdf(pdf_path: str, max_chars: int = 50000) -> dict:
    """
    Extract text from a PDF file using pdfplumber.

    Args:
        pdf_path: Path to the PDF file
        max_chars: Maximum characters to extract (default 50000)

    Returns:
        dict with 'success', 'text' or 'error' keys
    """
    try:
        path = Path(pdf_path)
        if not path.exists():
            return {"success": False, "error": "Файл олдсонгүй"}

        if not path.suffix.lower() == '.pdf':
            return {"success": False, "error": "PDF файл биш байна"}

        text_parts = []
        total_chars = 0

        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
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
                                    cell.strip() if cell else ""
                                    for cell in row
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
            return {
                "success": False,
                "error": "PDF файлаас текст олдсонгүй. Зураг PDF байж магадгүй."
            }

        return {
            "success": True,
            "text": full_text[:max_chars],
            "pages": len(pdf.pages) if 'pdf' in dir() else 0
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"PDF уншихад алдаа гарлаа: {str(e)}"
        }


def main():
    """Main entry point for command-line usage."""
    if len(sys.argv) < 2:
        result = {"success": False, "error": "PDF файлын зам өгөөгүй"}
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(1)

    pdf_path = sys.argv[1]
    max_chars = int(sys.argv[2]) if len(sys.argv) > 2 else 50000

    result = extract_text_from_pdf(pdf_path, max_chars)
    print(json.dumps(result, ensure_ascii=False))
    sys.exit(0 if result["success"] else 1)


if __name__ == "__main__":
    main()
