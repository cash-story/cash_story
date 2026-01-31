"use client";

import type { IncomeAnalysis, ReportOverview } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  CircleDollarSign,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface IncomeDetailSectionProps {
  income: IncomeAnalysis;
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

export function IncomeDetailSection({
  income,
  overview,
}: IncomeDetailSectionProps) {
  const currency = overview.currency;
  const isStable = income.stability === "Тогтвортой";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards - Stack on mobile */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 sm:pt-6">
            <div className="flex items-center gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-green-50 text-green-600">
                <CircleDollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Нийт орлого
                </p>
                <p className="text-lg sm:text-xl font-bold truncate">
                  {formatCurrency(income.totalIncome, currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:pt-6">
            <div className="flex items-center gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-blue-50 text-blue-600">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Сарын дундаж
                </p>
                <p className="text-lg sm:text-xl font-bold truncate">
                  {formatCurrency(income.monthlyAverage, currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:pt-6">
            <div className="flex items-center gap-3">
              <div
                className={`p-1.5 sm:p-2 rounded-lg ${isStable ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}
              >
                {isStable ? (
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Тогтвортой байдал
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-lg sm:text-xl font-bold">
                    {income.stabilityScore}%
                  </p>
                  <Badge
                    variant={isStable ? "default" : "secondary"}
                    className="text-[10px] sm:text-xs"
                  >
                    {income.stability}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income Sources */}
      <Card>
        <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">
            Орлогын эх үүсвэрүүд
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="space-y-4">
            {income.mainSources.map((source, index) => (
              <div key={index} className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-medium">
                      {source.name}
                    </span>
                    <Badge
                      variant={
                        source.frequency === "Тогтмол" ? "default" : "secondary"
                      }
                      className="text-[10px] sm:text-xs"
                    >
                      {source.frequency}
                    </Badge>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-sm sm:text-base font-semibold">
                      {formatCurrency(source.amount, currency)}
                    </span>
                    <span className="text-xs sm:text-sm text-muted-foreground ml-2">
                      ({source.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <Progress value={source.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {income.insights.length > 0 && (
        <Card>
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Дүгнэлт</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <ul className="space-y-2">
              {income.insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
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
