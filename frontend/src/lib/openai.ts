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
        content:
          "You are a financial analyst. Always respond with valid JSON only, no markdown formatting.",
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
    console.error("[OpenAI] Error:", error);

    if (error instanceof Error) {
      const msg = error.message.toLowerCase();

      if (
        msg.includes("api_key") ||
        msg.includes("api key") ||
        msg.includes("invalid key") ||
        msg.includes("invalid_api_key") ||
        msg.includes("incorrect api key")
      ) {
        throw new Error("API түлхүүрийн алдаа. Түлхүүрээ шалгана уу.");
      }
      if (
        msg.includes("quota") ||
        msg.includes("rate_limit") ||
        msg.includes("rate limit") ||
        msg.includes("too many requests")
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

// Split text into chunks by lines, trying to keep ~10000 chars per chunk
function splitTextIntoChunks(
  text: string,
  maxCharsPerChunk: number = 10000,
): string[] {
  const lines = text.split("\n");
  const chunks: string[] = [];
  let currentChunk = "";

  for (const line of lines) {
    if (
      currentChunk.length + line.length + 1 > maxCharsPerChunk &&
      currentChunk.length > 0
    ) {
      chunks.push(currentChunk);
      currentChunk = line;
    } else {
      currentChunk += (currentChunk ? "\n" : "") + line;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
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
    // Split large text into chunks to avoid token limits
    const chunks = splitTextIntoChunks(extractedText, 10000);
    console.log(
      `[OpenAI] Parsing ${chunks.length} chunks from ${extractedText.length} chars`,
    );

    const allTransactions: ParsedTransaction[] = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(
        `[OpenAI] Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`,
      );

      const prompt = buildTransactionParsePrompt(chunks[i], categories);
      const result = (await makeOpenAIRequest(
        prompt,
        `TransactionParse-${i + 1}`,
      )) as {
        transactions: ParsedTransaction[];
      };

      if (result.transactions && result.transactions.length > 0) {
        allTransactions.push(...result.transactions);
        console.log(
          `[OpenAI] Chunk ${i + 1}: found ${result.transactions.length} transactions`,
        );
      }
    }

    console.log(`[OpenAI] Total transactions found: ${allTransactions.length}`);
    return allTransactions;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Гүйлгээ задлахад алдаа гарлаа");
  }
}
