"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  fetchReportGroups,
  createReportGroup,
  deleteReportGroup,
  extendReportGroup,
  type ReportGroupListItem,
} from "@/lib/api/reports";

export function useReports() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<ReportGroupListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const accessToken = (session as any)?.accessToken;
  const isAuthenticated = !!session;

  const loadReports = useCallback(async () => {
    if (!accessToken) return;

    try {
      const data = await fetchReportGroups(accessToken);
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session) {
      setIsLoading(false);
      return;
    }
    loadReports();
  }, [session, sessionStatus, loadReports]);

  const handleCreate = useCallback(async () => {
    if (!accessToken) return;

    setIsCreating(true);
    setError(null);
    try {
      const name = `Тайлан ${new Date().toLocaleDateString("mn-MN")}`;
      const data = await createReportGroup(accessToken, name);
      router.push(`/reports/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setIsCreating(false);
    }
  }, [accessToken, router]);

  const handleDelete = useCallback(
    async (reportId: string) => {
      if (
        !accessToken ||
        !confirm("Энэ тайланг устгахдаа итгэлтэй байна уу?")
      ) {
        return;
      }

      setError(null);
      try {
        await deleteReportGroup(accessToken, reportId);
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Алдаа гарлаа");
      }
    },
    [accessToken],
  );

  const handleExtend = useCallback(
    async (reportId: string) => {
      if (!accessToken) return;

      setError(null);
      try {
        const data = await extendReportGroup(accessToken, reportId);
        router.push(`/reports/${data.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Алдаа гарлаа");
      }
    },
    [accessToken, router],
  );

  return {
    reports,
    isLoading: sessionStatus === "loading" || isLoading,
    isAuthenticated,
    error,
    isCreating,
    handleCreate,
    handleDelete,
    handleExtend,
    clearError: () => setError(null),
  };
}
