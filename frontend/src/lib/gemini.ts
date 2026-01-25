import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildAnalysisPrompt } from "./prompts";
import { financialGuideReportSchema } from "@/schemas/analysis";
import type { FinancialGuideReport } from "@/types";

const apiKey = process.env.GEMINI_API_KEY;

console.log("[Gemini] API Key exists:", !!apiKey);
console.log("[Gemini] API Key length:", apiKey?.length || 0);
console.log("[Gemini] API Key prefix:", apiKey?.substring(0, 10) + "...");

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function analyzeStatement(
  extractedText: string,
): Promise<FinancialGuideReport> {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY тохируулаагүй байна");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 65536,
      responseMimeType: "application/json",
    },
  });

  const prompt = buildAnalysisPrompt(extractedText);

  try {
    console.log("[Gemini] Sending request to model:", "gemini-2.0-flash");
    console.log("[Gemini] Prompt length:", prompt.length);

    const result = await model.generateContent(prompt);
    console.log("[Gemini] Got result");

    const response = result.response;
    console.log("[Gemini] Response candidates:", response.candidates?.length);

    const text = response.text();
    console.log("[Gemini] Response text length:", text.length);

    // Parse JSON response
    let parsed: unknown;
    try {
      // Clean the response if it has markdown code blocks
      let cleanedText = text.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.slice(7);
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.slice(0, -3);
      }
      cleanedText = cleanedText.trim();

      parsed = JSON.parse(cleanedText);
    } catch {
      console.error("Failed to parse JSON:", text.substring(0, 500));
      throw new Error("AI хариуг JSON болгон хөрвүүлж чадсангүй");
    }

    // Validate with Zod
    const validated = financialGuideReportSchema.safeParse(parsed);
    if (!validated.success) {
      console.error("Validation errors:", validated.error.issues);
      console.error(
        "Received data:",
        JSON.stringify(parsed, null, 2).substring(0, 1000),
      );
      throw new Error(
        "AI хариу буруу бүтэцтэй байна: " +
          validated.error.issues
            .map((i) => i.path.join(".") + ": " + i.message)
            .join(", "),
      );
    }

    return validated.data as FinancialGuideReport;
  } catch (error) {
    console.error("[Gemini] ERROR:", error);
    console.error("[Gemini] Error type:", typeof error);
    console.error("[Gemini] Error constructor:", error?.constructor?.name);

    if (error instanceof Error) {
      console.error("[Gemini] Error message:", error.message);
      console.error("[Gemini] Error stack:", error.stack);

      const msg = error.message.toLowerCase();

      if (
        msg.includes("api_key") ||
        msg.includes("api key") ||
        msg.includes("invalid key")
      ) {
        throw new Error("API түлхүүрийн алдаа. Түлхүүрээ шалгана уу.");
      }
      if (
        msg.includes("quota") ||
        msg.includes("rate") ||
        msg.includes("resource_exhausted")
      ) {
        throw new Error(
          "API хязгаарлалтад хүрсэн. Түр хүлээнэ үү. (Original: " +
            error.message +
            ")",
        );
      }
      if (msg.includes("permission") || msg.includes("denied")) {
        throw new Error("API хандах эрхгүй байна. API түлхүүрээ шалгана уу.");
      }
      throw error;
    }
    throw new Error("AI боловсруулалтын алдаа гарлаа");
  }
}
