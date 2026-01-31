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
  categories: CategoryList
): Promise<ParseTransactionsResult> {
  try {
    if (!text || text.length < 50) {
      return {
        success: false,
        error: "Хангалттай текст олдсонгүй",
      };
    }

    // Simplify categories for prompt
    const simplifiedCategories = {
      income: categories.income.map((c) => ({ id: c.id, name: c.name })),
      expense: categories.expense.map((c) => ({ id: c.id, name: c.name })),
    };

    const transactions = await parseTransactionsFromText(
      text,
      simplifiedCategories
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
