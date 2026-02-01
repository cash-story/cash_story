"use server";

import { parseTransactionsFromText } from "@/lib/gemini";
import type { ParsedTransaction, CategoryList } from "@/types";

interface ParseTransactionsResult {
  success: boolean;
  transactions?: ParsedTransaction[];
  error?: string;
}

export async function parseTransactions(
  text: string,
  categories: CategoryList,
): Promise<ParseTransactionsResult> {
  try {
    if (!text || text.length < 50) {
      return {
        success: false,
        error: "Хангалттай текст олдсонгүй",
      };
    }

    // Log first 500 chars for debugging
    console.log(
      "[parseTransactions] Text preview:",
      text.substring(0, 500),
      "...",
    );
    console.log("[parseTransactions] Text length:", text.length);

    // Simplify categories for prompt
    const simplifiedCategories = {
      income: categories.income.map((c) => ({ id: c.id, name: c.name })),
      expense: categories.expense.map((c) => ({ id: c.id, name: c.name })),
    };

    const transactions = await parseTransactionsFromText(
      text,
      simplifiedCategories,
    );

    console.log(
      "[parseTransactions] Parsed transactions count:",
      transactions.length,
    );

    return {
      success: true,
      transactions,
    };
  } catch (error) {
    console.error("Error in parseTransactions:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Гүйлгээ задлахад алдаа гарлаа",
    };
  }
}
