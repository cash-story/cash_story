"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  FileText,
  Shield,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import type { SummaryVerdict } from "@/types";

interface SummaryVerdictCardProps {
  verdict: SummaryVerdict;
}

export function SummaryVerdictCard({ verdict }: SummaryVerdictCardProps) {
  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="w-5 h-5 text-primary" />
          Нэгдсэн дүгнэлт
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall status */}
        <div className="p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg border">
          <p className="text-base leading-relaxed">{verdict.overallStatus}</p>
        </div>

        {/* Three columns */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Strength */}
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-400">Давуу тал</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">{verdict.mainStrength}</p>
          </div>

          {/* Risk */}
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800 dark:text-red-400">Эрсдэл</span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300">{verdict.mainRisk}</p>
          </div>

          {/* Opportunity */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-400">Боломж</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">{verdict.mainOpportunity}</p>
          </div>
        </div>

        {/* Next steps */}
        {verdict.nextSteps.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Дараагийн алхамууд
            </p>
            <div className="space-y-2">
              {verdict.nextSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2 bg-muted/50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-sm flex-1">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
