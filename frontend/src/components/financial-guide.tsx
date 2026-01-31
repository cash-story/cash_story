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
import { IncomeOutcomeAnalysis } from "./income-outcome-analysis";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  RefreshCw,
  Calendar,
  FileText,
  BarChart3,
  Target,
} from "lucide-react";

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
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
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

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" className="w-full">
        {/* Desktop/Tablet Tabs */}
        <TabsList className="hidden sm:grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <FileText className="w-4 h-4" />
            Ерөнхий
          </TabsTrigger>
          <TabsTrigger value="income-outcome" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Орлого/Зарлага
          </TabsTrigger>
          <TabsTrigger value="planning" className="gap-2">
            <Target className="w-4 h-4" />
            Төлөвлөгөө
          </TabsTrigger>
        </TabsList>

        {/* Mobile Bottom Navigation */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
          <TabsList className="grid w-full grid-cols-3 h-16 rounded-none bg-background">
            <TabsTrigger
              value="overview"
              className="flex-col gap-1 h-full rounded-none data-[state=active]:bg-primary/10"
            >
              <FileText className="w-5 h-5" />
              <span className="text-xs">Ерөнхий</span>
            </TabsTrigger>
            <TabsTrigger
              value="income-outcome"
              className="flex-col gap-1 h-full rounded-none data-[state=active]:bg-primary/10"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs">Орлого/Зарлага</span>
            </TabsTrigger>
            <TabsTrigger
              value="planning"
              className="flex-col gap-1 h-full rounded-none data-[state=active]:bg-primary/10"
            >
              <Target className="w-5 h-5" />
              <span className="text-xs">Төлөвлөгөө</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Summary Verdict - Most important at top */}
          <SummaryVerdictCard verdict={verdict} />

          {/* Score Badge */}
          <ScoreBadge score={score} />

          {/* Risk Signals - Important warnings */}
          {risks.risks.some((r) => r.detected) && (
            <RiskSignalsCard risks={risks} />
          )}

          {/* Analysis Section - Income, Expense, Cashflow */}
          <div className="grid gap-4 lg:grid-cols-3">
            <IncomeAnalysisCard income={income} currency={overview.currency} />
            <ExpenseAnalysisCard
              expense={expense}
              currency={overview.currency}
            />
            <CashflowAnalysisCard
              cashflow={cashflow}
              currency={overview.currency}
            />
          </div>

          {/* Behavior Patterns */}
          <BehaviorPatternsCard behaviorPatterns={behaviorPatterns} />

          {/* Recommendations */}
          <RecommendationsCard recommendations={recommendations} />

          {/* Risk Signals - If none detected, show at bottom */}
          {!risks.risks.some((r) => r.detected) && (
            <RiskSignalsCard risks={risks} />
          )}
        </TabsContent>

        {/* Income/Outcome Analysis Tab */}
        <TabsContent value="income-outcome" className="mt-6">
          <IncomeOutcomeAnalysis report={report} />
        </TabsContent>

        {/* Planning Tab */}
        <TabsContent value="planning" className="space-y-6 mt-6">
          {/* Milestones and Strategy */}
          <div className="grid gap-4 lg:grid-cols-2">
            <MilestonesCard milestones={milestones} currentSavings={0} />
            <StrategyCard strategy={strategy} />
          </div>

          {/* Projections */}
          <ProjectionsChart projections={projections} />
        </TabsContent>
      </Tabs>

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

      {/* Mobile bottom padding to account for fixed navigation */}
      <div className="sm:hidden h-20" />
    </div>
  );
}
