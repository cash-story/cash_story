"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { FinancialScore } from "@/types";

interface ScoreBadgeProps {
  score: FinancialScore;
}

const categoryConfig = {
  "Сайн": {
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    borderColor: "border-green-500",
    ringColor: "ring-green-500",
    progressColor: "bg-green-500",
  },
  "Анхаарах": {
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-500",
    ringColor: "ring-yellow-500",
    progressColor: "bg-yellow-500",
  },
  "Эрсдэлтэй": {
    bgColor: "bg-red-100",
    textColor: "text-red-700",
    borderColor: "border-red-500",
    ringColor: "ring-red-500",
    progressColor: "bg-red-500",
  },
};

export function ScoreBadge({ score }: ScoreBadgeProps) {
  const config = categoryConfig[score.category];

  return (
    <Card className={cn("border-2", config.borderColor)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className={cn("w-5 h-5", config.textColor)} />
          Санхүүгийн эрүүл мэндийн оноо
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Circle */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <div
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center ring-4",
                config.bgColor,
                config.ringColor
              )}
            >
              <span className={cn("text-4xl font-bold", config.textColor)}>
                {score.score}
              </span>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", config.bgColor, config.textColor)}>
                /100
              </span>
            </div>
          </div>
          <div className="flex-1">
            <p className={cn("text-xl font-semibold", config.textColor)}>
              {score.category}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {score.description}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Эрсдэлтэй</span>
            <span>Анхаарах</span>
            <span>Сайн</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all duration-500", config.progressColor)}
              style={{ width: `${score.score}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>40</span>
            <span>70</span>
            <span>100</span>
          </div>
        </div>

        {/* Score factors */}
        {score.factors.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium">Нөлөөлсөн хүчин зүйлс:</p>
            <div className="space-y-1">
              {score.factors.map((factor, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  {factor.impact === "positive" && (
                    <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  )}
                  {factor.impact === "negative" && (
                    <TrendingDown className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  {factor.impact === "neutral" && (
                    <Minus className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <span className="font-medium">{factor.name}:</span>{" "}
                    <span className="text-muted-foreground">{factor.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
