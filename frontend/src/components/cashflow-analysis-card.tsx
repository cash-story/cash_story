"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownUp, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, Lightbulb } from "lucide-react";
import type { CashflowAnalysis } from "@/types";

interface CashflowAnalysisCardProps {
  cashflow: CashflowAnalysis;
  currency?: string;
}

function formatCurrency(amount: number, currency: string = "MNT"): string {
  const sign = amount >= 0 ? "+" : "";
  return sign + new Intl.NumberFormat("mn-MN", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(amount) + (currency === "MNT" ? "₮" : ` ${currency}`);
}

const trendConfig = {
  "Эерэг": {
    icon: TrendingUp,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  "Сөрөг": {
    icon: TrendingDown,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  "Тогтвортой": {
    icon: Minus,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
};

export function CashflowAnalysisCard({ cashflow, currency = "MNT" }: CashflowAnalysisCardProps) {
  const trendConf = trendConfig[cashflow.trend];
  const TrendIcon = trendConf.icon;
  const isPositive = cashflow.netCashflow >= 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowDownUp className="w-5 h-5 text-blue-600" />
          Мөнгөн урсгалын шинжилгээ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main cashflow stat */}
        <div className={cn(
          "p-4 rounded-lg text-center",
          isPositive ? "bg-green-50" : "bg-red-50"
        )}>
          <p className="text-sm text-muted-foreground mb-1">Цэвэр мөнгөн урсгал</p>
          <p className={cn(
            "text-2xl font-bold",
            isPositive ? "text-green-700" : "text-red-700"
          )}>
            {formatCurrency(cashflow.netCashflow, currency)}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className={cn("text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1", trendConf.bgColor, trendConf.color)}>
              <TrendIcon className="w-3 h-3" />
              {cashflow.trend}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-muted-foreground">Сарын дундаж</p>
            <p className={cn(
              "text-lg font-bold",
              cashflow.monthlyAverage >= 0 ? "text-blue-700" : "text-red-700"
            )}>
              {formatCurrency(cashflow.monthlyAverage, currency)}
            </p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-muted-foreground">Хадгаламжийн хувь</p>
            <p className={cn(
              "text-lg font-bold",
              cashflow.savingsRate >= 20 ? "text-green-700" :
              cashflow.savingsRate >= 10 ? "text-yellow-700" : "text-red-700"
            )}>
              {cashflow.savingsRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Monthly breakdown mini chart */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Сарын задаргаа</p>
          <div className="flex items-end gap-1 h-24">
            {cashflow.monthlyBreakdown.map((month, idx) => {
              const maxValue = Math.max(
                ...cashflow.monthlyBreakdown.map(m => Math.abs(m.netCashflow))
              );
              const height = maxValue > 0 ? (Math.abs(month.netCashflow) / maxValue) * 100 : 0;
              const isMonthPositive = month.netCashflow >= 0;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full h-20 flex items-end justify-center">
                    <div
                      className={cn(
                        "w-full max-w-8 rounded-t transition-all",
                        isMonthPositive ? "bg-green-400" : "bg-red-400"
                      )}
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${month.month}: ${formatCurrency(month.netCashflow, currency)}`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {month.month.split("-")[1]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deficit and Surplus months */}
        <div className="grid grid-cols-2 gap-4">
          {cashflow.deficitMonths.length > 0 && (
            <div className="p-2 bg-red-50 rounded-lg">
              <div className="flex items-center gap-1 text-xs font-medium text-red-700 mb-1">
                <AlertCircle className="w-3 h-3" />
                Алдагдалтай сарууд
              </div>
              <div className="flex flex-wrap gap-1">
                {cashflow.deficitMonths.map((month, idx) => (
                  <span key={idx} className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                    {month}
                  </span>
                ))}
              </div>
            </div>
          )}
          {cashflow.surplusMonths.length > 0 && (
            <div className="p-2 bg-green-50 rounded-lg">
              <div className="flex items-center gap-1 text-xs font-medium text-green-700 mb-1">
                <CheckCircle className="w-3 h-3" />
                Илүүдэлтэй сарууд
              </div>
              <div className="flex flex-wrap gap-1">
                {cashflow.surplusMonths.slice(0, 4).map((month, idx) => (
                  <span key={idx} className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                    {month}
                  </span>
                ))}
                {cashflow.surplusMonths.length > 4 && (
                  <span className="text-xs text-green-600">+{cashflow.surplusMonths.length - 4}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Insights */}
        {cashflow.insights.length > 0 && (
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Ойлголт
            </div>
            <ul className="space-y-1">
              {cashflow.insights.map((insight, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-blue-500">•</span>
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
