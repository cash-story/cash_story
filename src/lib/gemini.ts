import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildAnalysisPrompt } from "./prompts";
import { financialRoadmapSchema } from "@/schemas/analysis";
import type { FinancialRoadmapResult } from "@/types";

const apiKey = process.env.GEMINI_API_KEY;

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function analyzeStatement(
  extractedText: string,
): Promise<FinancialRoadmapResult> {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY тохируулаагүй байна");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 32768,
      responseMimeType: "application/json",
    },
  });

  const prompt = buildAnalysisPrompt(extractedText);

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

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
      throw new Error("AI хариуг JSON болгон хөрвүүлж чадсангүй");
    }

    // Validate with Zod
    const validated = financialRoadmapSchema.safeParse(parsed);
    if (!validated.success) {
      console.error("Validation errors:", validated.error.issues);
      throw new Error("AI хариу буруу бүтэцтэй байна");
    }

    return validated.data as FinancialRoadmapResult;
  } catch (error) {
    if (error instanceof Error) {
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
        throw new Error("API хязгаарлалтад хүрсэн. Түр хүлээнэ үү.");
      }
      if (msg.includes("permission") || msg.includes("denied")) {
        throw new Error("API хандах эрхгүй байна. API түлхүүрээ шалгана уу.");
      }
      throw error;
    }
    throw new Error("AI боловсруулалтын алдаа гарлаа");
  }
}
