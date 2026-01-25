"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Brain,
  CheckCircle2,
  XCircle,
  Calendar,
  Wallet,
  ShoppingCart,
  Zap,
  PiggyBank,
  Sun
} from "lucide-react";
import type { BehaviorPatterns, BehaviorPattern } from "@/types";

interface BehaviorPatternsCardProps {
  behaviorPatterns: BehaviorPatterns;
}

const patternConfig: Record<BehaviorPattern["type"], {
  label: string;
  icon: typeof Calendar;
  description: string;
}> = {
  salary_driven: {
    label: "Цалинд суурилсан зарцуулалт",
    icon: Calendar,
    description: "Цалин орсны дараа их зарцуулдаг",
  },
  end_of_month_shortage: {
    label: "Сарын эцсийн хомсдол",
    icon: Wallet,
    description: "Сарын эцэст мөнгө дутдаг",
  },
  frequent_small_expenses: {
    label: "Олон жижиг зарцуулалт",
    icon: ShoppingCart,
    description: "Жижиг дүнтэй олон гүйлгээ",
  },
  impulse_spending: {
    label: "Санамсаргүй худалдан авалт",
    icon: Zap,
    description: "Төлөвлөгөөгүй худалдан авалт",
  },
  consistent_saving: {
    label: "Тогтмол хадгаламж",
    icon: PiggyBank,
    description: "Тогтмол хадгалдаг",
  },
  seasonal_variation: {
    label: "Улирлын хэлбэлзэл",
    icon: Sun,
    description: "Улирлаас хамааран зарцуулалт өөрчлөгддөг",
  },
};

const severityColors = {
  low: "text-yellow-600 bg-yellow-50",
  medium: "text-orange-600 bg-orange-50",
  high: "text-red-600 bg-red-50",
};

const profileConfig = {
  "Хэмнэлттэй": {
    bgColor: "bg-green-100",
    textColor: "text-green-700",
  },
  "Тэнцвэртэй": {
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
  },
  "Өгөөмөр": {
    bgColor: "bg-orange-100",
    textColor: "text-orange-700",
  },
};

export function BehaviorPatternsCard({ behaviorPatterns }: BehaviorPatternsCardProps) {
  const profileConf = profileConfig[behaviorPatterns.spendingProfile];
  const detectedPatterns = behaviorPatterns.patterns.filter(p => p.detected);
  const notDetectedPatterns = behaviorPatterns.patterns.filter(p => !p.detected);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="w-5 h-5 text-purple-600" />
            Зуршлын хэлбэр
          </CardTitle>
          <div className={cn("px-3 py-1 rounded-full text-sm font-medium", profileConf.bgColor, profileConf.textColor)}>
            {behaviorPatterns.spendingProfile}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Detected patterns */}
        {detectedPatterns.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Илэрсэн зуршлууд:</p>
            <div className="grid gap-2">
              {detectedPatterns.map((pattern, idx) => {
                const config = patternConfig[pattern.type];
                const Icon = config.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Icon className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{config.label}</p>
                        {pattern.severity && (
                          <span className={cn("text-xs px-2 py-0.5 rounded-full", severityColors[pattern.severity])}>
                            {pattern.severity === "low" ? "Бага" : pattern.severity === "medium" ? "Дунд" : "Өндөр"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {pattern.description}
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-purple-500" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Not detected patterns */}
        {notDetectedPatterns.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Илрээгүй зуршлууд:</p>
            <div className="flex flex-wrap gap-2">
              {notDetectedPatterns.map((pattern, idx) => {
                const config = patternConfig[pattern.type];
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-500"
                  >
                    <XCircle className="w-3 h-3" />
                    {config.label}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Insights */}
        {behaviorPatterns.insights.length > 0 && (
          <div className="pt-3 border-t space-y-2">
            <p className="text-sm font-medium">Дүгнэлт:</p>
            <ul className="space-y-1">
              {behaviorPatterns.insights.map((insight, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
