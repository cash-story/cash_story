"use client";

import type { CashflowAnalysis, ReportOverview } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDownUp,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { CashflowTrendChart, IncomeExpenseBarChart } from "@/components/charts";

interface CashflowDetailSectionProps {
  cashflow: CashflowAnalysis;
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

export function CashflowDetailSection({
  cashflow,
  overview,
}: CashflowDetailSectionProps) {
  const currency = overview.currency;
  const isPositive = cashflow.netCashflow >= 0;

  const trendColor =
    cashflow.trend === "Эерэг"
      ? "text-green-600"
      : cashflow.trend === "Сөрөг"
        ? "text-red-600"
        : "text-blue-600";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards - 2x2 on mobile */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`p-1.5 sm:p-2 rounded-lg ${isPositive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
              >
                <ArrowDownUp className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-sm text-muted-foreground">
                  Цэвэр урсгал
                </p>
                <p
                  className={`text-sm sm:text-xl font-bold truncate ${isPositive ? "text-green-600" : "text-red-600"}`}
                >
                  {formatCurrency(cashflow.netCashflow, currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-blue-50 text-blue-600">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-sm text-muted-foreground">
                  Сарын дундаж
                </p>
                <p className="text-sm sm:text-xl font-bold truncate">
                  {formatCurrency(cashflow.monthlyAverage, currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-green-50 text-green-600">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-sm text-muted-foreground">
                  Илүүдэлтэй
                </p>
                <p className="text-sm sm:text-xl font-bold text-green-600">
                  {cashflow.surplusMonths.length} сар
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-red-50 text-red-600">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-sm text-muted-foreground">
                  Дутагдалтай
                </p>
                <p className="text-sm sm:text-xl font-bold text-red-600">
                  {cashflow.deficitMonths.length} сар
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend and Savings Rate */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-sm text-muted-foreground">
                  Чиг хандлага
                </p>
                <p className={`text-lg sm:text-2xl font-bold ${trendColor}`}>
                  {cashflow.trend}
                </p>
              </div>
              {cashflow.trend === "Эерэг" ? (
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              ) : cashflow.trend === "Сөрөг" ? (
                <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
              ) : (
                <ArrowDownUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-sm text-muted-foreground">
                  Хадгаламж
                </p>
                <p
                  className={`text-lg sm:text-2xl font-bold ${
                    cashflow.savingsRate >= 20
                      ? "text-green-600"
                      : cashflow.savingsRate >= 10
                        ? "text-amber-600"
                        : "text-red-600"
                  }`}
                >
                  {cashflow.savingsRate.toFixed(1)}%
                </p>
              </div>
              <Badge
                variant={
                  cashflow.savingsRate >= 20
                    ? "default"
                    : cashflow.savingsRate >= 10
                      ? "secondary"
                      : "destructive"
                }
                className="text-[10px] sm:text-xs"
              >
                {cashflow.savingsRate >= 20
                  ? "Сайн"
                  : cashflow.savingsRate >= 10
                    ? "Дунд"
                    : "Сайжруулах"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">
            Мөнгөн урсгалын чиг хандлага
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0">
          <CashflowTrendChart
            data={cashflow.monthlyBreakdown}
            currency={currency}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">
            Сар бүрийн орлого ба зарлага
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0">
          <IncomeExpenseBarChart
            data={cashflow.monthlyBreakdown}
            currency={currency}
          />
        </CardContent>
      </Card>

      {/* Monthly Breakdown Table */}
      <Card>
        <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Сарын задаргаа</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 sm:px-3 font-medium">
                    Сар
                  </th>
                  <th className="text-right py-2 px-2 sm:px-3 font-medium">
                    Орлого
                  </th>
                  <th className="text-right py-2 px-2 sm:px-3 font-medium">
                    Зарлага
                  </th>
                  <th className="text-right py-2 px-2 sm:px-3 font-medium">
                    Цэвэр
                  </th>
                </tr>
              </thead>
              <tbody>
                {cashflow.monthlyBreakdown.map((month, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-2 px-2 sm:px-3">{month.month}</td>
                    <td className="text-right py-2 px-2 sm:px-3 text-green-600">
                      {formatCurrency(month.income, currency)}
                    </td>
                    <td className="text-right py-2 px-2 sm:px-3 text-red-600">
                      {formatCurrency(month.expense, currency)}
                    </td>
                    <td
                      className={`text-right py-2 px-2 sm:px-3 font-medium ${
                        month.netCashflow >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(month.netCashflow, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {cashflow.insights.length > 0 && (
        <Card>
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Дүгнэлт</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <ul className="space-y-2">
              {cashflow.insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2">
                  <ArrowDownUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
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
