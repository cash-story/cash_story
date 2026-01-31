import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  buildPart1Prompt,
  buildPart2Prompt,
  buildPart3Prompt,
  buildTransactionParsePrompt,
} from "./prompts";
import { financialGuideReportSchema } from "@/schemas/analysis";
import type { FinancialGuideReport, ParsedTransaction } from "@/types";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Helper to make a single Gemini request
async function makeGeminiRequest(
  prompt: string,
  partName: string,
): Promise<unknown> {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY тохируулаагүй байна");
  }

  // Use gemini-2.5-flash for good balance of speed and capability
  const modelName = "gemini-2.5-flash";
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 65536,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(prompt);
  const response = result.response;

  const finishReason = response.candidates?.[0]?.finishReason;

  if (finishReason === "MAX_TOKENS") {
    throw new Error(`${partName}: AI хариу хэт урт байна`);
  }

  const text = response.text();

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
    // Part 1: Core financial data
    const part1Prompt = buildPart1Prompt(extractedText);
    const part1Result = (await makeGeminiRequest(
      part1Prompt,
      "Part1",
    )) as Record<string, unknown>;

    // Part 2: Behavior, risks, recommendations (needs Part 1 context)
    const part2Prompt = buildPart2Prompt(
      extractedText,
      JSON.stringify(part1Result),
    );
    const part2Result = (await makeGeminiRequest(
      part2Prompt,
      "Part2",
    )) as Record<string, unknown>;

    // Part 3: Milestones, projections, strategy, verdict (needs Part 1 & 2 context)
    const part3Prompt = buildPart3Prompt(
      JSON.stringify(part1Result),
      JSON.stringify(part2Result),
    );
    const part3Result = (await makeGeminiRequest(
      part3Prompt,
      "Part3",
    )) as Record<string, unknown>;

    // Combine all parts
    const combined: Record<string, unknown> = {
      ...part1Result,
      ...part2Result,
      ...part3Result,
    };

    // Validate with Zod
    const validated = financialGuideReportSchema.safeParse(combined);
    if (!validated.success) {
      throw new Error(
        "AI хариу буруу бүтэцтэй байна: " +
          validated.error.issues
            .map((i) => i.path.join(".") + ": " + i.message)
            .join(", "),
      );
    }

    return validated.data as FinancialGuideReport;
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

export async function parseTransactionsFromText(
  extractedText: string,
  categories: {
    income: { id: string; name: string }[];
    expense: { id: string; name: string }[];
  },
): Promise<ParsedTransaction[]> {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY тохируулаагүй байна");
  }

  try {
    const prompt = buildTransactionParsePrompt(extractedText, categories);
    const result = (await makeGeminiRequest(prompt, "TransactionParse")) as {
      transactions: ParsedTransaction[];
    };

    return result.transactions || [];
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Гүйлгээ задлахад алдаа гарлаа");
  }
}
