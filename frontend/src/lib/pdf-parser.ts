const PYTHON_SERVER_URL = process.env.PDF_SERVER_URL || "http://localhost:8001";

interface ExtractionResult {
  success: boolean;
  text?: string;
  error?: string;
  pages?: number;
}

/**
 * Extract text from PDF using FastAPI server (fastest method)
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Try FastAPI server first (fastest)
    return await extractWithFastAPI(buffer);
  } catch (error) {
    console.warn(
      "FastAPI extraction failed, falling back to pdf-parse:",
      error,
    );
    // Fallback to Node.js pdf-parse
    return await extractTextWithNodeJs(buffer);
  }
}

/**
 * Extract text using FastAPI Python server
 */
async function extractWithFastAPI(buffer: Buffer): Promise<string> {
  // Create form data with the PDF file
  const formData = new FormData();
  const uint8Array = new Uint8Array(buffer);
  const blob = new Blob([uint8Array], { type: "application/pdf" });
  formData.append("file", blob, "document.pdf");

  // Call FastAPI server
  const response = await fetch(`${PYTHON_SERVER_URL}/extract`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  const result: ExtractionResult = await response.json();

  if (!result.success) {
    throw new Error(result.error || "PDF уншихад алдаа гарлаа");
  }

  const text = result.text?.trim();
  if (!text || text.length === 0) {
    throw new Error("PDF файлаас текст олдсонгүй. Зураг PDF байж магадгүй.");
  }

  return text;
}

/**
 * Fallback: Extract text using Node.js pdf-parse library
 */
async function extractTextWithNodeJs(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");

  interface PdfParseResult {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
  }

  try {
    const data: PdfParseResult = await pdfParse(buffer);
    const text = data.text?.trim();

    if (!text || text.length === 0) {
      throw new Error("PDF файлаас текст олдсонгүй. Зураг PDF байж магадгүй.");
    }

    // Truncate to avoid token limits
    const maxLength = 500000;
    if (text.length > maxLength) {
      return text.slice(0, maxLength) + "\n\n[Текст хэт урт тул товчилсон...]";
    }

    return text;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`PDF уншихад алдаа гарлаа: ${error.message}`);
    }
    throw new Error("PDF уншихад алдаа гарлаа");
  }
}
