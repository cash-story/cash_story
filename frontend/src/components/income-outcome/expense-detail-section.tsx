"use client";

import type { ExpenseAnalysis, ReportOverview } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingDown,
  CircleDollarSign,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { ExpensePieChart } from "@/components/charts";

interface ExpenseDetailSectionProps {
  expense: ExpenseAnalysis;
  overview: ReportOverview;
}

function formatCurrency(value: number, currency: string): string {
  return (
    new Intl.NumberFormat("mn-MN", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(value) + (currency === "MNT" ? "₮" : ` ${currency}`)
  );
}

function getTrendIcon(trend: string) {
  switch (trend) {
    case "Өсөж байна":
      return <ArrowUp className="w-4 h-4 text-red-500" />;
    case "Буурч байна":
      return <ArrowDown className="w-4 h-4 text-green-500" />;
    default:
      return <Minus className="w-4 h-4 text-gray-500" />;
  }
}

export function ExpenseDetailSection({
  expense,
  overview,
}: ExpenseDetailSectionProps) {
  const currency = overview.currency;
  const fixedPercentage =
    (expense.fixedExpenses / expense.totalExpense) * 100 || 0;
  const variablePercentage =
    (expense.variableExpenses / expense.totalExpense) * 100 || 0;

  const ratioColor =
    expense.expenseToIncomeRatio < 70
      ? "text-green-600"
      : expense.expenseToIncomeRatio < 90
        ? "text-amber-600"
        : "text-red-600";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Warnings */}
      {expense.warnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
              {expense.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 sm:pt-6">
            <div className="flex items-center gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-red-50 text-red-600">
                <CircleDollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Нийт зарлага
                </p>
                <p className="text-lg sm:text-xl font-bold truncate">
                  {formatCurrency(expense.totalExpense, currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:pt-6">
            <div className="flex items-center gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-blue-50 text-blue-600">
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Сарын дундаж
                </p>
                <p className="text-lg sm:text-xl font-bold truncate">
                  {formatCurrency(expense.monthlyAverage, currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:pt-6">
            <div className="flex items-center gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-amber-50 text-amber-600">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Зарлага/Орлого
                </p>
                <p className={`text-lg sm:text-xl font-bold ${ratioColor}`}>
                  {expense.expenseToIncomeRatio.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed vs Variable */}
      <Card>
        <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">
            Тогтмол vs Хувьсах зардал
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Тогтмол зардал</span>
                <span className="font-medium">
                  {formatCurrency(expense.fixedExpenses, currency)} (
                  {fixedPercentage.toFixed(1)}%)
                </span>
              </div>
              <Progress value={fixedPercentage} className="h-3 bg-gray-100" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Хувьсах зардал</span>
                <span className="font-medium">
                  {formatCurrency(expense.variableExpenses, currency)} (
                  {variablePercentage.toFixed(1)}%)
                </span>
              </div>
              <Progress
                value={variablePercentage}
                className="h-3 bg-gray-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Chart and Table */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Ангилалаар</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0">
            <ExpensePieChart
              categories={expense.topCategories}
              currency={currency}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">
              Топ зарлагууд
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="space-y-2 sm:space-y-3">
              {expense.topCategories.map((category, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b last:border-0 gap-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-medium">
                      {category.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(category.trend)}
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        {category.trend}
                      </span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-sm sm:text-base font-semibold">
                      {formatCurrency(category.amount, currency)}
                    </span>
                    <Badge
                      variant="outline"
                      className="ml-2 text-[10px] sm:text-xs"
                    >
                      {category.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {expense.insights.length > 0 && (
        <Card>
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Дүгнэлт</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <ul className="space-y-2">
              {expense.insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2">
                  <TrendingDown className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
