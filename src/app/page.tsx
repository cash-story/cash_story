"use client";

import { useState } from "react";
import { PdfUpload } from "@/components/pdf-upload";
import { AnalysisResultView } from "@/components/analysis-result";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ActionState, AnalysisResult } from "@/types";
import { FileText, Shield, Zap } from "lucide-react";

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysisComplete = (state: ActionState) => {
    if (state.success && state.data) {
      setResult(state.data);
      setError(null);
    } else {
      setError(state.error || "Алдаа гарлаа");
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  // Show results if available
  if (result) {
    return <AnalysisResultView result={result} onReset={handleReset} />;
  }

  // Show upload form
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Hero section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Банкны хуулга шинжлэгч
        </h1>
        <p className="text-lg text-muted-foreground">
          PDF банкны хуулгаа оруулж, AI ашиглан санхүүгийн дэлгэрэнгүй тайлан
          авах
        </p>
      </div>

      {/* Features */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">PDF дэмжинэ</p>
            <p className="text-xs text-muted-foreground">10MB хүртэл</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">AI шинжилгээ</p>
            <p className="text-xs text-muted-foreground">Секундын дотор</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">Нууцлал</p>
            <p className="text-xs text-muted-foreground">Хадгалагдахгүй</p>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload form */}
      <PdfUpload onAnalysisComplete={handleAnalysisComplete} />

      {/* Supported banks */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Дэмжигдсэн банкууд: Хаан банк, Голомт банк, Хас банк, ХХБ, Төрийн банк,
          Худалдаа хөгжлийн банк болон бусад
        </p>
      </div>
    </div>
  );
}
