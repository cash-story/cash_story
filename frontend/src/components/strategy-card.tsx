import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, CheckCircle2 } from "lucide-react";
import type { Strategy } from "@/types";

interface StrategyCardProps {
  strategy: Strategy;
}

export function StrategyCard({ strategy }: StrategyCardProps) {
  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Landmark className="w-5 h-5 text-amber-600" />
          {strategy.philosophy}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Мянгат малчин мал сүргээ олон бэлчээрт хуваарилдаг шиг, та ч хөрөнгөө
          төрөлжүүлж эрсдэлээ бууруулна
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <h4 className="font-medium text-sm text-amber-800">
          Танд өгөх зөвлөмж:
        </h4>
        <ul className="space-y-2">
          {strategy.advice_items.map((advice, index) => (
            <li key={index} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <span className="text-sm">{advice}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
