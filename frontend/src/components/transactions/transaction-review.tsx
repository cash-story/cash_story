"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TransactionList } from "./transaction-list";
import type { Transaction, CategoryList } from "@/types";
import {
  fetchCategories,
  fetchTransactions,
  fetchStatementText,
  updateTransaction,
  deleteTransaction as deleteTransactionApi,
  bulkUpdateTransactions,
  bulkCreateTransactions,
} from "@/lib/api/transactions";
import { parseTransactions } from "@/actions/parse-transactions";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";

interface TransactionReviewProps {
  statementId: string;
  reportGroupId: string;
  onComplete?: () => void;
}

export function TransactionReview({
  statementId,
  reportGroupId,
  onComplete,
}: TransactionReviewProps) {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<CategoryList>({
    income: [],
    expense: [],
  });
  const [statementText, setStatementText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasParsed, setHasParsed] = useState(false);

  // Load categories, transactions, and statement text
  useEffect(() => {
    if (!accessToken) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const [cats, txnData, stmtData] = await Promise.all([
          fetchCategories(accessToken),
          fetchTransactions(accessToken, statementId),
          fetchStatementText(accessToken, reportGroupId, statementId),
        ]);
        setCategories(cats);
        setTransactions(txnData.transactions);
        setStatementText(stmtData.encrypted_text);
        setHasParsed(txnData.transactions.length > 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Алдаа гарлаа");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [accessToken, statementId, reportGroupId]);

  // Parse transactions from statement text
  const handleParse = async () => {
    if (!statementText || !accessToken) return;

    console.log(
      "[TransactionReview] Statement text length:",
      statementText.length,
    );
    console.log(
      "[TransactionReview] First 500 chars:",
      statementText.substring(0, 500),
    );
    console.log(
      "[TransactionReview] Last 500 chars:",
      statementText.substring(statementText.length - 500),
    );

    setIsParsing(true);
    setError(null);

    try {
      // Parse with AI
      const result = await parseTransactions(statementText, categories);
      if (!result.success) {
        throw new Error(result.error);
      }

      const parsed = result.transactions || [];
      if (parsed.length === 0) {
        setError("Гүйлгээ олдсонгүй. Хуулгын формат буруу байж магадгүй.");
        return;
      }

      // Save to database
      const toCreate = parsed.map((p) => ({
        date: p.date,
        description: p.description,
        amount: p.amount,
        type: p.type,
        ai_suggested_category_id: p.suggested_category_id,
      }));

      await bulkCreateTransactions(accessToken, statementId, toCreate);

      // Reload transactions
      const txnData = await fetchTransactions(accessToken, statementId);
      setTransactions(txnData.transactions);
      setHasParsed(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Гүйлгээ задлахад алдаа гарлаа",
      );
    } finally {
      setIsParsing(false);
    }
  };

  // Update single transaction
  const handleUpdateTransaction = async (id: string, categoryId: string) => {
    if (!accessToken) return;

    try {
      const updated = await updateTransaction(accessToken, id, {
        category_id: categoryId || undefined,
      });
      setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  };

  // Bulk update
  const handleBulkUpdate = async (ids: string[], categoryId: string) => {
    if (!accessToken) return;

    try {
      await bulkUpdateTransactions(accessToken, ids, categoryId);
      const txnData = await fetchTransactions(accessToken, statementId);
      setTransactions(txnData.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  };

  // Delete transaction
  const handleDelete = async (id: string) => {
    if (!accessToken) return;

    try {
      await deleteTransactionApi(accessToken, id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  };

  const categorizedCount = transactions.filter((t) => t.is_categorized).length;
  const allCategorized =
    transactions.length > 0 && categorizedCount === transactions.length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show parse button if no transactions yet
  if (!hasParsed && statementText) {
    return (
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Гүйлгээ задлах</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <p className="text-xs sm:text-sm text-muted-foreground">
            AI ашиглан банкны хуулгаас гүйлгээнүүдийг автоматаар задалж,
            категорилох боломжтой.
          </p>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs sm:text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={handleParse} disabled={isParsing} className="w-full">
            {isParsing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span className="text-sm">Задалж байна...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                <span className="text-sm">AI-гаар гүйлгээ задлах</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-xs sm:text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {transactions.length > 0 && (
        <>
          <TransactionList
            transactions={transactions}
            categories={categories}
            onUpdateTransaction={handleUpdateTransaction}
            onBulkUpdate={handleBulkUpdate}
            onDeleteTransaction={handleDelete}
            isLoading={isParsing}
          />

          {allCategorized && onComplete && (
            <div className="flex justify-end px-2">
              <Button onClick={onComplete} className="gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Үргэлжлүүлэх</span>
              </Button>
            </div>
          )}
        </>
      )}

      {transactions.length === 0 && hasParsed && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Гүйлгээ олдсонгүй
          </CardContent>
        </Card>
      )}
    </div>
  );
}
