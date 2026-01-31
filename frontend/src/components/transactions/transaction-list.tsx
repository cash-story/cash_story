"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TransactionRow } from "./transaction-row";
import { CategorySelect } from "./category-select";
import type { Transaction, Category } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface TransactionListProps {
  transactions: Transaction[];
  categories: { income: Category[]; expense: Category[] };
  onUpdateTransaction: (id: string, categoryId: string) => Promise<void>;
  onBulkUpdate: (ids: string[], categoryId: string) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function TransactionList({
  transactions,
  categories,
  onUpdateTransaction,
  onBulkUpdate,
  onDeleteTransaction,
  isLoading,
}: TransactionListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState<string>("");
  const [filter, setFilter] = useState<
    "all" | "income" | "expense" | "uncategorized"
  >("all");

  const filteredTransactions = transactions.filter((t) => {
    if (filter === "all") return true;
    if (filter === "uncategorized") return !t.is_categorized;
    return t.type === filter;
  });

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map((t) => t.id)));
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.size === 0 || !bulkCategoryId) return;
    await onBulkUpdate(Array.from(selectedIds), bulkCategoryId);
    setSelectedIds(new Set());
    setBulkCategoryId("");
  };

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const categorizedCount = transactions.filter((t) => t.is_categorized).length;
  const uncategorizedCount = transactions.filter(
    (t) => !t.is_categorized,
  ).length;

  return (
    <Card>
      <CardHeader className="pb-3 px-3 sm:px-6">
        {/* Title and progress */}
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-xl">
            Гүйлгээ ангилах
          </CardTitle>
          <div className="text-xs sm:text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
            {categorizedCount}/{transactions.length}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-green-50 dark:bg-green-950 p-2 sm:p-3 rounded-lg">
            <div className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium">
              Орлого
            </div>
            <div className="text-xs sm:text-sm font-semibold text-green-700 dark:text-green-300">
              {formatCurrency(totalIncome)}
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-950 p-2 sm:p-3 rounded-lg">
            <div className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 font-medium">
              Зарлага
            </div>
            <div className="text-xs sm:text-sm font-semibold text-red-700 dark:text-red-300">
              {formatCurrency(totalExpense)}
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950 p-2 sm:p-3 rounded-lg">
            <div className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium">
              Цэвэр
            </div>
            <div className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300">
              {formatCurrency(totalIncome - totalExpense)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-3 sm:px-6">
        {/* Filters - scrollable on mobile */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
          {(
            [
              ["all", "Бүгд"],
              ["income", "Орлого"],
              ["expense", "Зарлага"],
              ["uncategorized", "Ангилаагүй"],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(key)}
              className="text-xs whitespace-nowrap flex-shrink-0"
            >
              {label}
              {key === "uncategorized" && uncategorizedCount > 0 && (
                <span className="ml-1 bg-white/20 dark:bg-black/20 px-1.5 rounded text-[10px]">
                  {uncategorizedCount}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 mb-3 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">
              {selectedIds.size} сонгосон
            </span>
            <div className="flex flex-1 gap-2">
              <CategorySelect
                categories={categories}
                value={bulkCategoryId}
                onChange={setBulkCategoryId}
                placeholder="Категори сонгох"
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleBulkUpdate}
                disabled={!bulkCategoryId || isLoading}
              >
                Хадгалах
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds(new Set())}
              >
                Цуцлах
              </Button>
            </div>
          </div>
        )}

        {/* Transaction list */}
        <div className="space-y-2 sm:space-y-1">
          {/* Header row - desktop only */}
          <div className="hidden sm:flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground border-b">
            <input
              type="checkbox"
              checked={
                selectedIds.size === filteredTransactions.length &&
                filteredTransactions.length > 0
              }
              onChange={selectAll}
              className="w-4 h-4"
            />
            <div className="w-24">Огноо</div>
            <div className="flex-1">Тайлбар</div>
            <div className="w-32 text-right">Дүн</div>
            <div className="w-40">Категори</div>
            <div className="w-8"></div>
          </div>

          {/* Mobile: Select all row */}
          <div className="sm:hidden flex items-center gap-2 px-1 py-2 border-b">
            <input
              type="checkbox"
              checked={
                selectedIds.size === filteredTransactions.length &&
                filteredTransactions.length > 0
              }
              onChange={selectAll}
              className="w-4 h-4"
            />
            <span className="text-xs text-muted-foreground">
              Бүгдийг сонгох ({filteredTransactions.length})
            </span>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Гүйлгээ олдсонгүй
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                categories={categories}
                isSelected={selectedIds.has(transaction.id)}
                onToggleSelect={() => toggleSelect(transaction.id)}
                onUpdateCategory={(categoryId) =>
                  onUpdateTransaction(transaction.id, categoryId)
                }
                onDelete={() => onDeleteTransaction(transaction.id)}
                isLoading={isLoading}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
