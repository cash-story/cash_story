import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import type { LegacyCategory } from "@/types";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryListProps {
  type: "income" | "expense";
  categories: LegacyCategory[];
  currency?: string;
}

export function CategoryList({
  type,
  categories,
  currency = "MNT",
}: CategoryListProps) {
  if (categories.length === 0) {
    return null;
  }

  const isIncome = type === "income";
  const Icon = isIncome ? TrendingUp : TrendingDown;
  const title = isIncome ? "Орлогын ангилал" : "Зарлагын ангилал";
  const colorClass = isIncome ? "text-green-600" : "text-red-600";
  const progressColor = isIncome ? "bg-green-500" : "bg-red-500";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className={cn("w-5 h-5", colorClass)} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.slice(0, 5).map((category, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{category.name}</span>
              <span className={colorClass}>
                {formatCurrency(category.amount, currency)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Progress
                  value={category.percentage}
                  className="h-2"
                  indicatorClassName={progressColor}
                />
              </div>
              <span className="text-xs text-muted-foreground w-10 text-right">
                {category.percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
