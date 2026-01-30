"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { PdfUpload } from "@/components/pdf-upload";
import { FinancialGuide } from "@/components/financial-guide";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ActionState, FinancialGuideReport } from "@/types";
import { FeatureCards, LoginPrompt, PageHeader } from "./_components";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";

export default function UploadPage() {
  const { data: session, status } = useSession();
  const [result, setResult] = useState<FinancialGuideReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const hasSynced = useRef(false);

  // Sync user with backend, once on successful authentication
  useEffect(() => {
    const syncUser = async () => {
      if (
        status === "authenticated" &&
        session?.accessToken &&
        !hasSynced.current
      ) {
        hasSynced.current = true; // Prevent re-sync
        try {
          const response = await fetch(`${BACKEND_URL}/auth/google`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              access_token: session.accessToken,
            }),
          });

          if (!response.ok) {
            console.error("Failed to sync user with backend");
          }
        } catch (error) {
          console.error("Error syncing user:", error);
        } finally {
          setIsSyncing(false);
        }
      } else if (status !== "loading") {
        setIsSyncing(false);
      }
    };

    syncUser();
  }, [session, status]);

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

  if (result) {
    return <FinancialGuide report={result} onReset={handleReset} />;
  }

  // Show loading while checking auth or syncing user
  if (status === "loading" || isSyncing) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPrompt />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <PageHeader />
      <FeatureCards />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PdfUpload onAnalysisComplete={handleAnalysisComplete} />

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Дэмжигдсэн банкууд: Хаан банк, Голомт банк, Хас банк, ХХБ, Төрийн
          банк, Худалдаа хөгжлийн банк болон бусад
        </p>
      </div>
    </div>
  );
}
