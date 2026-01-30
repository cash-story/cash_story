"use client";

import { FileText, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "PDF дэмжинэ",
    description: "10MB хүртэл",
  },
  {
    icon: Zap,
    title: "AI шинжилгээ",
    description: "Дэлгэрэнгүй тайлан",
  },
  {
    icon: Shield,
    title: "Аюулгүй",
    description: "Зөвхөн танд харагдана",
  },
];

export function FeatureCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {features.map((feature) => (
        <div
          key={feature.title}
          className="flex items-center gap-3 p-4 rounded-lg border bg-card"
        >
          <div className="p-2 rounded-lg bg-primary/10">
            <feature.icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{feature.title}</p>
            <p className="text-xs text-muted-foreground">{feature.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
