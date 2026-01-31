"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import type { Transaction, CategoryList, ParsedTransaction } from "@/types";
import {
  fetchCategories,
  fetchTransactions,
  updateTransaction,
  deleteTransaction,
  bulkUpdateTransactions,
  bulkCreateTransactions,
} from "@/lib/api/transactions";
import { parseTransactions } from "@/actions/parse-transactions";

interface UseTransactionsOptions {
  statementId?: string;
  statementText?: string;
}

export function useTransactions({ statementId, statementText }: UseTransactionsOptions) {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<CategoryList>({ income: [], expense: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories
  const loadCategories = useCallback(async () => {
    if (!accessToken) return;

    try {
      const cats = await fetchCategories(accessToken);
      setCategories(cats);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }, [accessToken]);

  // Load transactions for a statement
  const loadTransactions = useCallback(async () => {
    if (!accessToken || !statementId) return;

    setIsLoading(true);
    try {
      const data = await fetchTransactions(accessToken, statementId);
      setTransactions(data.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, statementId]);

  // Parse transactions from text using AI
  const parseFromText = useCallback(async (text: string): Promise<ParsedTransaction[]> => {
    if (!text || categories.income.length === 0) {
      return [];
    }

    setIsParsing(true);
    setError(null);

    try {
      const result = await parseTransactions(text, categories);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.transactions || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : "Гүйлгээ задлахад алдаа гарлаа");
      return [];
    } finally {
      setIsParsing(false);
    }
  }, [categories]);

  // Save parsed transactions to database
  const saveParsedTransactions = useCallback(async (
    parsed: ParsedTransaction[]
  ): Promise<boolean> => {
    if (!accessToken || !statementId || parsed.length === 0) return false;

    setIsLoading(true);
    try {
      const toCreate = parsed.map((p) => ({
        date: p.date,
        description: p.description,
        amount: p.amount,
        type: p.type,
        ai_suggested_category_id: p.suggested_category_id,
      }));

      await bulkCreateTransactions(accessToken, statementId, toCreate);
      await loadTransactions();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, statementId, loadTransactions]);

  // Update single transaction
  const handleUpdateTransaction = useCallback(async (
    transactionId: string,
    categoryId: string
  ) => {
    if (!accessToken) return;

    try {
      const updated = await updateTransaction(accessToken, transactionId, {
        category_id: categoryId || undefined,
      });
      setTransactions((prev) =>
        prev.map((t) => (t.id === transactionId ? updated : t))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  }, [accessToken]);

  // Bulk update transactions
  const handleBulkUpdate = useCallback(async (
    transactionIds: string[],
    categoryId: string
  ) => {
    if (!accessToken || transactionIds.length === 0) return;

    try {
      await bulkUpdateTransactions(accessToken, transactionIds, categoryId);
      // Refresh to get updated data
      await loadTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  }, [accessToken, loadTransactions]);

  // Delete transaction
  const handleDeleteTransaction = useCallback(async (transactionId: string) => {
    if (!accessToken) return;

    try {
      await deleteTransaction(accessToken, transactionId);
      setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  }, [accessToken]);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Load transactions when statementId changes
  useEffect(() => {
    if (statementId) {
      loadTransactions();
    }
  }, [statementId, loadTransactions]);

  return {
    transactions,
    categories,
    isLoading,
    isParsing,
    error,
    parseFromText,
    saveParsedTransactions,
    handleUpdateTransaction,
    handleBulkUpdate,
    handleDeleteTransaction,
    refreshTransactions: loadTransactions,
    clearError: () => setError(null),
  };
}
