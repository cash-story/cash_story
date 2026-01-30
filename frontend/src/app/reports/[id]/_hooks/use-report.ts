"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  fetchReportGroup,
  updateReportGroup,
  deleteStatement,
  getCombinedText,
  saveAnalysisResult,
  type ReportGroup,
} from "@/lib/api/reports";
import { analyzeText } from "@/actions/analyze-pdf";

export function useReport(reportId: string) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [report, setReport] = useState<ReportGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  const accessToken = (session as any)?.accessToken;

  const loadReport = useCallback(async () => {
    if (!accessToken || !reportId) return;

    try {
      const data = await fetchReportGroup(accessToken, reportId);
      setReport(data);
      setEditedName(data.name);
    } catch (err) {
      if (err instanceof Error && err.message === "NOT_FOUND") {
        router.push("/dashboard");
        return;
      }
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, reportId, router]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session) {
      router.push("/");
      return;
    }
    loadReport();
  }, [session, sessionStatus, router, loadReport]);

  const handleAnalyze = useCallback(async () => {
    if (!accessToken || !report) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Get combined text from server
      const { combined_text } = await getCombinedText(accessToken, reportId);

      // Analyze with Gemini (via server action)
      const analysisResult = await analyzeText(combined_text);

      if (!analysisResult.success) {
        throw new Error(analysisResult.error);
      }

      // Save result to server
      await saveAnalysisResult(accessToken, reportId, analysisResult.data);

      // Refresh report
      await loadReport();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Шинжилгээ хийхэд алдаа гарлаа",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, [accessToken, report, reportId, loadReport]);

  const handleDeleteStatement = useCallback(
    async (statementId: string) => {
      if (
        !accessToken ||
        !confirm("Энэ хуулгыг устгахдаа итгэлтэй байна уу?")
      ) {
        return;
      }

      try {
        await deleteStatement(accessToken, reportId, statementId);
        await loadReport();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Алдаа гарлаа");
      }
    },
    [accessToken, reportId, loadReport],
  );

  const handleUpdateName = useCallback(async () => {
    if (!accessToken || !editedName.trim()) return;

    try {
      await updateReportGroup(accessToken, reportId, {
        name: editedName.trim(),
      });
      setReport((prev) => (prev ? { ...prev, name: editedName.trim() } : null));
      setIsEditingName(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  }, [accessToken, reportId, editedName]);

  const startEditingName = useCallback(() => {
    setIsEditingName(true);
  }, []);

  const cancelEditingName = useCallback(() => {
    setEditedName(report?.name || "");
    setIsEditingName(false);
  }, [report?.name]);

  return {
    report,
    isLoading: sessionStatus === "loading" || isLoading,
    error,
    isAnalyzing,
    isEditingName,
    editedName,
    setEditedName,
    handleAnalyze,
    handleDeleteStatement,
    handleUpdateName,
    startEditingName,
    cancelEditingName,
    refreshReport: loadReport,
    clearError: () => setError(null),
  };
}
