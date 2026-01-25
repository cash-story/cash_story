"use server";

import { uploadSchema } from "@/schemas/upload";
import { extractTextFromPdf } from "@/lib/pdf-parser";
import { analyzeStatement } from "@/lib/gemini";
import type { ActionState } from "@/types";

export async function analyzePdf(formData: FormData): Promise<ActionState> {
  try {
    // Extract file from FormData
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return {
        success: false,
        error: "Файл олдсонгүй",
      };
    }

    // Validate file with Zod
    const validation = uploadSchema.safeParse({ file });
    if (!validation.success) {
      const issues = validation.error.issues;
      const errorMessage = issues[0]?.message || "Файлын алдаа";
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    let extractedText: string;
    try {
      extractedText = await extractTextFromPdf(buffer);
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "PDF уншихад алдаа гарлаа",
      };
    }

    // Check if we got meaningful text
    if (extractedText.length < 50) {
      return {
        success: false,
        error:
          "PDF файлаас хангалттай текст олдсонгүй. Зураг PDF байж магадгүй.",
      };
    }

    // Analyze with Gemini
    let result;
    try {
      result = await analyzeStatement(extractedText);
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "AI боловсруулалтын алдаа гарлаа",
      };
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Unexpected error in analyzePdf:", error);
    return {
      success: false,
      error: "Алдаа гарлаа. Дахин оролдоно уу.",
    };
  }
}
