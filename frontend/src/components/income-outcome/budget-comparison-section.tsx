"use client";

import type { FinancialGuideReport } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  TrendingUp,
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface BudgetComparisonSectionProps {
  report: FinancialGuideReport;
}

function formatCurrency(value: number, currency: string): string {
  return (
    new Intl.NumberFormat("mn-MN", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(value) + (currency === "MNT" ? "₮" : ` ${currency}`)
  );
}

export function BudgetComparisonSection({
  report,
}: BudgetComparisonSectionProps) {
  const { income, expense, cashflow, overview } = report;
  const currency = overview.currency;

  // Derive suggested budgets from actual spending
  const suggestedMonthlyExpense = expense.monthlyAverage;
  const suggestedMonthlySavings = income.monthlyAverage * 0.2; // 20% rule
  const actualMonthlySavings = cashflow.monthlyAverage;

  // Calculate category budgets based on average spending
  const categoryBudgets = expense.topCategories.map((cat) => {
    const monthlyActual = cat.amount / overview.totalMonths;
    // Suggest 10% reduction for "Өсөж байна" trend, 5% increase for savings
    const multiplier =
      cat.trend === "Өсөж байна" ? 0.9 : cat.trend === "Буурч байна" ? 1.05 : 1;
    const suggested = monthlyActual * multiplier;
    const variance = ((monthlyActual - suggested) / suggested) * 100;

    return {
      name: cat.name,
      actual: monthlyActual,
      suggested,
      variance,
      trend: cat.trend,
      status:
        variance > 10 ? "over" : variance < -10 ? "under" : ("on-track" as const),
    };
  });

  const savingsVariance =
    ((actualMonthlySavings - suggestedMonthlySavings) / suggestedMonthlySavings) *
    100;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Санал болгох сарын зардал
                </p>
                <p className="text-xl font-bold">
                  {formatCurrency(suggestedMonthlyExpense, currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Өмнөх дундажид үндэслэсэн
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 text-green-600">
                <PiggyBank className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Санал болгох хадгаламж
                </p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(suggestedMonthlySavings, currency)}
                </p>
                <p className="text-xs text-muted-foreground">Орлогын 20%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  savingsVariance >= 0
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {savingsVariance >= 0 ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Бодит хадгаламж (сарын)
                </p>
                <p
                  className={`text-xl font-bold ${
                    actualMonthlySavings >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(actualMonthlySavings, currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {savingsVariance >= 0 ? "Зорилгодоо хүрсэн" : "Зорилгоос доогуур"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed vs Variable Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Тогтмол vs Хувьсах зардлын шинжилгээ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-slate-50">
                <p className="text-sm text-muted-foreground mb-2">
                  Тогтмол зардал (сарын)
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    expense.fixedExpenses / overview.totalMonths,
                    currency
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Түрээс, даатгал, зээл гэх мэт
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50">
                <p className="text-sm text-muted-foreground mb-2">
                  Хувьсах зардал (сарын)
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    expense.variableExpenses / overview.totalMonths,
                    currency
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Хоол, зугаа цэнгэл, худалдаа гэх мэт
                </p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-sm text-blue-800">
                <strong>Зөвлөмж:</strong> Хувьсах зардлыг бууруулах нь хамгийн
                хялбар арга юм. Тогтмол зардлыг бууруулахад урт хугацаа шаардлагатай
                боловч илүү үр дүнтэй байдаг.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Budget Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ангилал бүрийн төсөв</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryBudgets.map((cat, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{cat.name}</span>
                    <Badge
                      variant={
                        cat.status === "over"
                          ? "destructive"
                          : cat.status === "under"
                            ? "default"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {cat.status === "over"
                        ? "Хэтэрсэн"
                        : cat.status === "under"
                          ? "Доогуур"
                          : "Хэвийн"}
                    </Badge>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-medium">
                      {formatCurrency(cat.actual, currency)}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      / {formatCurrency(cat.suggested, currency)}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <Progress
                    value={Math.min(100, (cat.actual / cat.suggested) * 100)}
                    className={`h-2 ${
                      cat.status === "over"
                        ? "[&>div]:bg-red-500"
                        : cat.status === "under"
                          ? "[&>div]:bg-green-500"
                          : ""
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Төсвийн зөвлөмж</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <PiggyBank className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">
                Орлогынхоо 20%-ийг хадгаламжид байршуулахыг зорь (
                {formatCurrency(suggestedMonthlySavings, currency)}/сар)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Target className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">
                Тогтмол зардлыг нийт орлогын 50%-иас хэтрүүлэхгүй байх
              </span>
            </li>
            {categoryBudgets.filter((c) => c.status === "over").length > 0 && (
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  {categoryBudgets
                    .filter((c) => c.status === "over")
                    .map((c) => c.name)
                    .join(", ")}{" "}
                  ангилалд анхаарал хандуулах
                </span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
