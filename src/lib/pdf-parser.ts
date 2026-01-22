// pdf-parse v1.1.1 uses CommonJS default export
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

interface PdfParseResult {
  text: string;
  numpages: number;
  info: Record<string, unknown>;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data: PdfParseResult = await pdfParse(buffer);
    const text = data.text?.trim();

    if (!text || text.length === 0) {
      throw new Error("PDF файлаас текст олдсонгүй. Зураг PDF байж магадгүй.");
    }

    // Truncate to avoid token limits (roughly 50k chars)
    const maxLength = 50000;
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
