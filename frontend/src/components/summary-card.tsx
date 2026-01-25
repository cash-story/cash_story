import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  type: "income" | "expense" | "cashflow";
  amount: number;
  currency?: string;
}

export function SummaryCard({
  type,
  amount,
  currency = "MNT",
}: SummaryCardProps) {
  const config = {
    income: {
      label: "Нийт орлого",
      icon: TrendingUp,
      colorClass: "text-green-600",
      bgClass: "bg-green-100",
    },
    expense: {
      label: "Нийт зарлага",
      icon: TrendingDown,
      colorClass: "text-red-600",
      bgClass: "bg-red-100",
    },
    cashflow: {
      label: "Цэвэр мөнгөн урсгал",
      icon: Wallet,
      colorClass: amount >= 0 ? "text-blue-600" : "text-orange-600",
      bgClass: amount >= 0 ? "bg-blue-100" : "bg-orange-100",
    },
  };

  const { label, icon: Icon, colorClass, bgClass } = config[type];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className={cn("text-2xl font-bold mt-1", colorClass)}>
              {formatCurrency(amount, currency)}
            </p>
          </div>
          <div className={cn("p-2 rounded-lg", bgClass)}>
            <Icon className={cn("w-5 h-5", colorClass)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
