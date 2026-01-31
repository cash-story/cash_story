/**
 * API functions for transactions and categories
 */

import type {
  Category,
  CategoryList,
  Transaction,
  TransactionListResponse,
} from "@/types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";

// --- Statement Text ---

export interface StatementWithText {
  id: string;
  file_name: string;
  bank_name: string | null;
  encrypted_text: string | null;
  status: string;
}

export async function fetchStatementText(
  accessToken: string,
  reportGroupId: string,
  statementId: string,
): Promise<StatementWithText> {
  const response = await fetch(
    `${BACKEND_URL}/report-groups/${reportGroupId}/statements/${statementId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Хуулга татахад алдаа гарлаа");
  }

  return response.json();
}

// --- Categories ---

export async function fetchCategories(
  accessToken: string,
): Promise<CategoryList> {
  const response = await fetch(`${BACKEND_URL}/categories`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Категориуд татахад алдаа гарлаа");
  }

  return response.json();
}

// --- Transactions ---

export async function fetchTransactions(
  accessToken: string,
  statementId: string,
): Promise<TransactionListResponse> {
  const response = await fetch(
    `${BACKEND_URL}/statements/${statementId}/transactions`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Гүйлгээнүүд татахад алдаа гарлаа");
  }

  return response.json();
}

export async function createTransaction(
  accessToken: string,
  statementId: string,
  data: {
    date: string;
    description: string;
    amount: number;
    type: "income" | "expense";
    category_id?: string;
  },
): Promise<Transaction> {
  const response = await fetch(
    `${BACKEND_URL}/statements/${statementId}/transactions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error("Гүйлгээ нэмэхэд алдаа гарлаа");
  }

  return response.json();
}

export async function updateTransaction(
  accessToken: string,
  transactionId: string,
  data: {
    date?: string;
    description?: string;
    amount?: number;
    type?: "income" | "expense";
    category_id?: string;
    is_categorized?: boolean;
  },
): Promise<Transaction> {
  const response = await fetch(`${BACKEND_URL}/transactions/${transactionId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Гүйлгээ шинэчлэхэд алдаа гарлаа");
  }

  return response.json();
}

export async function deleteTransaction(
  accessToken: string,
  transactionId: string,
): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/transactions/${transactionId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Гүйлгээ устгахад алдаа гарлаа");
  }
}

export async function bulkUpdateTransactions(
  accessToken: string,
  transactionIds: string[],
  categoryId: string,
): Promise<{ updated: number }> {
  const response = await fetch(`${BACKEND_URL}/transactions/bulk-update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      transaction_ids: transactionIds,
      category_id: categoryId,
    }),
  });

  if (!response.ok) {
    throw new Error("Гүйлгээнүүд шинэчлэхэд алдаа гарлаа");
  }

  return response.json();
}

export async function bulkCreateTransactions(
  accessToken: string,
  statementId: string,
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    type: "income" | "expense";
    ai_suggested_category_id?: string;
  }>,
): Promise<{ created: number; ids: string[] }> {
  const response = await fetch(
    `${BACKEND_URL}/statements/${statementId}/transactions/bulk`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ transactions }),
    },
  );

  if (!response.ok) {
    throw new Error("Гүйлгээнүүд хадгалахад алдаа гарлаа");
  }

  return response.json();
}
