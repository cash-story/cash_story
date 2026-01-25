"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Lightbulb,
  Star,
  PiggyBank,
  TrendingUp,
  Heart,
  ChevronRight,
  Clock,
  Zap,
  Target
} from "lucide-react";
import type { Recommendations, Recommendation } from "@/types";
import { useState } from "react";

interface RecommendationsCardProps {
  recommendations: Recommendations;
}

const categoryConfig = {
  priority: {
    icon: Star,
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Нэн тэргүүнд",
  },
  savings: {
    icon: PiggyBank,
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "Хадгаламж",
  },
  investment: {
    icon: TrendingUp,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    label: "Хөрөнгө оруулалт",
  },
  lifestyle: {
    icon: Heart,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    label: "Амьдралын хэв маяг",
  },
};

const impactConfig = {
  "Өндөр": { color: "text-red-600 bg-red-50", icon: Zap },
  "Дунд": { color: "text-yellow-600 bg-yellow-50", icon: Target },
  "Бага": { color: "text-gray-600 bg-gray-50", icon: Target },
};

const difficultyConfig = {
  "Хялбар": "text-green-600 bg-green-50",
  "Дунд": "text-yellow-600 bg-yellow-50",
  "Хэцүү": "text-red-600 bg-red-50",
};

const timeframeConfig = {
  "Богино хугацаа": { color: "text-green-600", icon: Clock },
  "Дунд хугацаа": { color: "text-blue-600", icon: Clock },
  "Урт хугацаа": { color: "text-purple-600", icon: Clock },
};

function RecommendationItem({ rec, category }: { rec: Recommendation; category: keyof typeof categoryConfig }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "border rounded-lg overflow-hidden transition-all",
        isExpanded && "ring-2 ring-primary/20"
      )}
    >
      <button
        className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg", config.bgColor)}>
            <Icon className={cn("w-4 h-4", config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{rec.title}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={cn("text-xs px-1.5 py-0.5 rounded", impactConfig[rec.impact].color)}>
                {rec.impact} нөлөө
              </span>
              <span className={cn("text-xs px-1.5 py-0.5 rounded", difficultyConfig[rec.difficulty])}>
                {rec.difficulty}
              </span>
              <span className={cn("text-xs flex items-center gap-1", timeframeConfig[rec.timeframe].color)}>
                <Clock className="w-3 h-3" />
                {rec.timeframe}
              </span>
            </div>
          </div>
          <ChevronRight className={cn(
            "w-5 h-5 text-muted-foreground transition-transform",
            isExpanded && "rotate-90"
          )} />
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t bg-muted/30">
          <p className="text-sm text-muted-foreground mt-3 mb-3">{rec.description}</p>
          {rec.actionItems.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Үйлдлийн алхамууд:</p>
              <ul className="space-y-1">
                {rec.actionItems.map((item, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RecommendationsCard({ recommendations }: RecommendationsCardProps) {
  const allCategories = [
    { key: "priority" as const, recs: recommendations.priority },
    { key: "savings" as const, recs: recommendations.savings },
    { key: "investment" as const, recs: recommendations.investment },
    { key: "lifestyle" as const, recs: recommendations.lifestyle },
  ].filter(c => c.recs.length > 0);

  const totalCount = allCategories.reduce((sum, c) => sum + c.recs.length, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Зөвлөмжүүд
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {totalCount} зөвлөмж
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {allCategories.map(({ key, recs }) => {
          const config = categoryConfig[key];
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center gap-2">
                <config.icon className={cn("w-4 h-4", config.color)} />
                <span className="text-sm font-medium">{config.label}</span>
                <span className="text-xs text-muted-foreground">({recs.length})</span>
              </div>
              <div className="space-y-2 pl-6">
                {recs.map((rec) => (
                  <RecommendationItem key={rec.id} rec={rec} category={key} />
                ))}
              </div>
            </div>
          );
        })}

        {totalCount === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Зөвлөмж олдсонгүй</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
