"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { AlertTriangle, ShieldAlert, ShieldCheck, AlertCircle } from "lucide-react";
import type { RiskSignals } from "@/types";

interface RiskSignalsCardProps {
  risks: RiskSignals;
}

const severityConfig = {
  "Бага": {
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-800",
    icon: AlertCircle,
  },
  "Дунд": {
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-800",
    icon: AlertTriangle,
  },
  "Өндөр": {
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-800",
    icon: ShieldAlert,
  },
};

const overallRiskConfig = {
  "Бага": {
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    borderColor: "border-green-500",
  },
  "Дунд": {
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-500",
  },
  "Өндөр": {
    bgColor: "bg-red-100",
    textColor: "text-red-700",
    borderColor: "border-red-500",
  },
};

export function RiskSignalsCard({ risks }: RiskSignalsCardProps) {
  const detectedRisks = risks.risks.filter((r) => r.detected);
  const overallConfig = overallRiskConfig[risks.overallRiskLevel];

  return (
    <Card className={cn("border-2", overallConfig.borderColor)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className={cn("w-5 h-5", overallConfig.textColor)} />
            Эрсдэлийн дохио
          </CardTitle>
          <div className={cn("px-3 py-1 rounded-full text-sm font-medium", overallConfig.bgColor, overallConfig.textColor)}>
            {risks.overallRiskLevel} эрсдэл
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {detectedRisks.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <ShieldCheck className="w-8 h-8 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Эрсдэл илрээгүй</p>
              <p className="text-sm text-green-600">
                Таны санхүүгийн байдал тогтвортой байна.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {detectedRisks.map((risk, idx) => {
              const config = severityConfig[risk.severity];
              const Icon = config.icon;
              return (
                <Alert key={idx} className={cn(config.bgColor, config.borderColor)}>
                  <Icon className={cn("w-4 h-4", config.textColor)} />
                  <AlertTitle className={cn("font-semibold", config.textColor)}>
                    {risk.title}
                    <span className={cn("ml-2 text-xs px-2 py-0.5 rounded-full", config.bgColor, config.textColor, "border", config.borderColor)}>
                      {risk.severity}
                    </span>
                  </AlertTitle>
                  <AlertDescription className="mt-2 space-y-2">
                    <p className="text-sm">{risk.description}</p>
                    <div className="flex items-start gap-2 pt-2 border-t border-dashed">
                      <span className="text-xs font-medium">Зөвлөмж:</span>
                      <span className="text-xs">{risk.recommendation}</span>
                    </div>
                  </AlertDescription>
                </Alert>
              );
            })}
          </div>
        )}

        {risks.hasUrgentRisks && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-sm font-medium text-red-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Яаралтай анхаарах шаардлагатай эрсдэлүүд байна!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
