import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  buildPart1Prompt,
  buildPart2Prompt,
  buildPart3Prompt,
} from "./prompts";
import { financialGuideReportSchema } from "@/schemas/analysis";
import type { FinancialGuideReport } from "@/types";

const apiKey = process.env.GEMINI_API_KEY;

console.log("[Gemini] API Key exists:", !!apiKey);
console.log("[Gemini] API Key length:", apiKey?.length || 0);
console.log("[Gemini] API Key prefix:", apiKey?.substring(0, 10) + "...");

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Helper to make a single Gemini request
async function makeGeminiRequest(
  prompt: string,
  partName: string,
): Promise<unknown> {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY тохируулаагүй байна");
  }

  // Use gemini-1.5-pro for higher output token limit
  const modelName = "gemini-1.5-pro";
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 16384,
      responseMimeType: "application/json",
    },
  });

  console.log(
    `[Gemini ${partName}] Sending request, prompt length:`,
    prompt.length,
  );

  const result = await model.generateContent(prompt);
  const response = result.response;

  const finishReason = response.candidates?.[0]?.finishReason;
  console.log(`[Gemini ${partName}] Finish reason:`, finishReason);

  if (finishReason === "MAX_TOKENS") {
    throw new Error(`${partName}: AI хариу хэт урт байна`);
  }

  const text = response.text();
  console.log(`[Gemini ${partName}] Response length:`, text.length);

  // Parse JSON
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

  try {
    return JSON.parse(cleanedText);
  } catch {
    console.error(
      `[Gemini ${partName}] Failed to parse JSON:`,
      cleanedText.substring(0, 300),
    );
    throw new Error(`${partName}: JSON хөрвүүлэлт амжилтгүй`);
  }
}

export async function analyzeStatement(
  extractedText: string,
): Promise<FinancialGuideReport> {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY тохируулаагүй байна");
  }

  try {
    console.log("[Gemini] Starting chunked analysis...");

    // Part 1: Core financial data
    const part1Prompt = buildPart1Prompt(extractedText);
    const part1Result = (await makeGeminiRequest(
      part1Prompt,
      "Part1",
    )) as Record<string, unknown>;
    console.log("[Gemini] Part 1 complete");

    // Part 2: Behavior, risks, recommendations (needs Part 1 context)
    const part2Prompt = buildPart2Prompt(
      extractedText,
      JSON.stringify(part1Result),
    );
    const part2Result = (await makeGeminiRequest(
      part2Prompt,
      "Part2",
    )) as Record<string, unknown>;
    console.log("[Gemini] Part 2 complete");

    // Part 3: Milestones, projections, strategy, verdict (needs Part 1 & 2 context)
    const part3Prompt = buildPart3Prompt(
      JSON.stringify(part1Result),
      JSON.stringify(part2Result),
    );
    const part3Result = (await makeGeminiRequest(
      part3Prompt,
      "Part3",
    )) as Record<string, unknown>;
    console.log("[Gemini] Part 3 complete");

    // Combine all parts
    const combined: Record<string, unknown> = {
      ...part1Result,
      ...part2Result,
      ...part3Result,
    };

    console.log("[Gemini] Combined result keys:", Object.keys(combined));

    // Validate with Zod
    const validated = financialGuideReportSchema.safeParse(combined);
    if (!validated.success) {
      console.error("Validation errors:", validated.error.issues);
      console.error(
        "Received data:",
        JSON.stringify(combined, null, 2).substring(0, 1000),
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

    if (error instanceof Error) {
      console.error("[Gemini] Error message:", error.message);

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
