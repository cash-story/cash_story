"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { ExpenseCategory } from "@/types";

const COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
];

interface ExpensePieChartProps {
  categories: ExpenseCategory[];
  currency?: string;
}

function formatCurrency(value: number, currency: string): string {
  return (
    new Intl.NumberFormat("mn-MN", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(value) + (currency === "MNT" ? "₮" : ` ${currency}`)
  );
}

export function ExpensePieChart({
  categories,
  currency = "MNT",
}: ExpensePieChartProps) {
  const data = categories.slice(0, 5).map((cat) => ({
    name: cat.name.length > 10 ? cat.name.substring(0, 10) + "..." : cat.name,
    fullName: cat.name,
    value: cat.amount,
    percentage: cat.percentage,
  }));

  return (
    <ResponsiveContainer width="100%" height={220} minHeight={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={70}
          innerRadius={40}
          paddingAngle={2}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, _name, props) => [
            formatCurrency(value as number, currency),
            (props as any).payload.fullName,
          ]}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend
          layout="horizontal"
          align="center"
          verticalAlign="bottom"
          wrapperStyle={{ fontSize: "10px", paddingTop: "10px" }}
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
