"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { TrendingDown, PieChart, AlertTriangle, Lightbulb, ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { ExpenseAnalysis } from "@/types";

interface ExpenseAnalysisCardProps {
  expense: ExpenseAnalysis;
  currency?: string;
}

function formatCurrency(amount: number, currency: string = "MNT"): string {
  return new Intl.NumberFormat("mn-MN", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(amount) + (currency === "MNT" ? "₮" : ` ${currency}`);
}

const trendIcons = {
  "Өсөж байна": ArrowUp,
  "Буурч байна": ArrowDown,
  "Тогтвортой": Minus,
};

const trendColors = {
  "Өсөж байна": "text-red-500",
  "Буурч байна": "text-green-500",
  "Тогтвортой": "text-gray-500",
};

export function ExpenseAnalysisCard({ expense, currency = "MNT" }: ExpenseAnalysisCardProps) {
  const ratioColor = expense.expenseToIncomeRatio > 80
    ? "text-red-600 bg-red-100"
    : expense.expenseToIncomeRatio > 60
    ? "text-yellow-600 bg-yellow-100"
    : "text-green-600 bg-green-100";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingDown className="w-5 h-5 text-red-600" />
          Зардлын шинжилгээ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-muted-foreground">Нийт зардал</p>
            <p className="text-lg font-bold text-red-700">
              {formatCurrency(expense.totalExpense, currency)}
            </p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <p className="text-xs text-muted-foreground">Сарын дундаж</p>
            <p className="text-lg font-bold text-orange-700">
              {formatCurrency(expense.monthlyAverage, currency)}
            </p>
          </div>
        </div>

        {/* Expense to Income Ratio */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Зардал/Орлого харьцаа</span>
            <span className={cn("text-xs px-2 py-1 rounded-full font-medium", ratioColor)}>
              {expense.expenseToIncomeRatio.toFixed(1)}%
            </span>
          </div>
          <div className="space-y-1">
            <Progress
              value={Math.min(expense.expenseToIncomeRatio, 100)}
              className={cn("h-2", expense.expenseToIncomeRatio > 80 && "[&>div]:bg-red-500")}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className="text-yellow-600">60%</span>
              <span className="text-red-600">80%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Fixed vs Variable */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-2 border rounded-lg">
            <p className="text-xs text-muted-foreground">Тогтмол зардал</p>
            <p className="font-semibold">{formatCurrency(expense.fixedExpenses, currency)}</p>
          </div>
          <div className="p-2 border rounded-lg">
            <p className="text-xs text-muted-foreground">Хувьсах зардал</p>
            <p className="font-semibold">{formatCurrency(expense.variableExpenses, currency)}</p>
          </div>
        </div>

        {/* Top categories */}
        {expense.topCategories.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <PieChart className="w-4 h-4" />
              Топ зардлын ангилалууд
            </div>
            <div className="space-y-2">
              {expense.topCategories.slice(0, 5).map((category, idx) => {
                const TrendIcon = trendIcons[category.trend];
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{category.name}</span>
                        <TrendIcon className={cn("w-3 h-3", trendColors[category.trend])} />
                      </div>
                      <span className="font-medium">{category.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={category.percentage} className="h-1.5 flex-1 [&>div]:bg-red-400" />
                      <span className="text-xs text-muted-foreground w-24 text-right">
                        {formatCurrency(category.amount, currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Warnings */}
        {expense.warnings.length > 0 && (
          <div className="space-y-2">
            {expense.warnings.map((warning, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-800">{warning}</p>
              </div>
            ))}
          </div>
        )}

        {/* Insights */}
        {expense.insights.length > 0 && (
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Ойлголт
            </div>
            <ul className="space-y-1">
              {expense.insights.map((insight, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
