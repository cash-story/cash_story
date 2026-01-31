"use client";

import type { FinancialGuideReport } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IncomeExpenseBarChart,
  ExpensePieChart,
  CashflowTrendChart,
} from "@/components/charts";
import { TrendingUp, TrendingDown, ArrowDownUp, PiggyBank } from "lucide-react";

interface OverviewDashboardProps {
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

interface MetricCardProps {
  title: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
  color: "green" | "red" | "blue" | "amber";
}

function MetricCard({ title, value, subtext, icon, color }: MetricCardProps) {
  const colorClasses = {
    green: "text-green-600 bg-green-50",
    red: "text-red-600 bg-red-50",
    blue: "text-blue-600 bg-blue-50",
    amber: "text-amber-600 bg-amber-50",
  };

  return (
    <Card>
      <CardContent className="p-4 sm:pt-6 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {title}
            </p>
            <p className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 truncate">
              {value}
            </p>
            {subtext && (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
                {subtext}
              </p>
            )}
          </div>
          <div
            className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${colorClasses[color]}`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OverviewDashboard({ report }: OverviewDashboardProps) {
  const { income, expense, cashflow, overview } = report;
  const currency = overview.currency;

  const savingsRateColor =
    cashflow.savingsRate >= 20
      ? "green"
      : cashflow.savingsRate >= 10
        ? "amber"
        : "red";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Metric Cards - 2x2 grid on mobile */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          title="Нийт орлого"
          value={formatCurrency(income.totalIncome, currency)}
          subtext={`Сарын: ${formatCurrency(income.monthlyAverage, currency)}`}
          icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />}
          color="green"
        />
        <MetricCard
          title="Нийт зарлага"
          value={formatCurrency(expense.totalExpense, currency)}
          subtext={`Орлогын ${expense.expenseToIncomeRatio.toFixed(1)}%`}
          icon={<TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />}
          color="red"
        />
        <MetricCard
          title="Цэвэр урсгал"
          value={formatCurrency(cashflow.netCashflow, currency)}
          subtext={cashflow.trend}
          icon={<ArrowDownUp className="w-4 h-4 sm:w-5 sm:h-5" />}
          color={cashflow.netCashflow >= 0 ? "blue" : "red"}
        />
        <MetricCard
          title="Хадгаламж"
          value={`${cashflow.savingsRate.toFixed(1)}%`}
          subtext={
            cashflow.savingsRate >= 20
              ? "Сайн"
              : cashflow.savingsRate >= 10
                ? "Дунд"
                : "Сайжруулах"
          }
          icon={<PiggyBank className="w-4 h-4 sm:w-5 sm:h-5" />}
          color={savingsRateColor}
        />
      </div>

      {/* Charts - Stacked on mobile */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">
              Орлого vs Зарлага
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0">
            <IncomeExpenseBarChart
              data={cashflow.monthlyBreakdown}
              currency={currency}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">
              Зардлын хуваарилалт
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0">
            <ExpensePieChart
              categories={expense.topCategories}
              currency={currency}
            />
          </CardContent>
        </Card>
      </div>

      {/* Cashflow Trend */}
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
    </div>
  );
}
