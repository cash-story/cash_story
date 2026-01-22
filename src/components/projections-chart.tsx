import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import type { Projection } from "@/types";

interface ProjectionsChartProps {
  projections: Projection[];
}

export function ProjectionsChart({ projections }: ProjectionsChartProps) {
  // Find max value for scaling the bars
  const maxValue = Math.max(...projections.map((p) => p.projected_value));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Хөрөнгийн өсөлтийн тусгал
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          12% жилийн өгөөжөөр тооцоолсон
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projections.map((projection) => {
            const percentage = (projection.projected_value / maxValue) * 100;

            return (
              <div key={projection.year} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{projection.year} жилийн дараа</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(projection.projected_value, "MNT")}
                  </span>
                </div>
                <div className="h-6 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Анхааруулга:</strong> Энэхүү тооцоолол нь 12% жилийн дундаж
            өгөөж дээр суурилсан бөгөөд баталгаа биш зөвхөн тусгал болно.
            Бодит өгөөж зах зээлийн нөхцөл байдлаас хамаарч өөрчлөгдөж болно.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
