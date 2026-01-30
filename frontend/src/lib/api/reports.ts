/**
 * API functions for report groups and statements
 */

import type { FinancialGuideReport } from "@/types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";

// --- Types ---

export interface Statement {
  id: string;
  file_name: string;
  file_format: string;
  file_size: number | null;
  bank_name: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface ReportGroup {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "analyzed" | "archived";
  combined_result: FinancialGuideReport | null;
  statements: Statement[];
  parent_report_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportGroupListItem {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "analyzed" | "archived";
  statement_count: number;
  parent_report_id: string | null;
  created_at: string;
  updated_at: string;
}

// --- API Functions ---

export async function fetchReportGroups(
  accessToken: string
): Promise<ReportGroupListItem[]> {
  const response = await fetch(`${BACKEND_URL}/report-groups`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Тайлангуудыг татахад алдаа гарлаа");
  }

  return response.json();
}

export async function fetchReportGroup(
  accessToken: string,
  reportId: string
): Promise<ReportGroup> {
  const response = await fetch(`${BACKEND_URL}/report-groups/${reportId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("NOT_FOUND");
    }
    throw new Error("Тайлан татахад алдаа гарлаа");
  }

  return response.json();
}

export async function createReportGroup(
  accessToken: string,
  name: string,
  description?: string | null
): Promise<ReportGroup> {
  const response = await fetch(`${BACKEND_URL}/report-groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name, description: description ?? null }),
  });

  if (!response.ok) {
    throw new Error("Тайлан үүсгэхэд алдаа гарлаа");
  }

  return response.json();
}

export async function updateReportGroup(
  accessToken: string,
  reportId: string,
  data: { name?: string; description?: string; status?: string }
): Promise<ReportGroup> {
  const response = await fetch(`${BACKEND_URL}/report-groups/${reportId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Тайлан шинэчлэхэд алдаа гарлаа");
  }

  return response.json();
}

export async function deleteReportGroup(
  accessToken: string,
  reportId: string
): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/report-groups/${reportId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Тайлан устгахад алдаа гарлаа");
  }
}

export async function extendReportGroup(
  accessToken: string,
  reportId: string
): Promise<ReportGroup> {
  const response = await fetch(
    `${BACKEND_URL}/report-groups/${reportId}/extend`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Тайлан өргөтгөхөд алдаа гарлаа");
  }

  return response.json();
}

export async function deleteStatement(
  accessToken: string,
  reportId: string,
  statementId: string
): Promise<void> {
  const response = await fetch(
    `${BACKEND_URL}/report-groups/${reportId}/statements/${statementId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Хуулга устгахад алдаа гарлаа");
  }
}

export async function getCombinedText(
  accessToken: string,
  reportId: string
): Promise<{ combined_text: string; statement_count: number; report_name: string }> {
  const response = await fetch(
    `${BACKEND_URL}/report-groups/${reportId}/analyze`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Нэгтгэхэд алдаа гарлаа");
  }

  return response.json();
}

export async function saveAnalysisResult(
  accessToken: string,
  reportId: string,
  result: FinancialGuideReport
): Promise<void> {
  const response = await fetch(
    `${BACKEND_URL}/report-groups/${reportId}/save-result`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(result),
    }
  );

  if (!response.ok) {
    throw new Error("Үр дүн хадгалахад алдаа гарлаа");
  }
}
