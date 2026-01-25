"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { TrendingUp, Wallet, BarChart3, Lightbulb } from "lucide-react";
import type { IncomeAnalysis } from "@/types";

interface IncomeAnalysisCardProps {
  income: IncomeAnalysis;
  currency?: string;
}

function formatCurrency(amount: number, currency: string = "MNT"): string {
  return new Intl.NumberFormat("mn-MN", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(amount) + (currency === "MNT" ? "₮" : ` ${currency}`);
}

export function IncomeAnalysisCard({ income, currency = "MNT" }: IncomeAnalysisCardProps) {
  const stabilityColor = income.stability === "Тогтвортой"
    ? "text-green-600 bg-green-100"
    : "text-orange-600 bg-orange-100";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Орлогын шинжилгээ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-muted-foreground">Нийт орлого</p>
            <p className="text-lg font-bold text-green-700">
              {formatCurrency(income.totalIncome, currency)}
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-muted-foreground">Сарын дундаж</p>
            <p className="text-lg font-bold text-blue-700">
              {formatCurrency(income.monthlyAverage, currency)}
            </p>
          </div>
        </div>

        {/* Stability */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Тогтвортой байдал</span>
            <span className={cn("text-xs px-2 py-1 rounded-full font-medium", stabilityColor)}>
              {income.stability}
            </span>
          </div>
          <div className="space-y-1">
            <Progress value={income.stabilityScore} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {income.stabilityScore}%
            </p>
          </div>
        </div>

        {/* Main sources */}
        {income.mainSources.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wallet className="w-4 h-4" />
              Гол эх үүсвэрүүд
            </div>
            <div className="space-y-2">
              {income.mainSources.map((source, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>{source.name}</span>
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded",
                        source.frequency === "Тогтмол"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      )}>
                        {source.frequency}
                      </span>
                    </div>
                    <span className="font-medium">{source.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={source.percentage} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground w-24 text-right">
                      {formatCurrency(source.amount, currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        {income.insights.length > 0 && (
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Ойлголт
            </div>
            <ul className="space-y-1">
              {income.insights.map((insight, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-green-500">•</span>
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
