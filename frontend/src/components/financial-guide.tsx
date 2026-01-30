"use client";

import type { FinancialGuideReport } from "@/types";
import { ScoreBadge } from "./score-badge";
import { IncomeAnalysisCard } from "./income-analysis-card";
import { ExpenseAnalysisCard } from "./expense-analysis-card";
import { CashflowAnalysisCard } from "./cashflow-analysis-card";
import { BehaviorPatternsCard } from "./behavior-patterns-card";
import { RiskSignalsCard } from "./risk-signals-card";
import { RecommendationsCard } from "./recommendations-card";
import { MilestonesCard } from "./milestones-card";
import { ProjectionsChart } from "./projections-chart";
import { StrategyCard } from "./strategy-card";
import { SummaryVerdictCard } from "./summary-verdict-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, RefreshCw, Calendar, Target, FileText } from "lucide-react";

interface FinancialGuideProps {
  report: FinancialGuideReport;
  onReset?: () => void;
}

export function FinancialGuide({ report, onReset }: FinancialGuideProps) {
  const {
    overview,
    score,
    income,
    expense,
    cashflow,
    behaviorPatterns,
    risks,
    recommendations,
    milestones,
    projections,
    strategy,
    verdict,
  } = report;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Санхүүгийн Удирдамж Тайлан
          </h2>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
            {overview.bankName && (
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {overview.bankName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {overview.periodStart} - {overview.periodEnd}
            </span>
            <span className="text-xs">({overview.totalMonths} сар)</span>
          </div>
        </div>
        {onReset && (
          <Button variant="outline" onClick={onReset}>
            <RefreshCw className="w-4 h-4" />
            Шинэ файл
          </Button>
        )}
      </div>

      {/* Summary Verdict - Most important at top */}
      <SummaryVerdictCard verdict={verdict} />

      {/* Score Badge */}
      <ScoreBadge score={score} />

      {/* Risk Signals - Important warnings */}
      {risks.risks.some((r) => r.detected) && <RiskSignalsCard risks={risks} />}

      {/* Analysis Section - Income, Expense, Cashflow */}
      <div className="grid gap-4 lg:grid-cols-3">
        <IncomeAnalysisCard income={income} currency={overview.currency} />
        <ExpenseAnalysisCard expense={expense} currency={overview.currency} />
        <CashflowAnalysisCard
          cashflow={cashflow}
          currency={overview.currency}
        />
      </div>

      {/* Behavior Patterns */}
      <BehaviorPatternsCard behaviorPatterns={behaviorPatterns} />

      {/* Recommendations */}
      <RecommendationsCard recommendations={recommendations} />

      {/* Milestones and Strategy */}
      <div className="grid gap-4 lg:grid-cols-2">
        <MilestonesCard milestones={milestones} currentSavings={0} />
        <StrategyCard strategy={strategy} />
      </div>

      {/* Projections */}
      <ProjectionsChart projections={projections} />

      {/* Risk Signals - If none detected, show at bottom */}
      {!risks.risks.some((r) => r.detected) && (
        <RiskSignalsCard risks={risks} />
      )}

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
