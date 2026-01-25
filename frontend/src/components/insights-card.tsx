import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, AlertTriangle } from "lucide-react";

interface InsightsCardProps {
  insights: string[];
  warnings?: string[];
}

export function InsightsCard({ insights, warnings }: InsightsCardProps) {
  const hasContent = insights.length > 0 || (warnings && warnings.length > 0);

  if (!hasContent) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Санхүүгийн дүгнэлт
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Insights */}
        {insights.length > 0 && (
          <ul className="space-y-2">
            {insights.map((insight, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="text-primary mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <div className="space-y-2 pt-2">
            {warnings.map((warning, index) => (
              <Alert key={index} variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{warning}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
