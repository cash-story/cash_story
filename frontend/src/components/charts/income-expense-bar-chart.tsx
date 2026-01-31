"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyCashflow } from "@/types";

interface IncomeExpenseBarChartProps {
  data: MonthlyCashflow[];
  currency?: string;
}

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
}

function formatCurrency(value: number, currency: string): string {
  return (
    new Intl.NumberFormat("mn-MN", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(value) + (currency === "MNT" ? "₮" : ` ${currency}`)
  );
}

export function IncomeExpenseBarChart({
  data,
  currency = "MNT",
}: IncomeExpenseBarChartProps) {
  const chartData = data.map((d) => ({
    month: d.month.includes("-") ? d.month.split("-")[1] : d.month,
    income: d.income,
    expense: d.expense,
  }));

  return (
    <ResponsiveContainer width="100%" height={220} minHeight={220}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
      >
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10 }}
          tickLine={false}
          interval={0}
        />
        <YAxis
          tickFormatter={(value) => formatCompact(value)}
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={50}
        />
        <Tooltip
          formatter={(value) => formatCurrency(value as number, currency)}
          labelStyle={{ color: "#374151" }}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "11px" }} iconSize={10} />
        <Bar
          dataKey="income"
          name="Орлого"
          fill="#22c55e"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="expense"
          name="Зарлага"
          fill="#ef4444"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
