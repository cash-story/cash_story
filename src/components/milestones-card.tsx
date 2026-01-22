import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { Shield, Home, Plane, Crown } from "lucide-react";
import type { Milestones } from "@/types";

interface MilestonesCardProps {
  milestones: Milestones;
  currentSavings?: number;
}

const milestoneConfig = {
  security: {
    label: "Санхүүгийн хамгаалалт",
    description: "6 сарын зардлыг хадгаламжаар нөхөх",
    icon: Shield,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    progressColor: "bg-blue-600",
  },
  comfort: {
    label: "Санхүүгийн тав тух",
    description: "Суурь хэрэгцээний 50%-ийг хөрөнгө оруулалтаас авах",
    icon: Home,
    color: "text-green-600",
    bgColor: "bg-green-100",
    progressColor: "bg-green-600",
  },
  freedom: {
    label: "Санхүүгийн эрх чөлөө",
    description: "Амьжиргааны бүх зардлыг хөрөнгө оруулалтаас авах",
    icon: Plane,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    progressColor: "bg-purple-600",
  },
  super_freedom: {
    label: "Супер эрх чөлөө",
    description: "₮1 тэрбумын хөрөнгөтэй болох",
    icon: Crown,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    progressColor: "bg-amber-600",
  },
};

export function MilestonesCard({
  milestones,
  currentSavings = 0,
}: MilestonesCardProps) {
  const milestoneEntries = [
    { key: "security", data: milestones.security },
    { key: "comfort", data: milestones.comfort },
    { key: "freedom", data: milestones.freedom },
    { key: "super_freedom", data: milestones.super_freedom },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Санхүүгийн эрх чөлөөний 4 шат
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {milestoneEntries.map(({ key, data }) => {
          const config = milestoneConfig[key];
          const Icon = config.icon;
          const progress = Math.min(
            (currentSavings / data.amount_mnt) * 100,
            100,
          );

          return (
            <div key={key} className="space-y-2">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${config.bgColor}`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-sm">{config.label}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {data.years_to_reach >= 99
                        ? "Тодорхойгүй"
                        : `~${data.years_to_reach.toFixed(1)} жил`}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {config.description}
                  </p>
                  <div className="mt-2 space-y-1">
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Одоо: {formatCurrency(currentSavings, "MNT")}
                      </span>
                      <span className="font-medium">
                        Зорилго: {formatCurrency(data.amount_mnt, "MNT")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
