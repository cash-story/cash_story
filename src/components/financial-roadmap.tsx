"use client";

import type { FinancialRoadmapResult } from "@/types";
import { SummaryCard } from "./summary-card";
import { MonthlyBreakdown } from "./monthly-breakdown";
import { RatingCard } from "./rating-card";
import { MilestonesCard } from "./milestones-card";
import { StrategyCard } from "./strategy-card";
import { ProjectionsChart } from "./projections-chart";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, RefreshCw, Calendar, Target } from "lucide-react";

interface FinancialRoadmapProps {
  result: FinancialRoadmapResult;
  onReset: () => void;
}

export function FinancialRoadmap({ result, onReset }: FinancialRoadmapProps) {
  const {
    summary,
    monthlyBreakdown,
    rating,
    milestones,
    strategy,
    projections,
    bankName,
  } = result;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Санхүүгийн Эрх Чөлөөний Төлөвлөгөө
          </h2>
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

      {/* Rating Card - Prominent at top */}
      <RatingCard rating={rating} />

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

      {/* Milestones and Strategy side by side on larger screens */}
      <div className="grid gap-4 lg:grid-cols-2">
        <MilestonesCard milestones={milestones} currentSavings={0} />
        <StrategyCard strategy={strategy} />
      </div>

      {/* Projections */}
      <ProjectionsChart projections={projections} />

      {/* Monthly breakdown */}
      <MonthlyBreakdown data={monthlyBreakdown} currency={summary.currency} />

      {/* Privacy notice */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground text-center">
            Таны өгөгдөл серверт хадгалагдахгүй. Шинжилгээ дууссаны дараа бүх
            мэдээлэл автоматаар устгагдана. Энэхүү тооцоолол нь зөвхөн мэдээлэл
            өгөх зорилготой бөгөөд санхүүгийн зөвлөгөө биш юм.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
