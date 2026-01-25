"use client";

import { useState } from "react";
import Link from "next/link";
import { PdfUpload } from "@/components/pdf-upload";
import { FinancialGuide } from "@/components/financial-guide";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ActionState, FinancialGuideReport } from "@/types";
import { FileText, Shield, Zap, ArrowLeft, Target } from "lucide-react";

export default function UploadPage() {
  const [result, setResult] = useState<FinancialGuideReport | null>(null);
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
    return <FinancialGuide report={result} onReset={handleReset} />;
  }

  // Show upload form
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Back button */}
      <Button variant="ghost" asChild>
        <Link href="/">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Нүүр хуудас
        </Link>
      </Button>

      {/* Hero section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          Санхүүгийн Удирдамж Тайлан
        </h1>
        <p className="text-lg text-muted-foreground">
          PDF банкны хуулгаа оруулж, дэлгэрэнгүй санхүүгийн шинжилгээ, эрсдэлийн
          үнэлгээ, зөвлөмжүүд авах
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
            <p className="text-xs text-muted-foreground">Дэлгэрэнгүй тайлан</p>
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
          Дэмжигдсэн банкууд: Хаан банк, Голомт банк, Хас банк, ХХБ, Төрийн
          банк, Худалдаа хөгжлийн банк болон бусад
        </p>
      </div>
    </div>
  );
}
