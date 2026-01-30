"use client";

import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AnalyzeButtonProps {
  extractedCount: number;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}

export function AnalyzeButton({
  extractedCount,
  isAnalyzing,
  onAnalyze,
}: AnalyzeButtonProps) {
  const canAnalyze = extractedCount > 0 && !isAnalyzing;

  return (
    <>
      <div className="mt-6 flex justify-end">
        <Button size="lg" onClick={onAnalyze} disabled={!canAnalyze}>
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Шинжилж байна...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Нэгтгэж шинжлэх ({extractedCount} хуулга)
            </>
          )}
        </Button>
      </div>

      {isAnalyzing && (
        <Alert className="mt-4">
          <AlertDescription>
            Таны банкны хуулгуудыг AI ашиглан нэгтгэж шинжилж байна. Энэ хэдэн
            минут үргэлжилж болно...
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
