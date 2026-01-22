"use client";

import type { AnalysisResult } from "@/types";
import { SummaryCard } from "./summary-card";
import { MonthlyBreakdown } from "./monthly-breakdown";
import { CategoryList } from "./category-list";
import { InsightsCard } from "./insights-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, RefreshCw, Calendar } from "lucide-react";

interface AnalysisResultProps {
  result: AnalysisResult;
  onReset: () => void;
}

export function AnalysisResultView({ result, onReset }: AnalysisResultProps) {
  const { summary, monthlyBreakdown, topIncomeCategories, topExpenseCategories, insights, warnings, bankName } = result;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Санхүүгийн тайлан</h2>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            {bankName && (
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {bankName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {summary.periodStart} - {summary.periodEnd}
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={onReset}>
          <RefreshCw className="w-4 h-4" />
          Шинэ файл
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          type="income"
          amount={summary.totalIncome}
          currency={summary.currency}
        />
        <SummaryCard
          type="expense"
          amount={summary.totalExpense}
          currency={summary.currency}
        />
        <SummaryCard
          type="cashflow"
          amount={summary.netCashflow}
          currency={summary.currency}
        />
      </div>

      {/* Monthly breakdown */}
      <MonthlyBreakdown data={monthlyBreakdown} currency={summary.currency} />

      {/* Categories */}
      <div className="grid gap-4 md:grid-cols-2">
        <CategoryList
          type="income"
          categories={topIncomeCategories}
          currency={summary.currency}
        />
        <CategoryList
          type="expense"
          categories={topExpenseCategories}
          currency={summary.currency}
        />
      </div>

      {/* Insights */}
      <InsightsCard insights={insights} warnings={warnings} />

      {/* Privacy notice */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground text-center">
            Таны өгөгдөл серверт хадгалагдахгүй. Шинжилгээ дууссаны дараа бүх
            мэдээлэл автоматаар устгагдана.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
