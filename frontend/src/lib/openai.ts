import OpenAI from "openai";
import {
  buildPart1Prompt,
  buildPart2Prompt,
  buildPart3Prompt,
  buildTransactionParsePrompt,
} from "./prompts";
import { financialGuideReportSchema } from "@/schemas/analysis";
import type { FinancialGuideReport, ParsedTransaction } from "@/types";

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

// Helper to make a single OpenAI request
async function makeOpenAIRequest(
  prompt: string,
  partName: string,
): Promise<unknown> {
  if (!openai) {
    throw new Error("OPENAI_API_KEY тохируулаагүй байна");
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a financial analyst. Always respond with valid JSON only, no markdown formatting.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.1,
    max_tokens: 16000,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content;

  if (!text) {
    throw new Error(`${partName}: AI хариу хоосон байна`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${partName}: JSON хөрвүүлэлт амжилтгүй`);
  }
}

export async function analyzeStatement(
  extractedText: string,
): Promise<FinancialGuideReport> {
  if (!openai) {
    throw new Error("OPENAI_API_KEY тохируулаагүй байна");
  }

  try {
    // Part 1: Core financial data
    const part1Prompt = buildPart1Prompt(extractedText);
    const part1Result = (await makeOpenAIRequest(
      part1Prompt,
      "Part1",
    )) as Record<string, unknown>;

    // Part 2: Behavior, risks, recommendations (needs Part 1 context)
    const part2Prompt = buildPart2Prompt(
      extractedText,
      JSON.stringify(part1Result),
    );
    const part2Result = (await makeOpenAIRequest(
      part2Prompt,
      "Part2",
    )) as Record<string, unknown>;

    // Part 3: Milestones, projections, strategy, verdict (needs Part 1 & 2 context)
    const part3Prompt = buildPart3Prompt(
      JSON.stringify(part1Result),
      JSON.stringify(part2Result),
    );
    const part3Result = (await makeOpenAIRequest(
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
        msg.includes("invalid key") ||
        msg.includes("invalid_api_key")
      ) {
        throw new Error("API түлхүүрийн алдаа. Түлхүүрээ шалгана уу.");
      }
      if (
        msg.includes("quota") ||
        msg.includes("rate") ||
        msg.includes("rate_limit")
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
  if (!openai) {
    throw new Error("OPENAI_API_KEY тохируулаагүй байна");
  }

  try {
    const prompt = buildTransactionParsePrompt(extractedText, categories);
    const result = (await makeOpenAIRequest(prompt, "TransactionParse")) as {
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
