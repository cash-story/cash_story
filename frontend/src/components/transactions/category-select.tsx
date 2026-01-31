"use client";

import type { Category } from "@/types";
import { cn } from "@/lib/utils";

interface CategorySelectProps {
  categories: { income: Category[]; expense: Category[] };
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showOnlyType?: "income" | "expense";
  className?: string;
}

export function CategorySelect({
  categories,
  value,
  onChange,
  placeholder = "Категори сонгох",
  disabled = false,
  showOnlyType,
  className,
}: CategorySelectProps) {
  const incomeCategories = showOnlyType !== "expense" ? categories.income : [];
  const expenseCategories = showOnlyType !== "income" ? categories.expense : [];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "w-full px-3 py-2.5 sm:py-1.5 text-sm border rounded-lg bg-background",
        "focus:outline-none focus:ring-2 focus:ring-ring",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "min-h-[44px] sm:min-h-[32px]",
        !value && "text-muted-foreground",
        className,
      )}
    >
      <option value="">{placeholder}</option>

      {incomeCategories.length > 0 && (
        <optgroup label="Орлого">
          {incomeCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </optgroup>
      )}

      {expenseCategories.length > 0 && (
        <optgroup label="Зарлага">
          {expenseCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}
