"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CategorySelect } from "./category-select";
import type { Transaction, Category } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface TransactionRowProps {
  transaction: Transaction;
  categories: { income: Category[]; expense: Category[] };
  isSelected: boolean;
  onToggleSelect: () => void;
  onUpdateCategory: (categoryId: string) => Promise<void>;
  onDelete: () => Promise<void>;
  isLoading?: boolean;
}

export function TransactionRow({
  transaction,
  categories,
  isSelected,
  onToggleSelect,
  onUpdateCategory,
  onDelete,
  isLoading,
}: TransactionRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleCategoryChange = async (categoryId: string) => {
    setIsUpdating(true);
    try {
      await onUpdateCategory(categoryId);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Энэ гүйлгээг устгах уу?")) return;
    await onDelete();
  };

  const relevantCategories =
    transaction.type === "income" ? categories.income : categories.expense;

  const formattedDate = new Date(transaction.date).toLocaleDateString("mn-MN", {
    month: "short",
    day: "numeric",
  });

  return (
    <>
      {/* Desktop view - horizontal row */}
      <div
        className={cn(
          "hidden sm:flex items-center gap-2 px-2 py-2 rounded hover:bg-muted/50 transition-colors",
          isSelected && "bg-muted",
          !transaction.is_categorized &&
            "bg-yellow-50/50 dark:bg-yellow-950/20",
        )}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-4 h-4 flex-shrink-0"
        />

        {/* Date */}
        <div className="w-24 text-sm text-muted-foreground flex-shrink-0">
          {formattedDate}
        </div>

        {/* Description */}
        <div className="flex-1 min-w-0">
          <div className="text-sm truncate" title={transaction.description}>
            {transaction.description}
          </div>
          {transaction.ai_suggested_category_name &&
            !transaction.is_categorized && (
              <div className="text-[10px] text-muted-foreground">
                AI санал: {transaction.ai_suggested_category_name}
              </div>
            )}
        </div>

        {/* Amount */}
        <div
          className={cn(
            "w-32 text-right text-sm font-medium flex-shrink-0",
            transaction.type === "income"
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400",
          )}
        >
          {transaction.type === "income" ? "+" : "-"}
          {formatCurrency(transaction.amount)}
        </div>

        {/* Category Select */}
        <div className="w-40 flex-shrink-0">
          <CategorySelect
            categories={{
              income: relevantCategories,
              expense: relevantCategories,
            }}
            value={transaction.category_id || ""}
            onChange={handleCategoryChange}
            placeholder="Сонгох"
            disabled={isUpdating || isLoading}
            showOnlyType={transaction.type}
            className="text-xs"
          />
        </div>

        {/* Delete button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isLoading}
          className="w-8 h-8 p-0 text-muted-foreground hover:text-red-500 flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Mobile view - card layout */}
      <div
        className={cn(
          "sm:hidden p-3 rounded-lg border transition-colors",
          isSelected && "bg-muted border-primary",
          !transaction.is_categorized
            ? "bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
            : "bg-card",
        )}
      >
        {/* Top row: checkbox, date, amount */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="w-5 h-5"
            />
            <span className="text-xs text-muted-foreground">
              {formattedDate}
            </span>
          </div>
          <div
            className={cn(
              "text-sm font-semibold",
              transaction.type === "income"
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400",
            )}
          >
            {transaction.type === "income" ? "+" : "-"}
            {formatCurrency(transaction.amount)}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm mb-2 line-clamp-2">{transaction.description}</p>

        {/* AI suggestion */}
        {transaction.ai_suggested_category_name &&
          !transaction.is_categorized && (
            <p className="text-[10px] text-muted-foreground mb-2">
              AI санал: {transaction.ai_suggested_category_name}
            </p>
          )}

        {/* Bottom row: category select and delete */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1">
            <CategorySelect
              categories={{
                income: relevantCategories,
                expense: relevantCategories,
              }}
              value={transaction.category_id || ""}
              onChange={handleCategoryChange}
              placeholder="Категори сонгох"
              disabled={isUpdating || isLoading}
              showOnlyType={transaction.type}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading}
            className="h-11 w-11 p-0 text-muted-foreground hover:text-red-500 hover:border-red-300 flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
