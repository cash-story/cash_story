import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatMonth } from "@/lib/utils";
import type { MonthlySummary } from "@/types";
import { Calendar } from "lucide-react";

interface MonthlyBreakdownProps {
  data: MonthlySummary[];
  currency?: string;
}

export function MonthlyBreakdown({
  data,
  currency = "MNT",
}: MonthlyBreakdownProps) {
  if (data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5" />
          Сарын задаргаа
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                  Сар
                </th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                  Орлого
                </th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                  Зарлага
                </th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                  Зөрүү
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => {
                const net = row.income - row.expense;
                return (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-3 px-2 font-medium">
                      {formatMonth(row.month)}
                    </td>
                    <td className="py-3 px-2 text-right text-green-600">
                      {formatCurrency(row.income, currency)}
                    </td>
                    <td className="py-3 px-2 text-right text-red-600">
                      {formatCurrency(row.expense, currency)}
                    </td>
                    <td
                      className={`py-3 px-2 text-right font-medium ${
                        net >= 0 ? "text-blue-600" : "text-orange-600"
                      }`}
                    >
                      {formatCurrency(net, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
