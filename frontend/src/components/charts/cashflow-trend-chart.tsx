"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import type { MonthlyCashflow } from "@/types";

interface CashflowTrendChartProps {
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

export function CashflowTrendChart({
  data,
  currency = "MNT",
}: CashflowTrendChartProps) {
  const chartData = data.map((d) => ({
    month: d.month.includes("-") ? d.month.split("-")[1] : d.month,
    netCashflow: d.netCashflow,
    positive: d.netCashflow >= 0 ? d.netCashflow : 0,
    negative: d.netCashflow < 0 ? d.netCashflow : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={200} minHeight={200}>
      <ComposedChart
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
          labelFormatter={(label) => `${label} сар`}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
        <Area
          type="monotone"
          dataKey="positive"
          fill="#22c55e"
          fillOpacity={0.2}
          stroke="none"
        />
        <Area
          type="monotone"
          dataKey="negative"
          fill="#ef4444"
          fillOpacity={0.2}
          stroke="none"
        />
        <Line
          type="monotone"
          dataKey="netCashflow"
          name="Цэвэр урсгал"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
