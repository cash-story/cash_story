import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Award } from "lucide-react";
import type { Rating } from "@/types";

interface RatingCardProps {
  rating: Rating;
}

const gradeConfig: Record<
  Rating["grade"],
  { label: string; bgColor: string; textColor: string; borderColor: string }
> = {
  AA: {
    label: "Маш сайн",
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-500",
  },
  A: {
    label: "Сайн",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    borderColor: "border-green-500",
  },
  B: {
    label: "Тогтвортой",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
    borderColor: "border-blue-500",
  },
  C: {
    label: "Дунд",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-500",
  },
  D: {
    label: "Сул",
    bgColor: "bg-orange-100",
    textColor: "text-orange-700",
    borderColor: "border-orange-500",
  },
  E: {
    label: "Эгзэгтэй",
    bgColor: "bg-red-100",
    textColor: "text-red-700",
    borderColor: "border-red-500",
  },
};

export function RatingCard({ rating }: RatingCardProps) {
  const config = gradeConfig[rating.grade];

  return (
    <Card className={cn("border-2", config.borderColor)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Award className={cn("w-5 h-5", config.textColor)} />
          Санхүүгийн үнэлгээ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "w-20 h-20 rounded-xl flex items-center justify-center",
              config.bgColor,
            )}
          >
            <span className={cn("text-3xl font-bold", config.textColor)}>
              {rating.grade}
            </span>
          </div>
          <div className="flex-1">
            <p className={cn("text-lg font-semibold", config.textColor)}>
              {rating.status_mn}
            </p>
            <p className="text-sm text-muted-foreground">{config.label}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{rating.description}</p>
      </CardContent>
    </Card>
  );
}
