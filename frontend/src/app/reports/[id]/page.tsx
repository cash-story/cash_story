"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MultiFileUpload } from "@/components/multi-file-upload";
import { FinancialGuide } from "@/components/financial-guide";
import { useReport } from "./_hooks";
import { ReportHeader, StatementsList, AnalyzeButton } from "./_components";

export default function ReportPage() {
  const params = useParams();
  const reportId = params.id as string;

  const {
    report,
    isLoading,
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
    refreshReport,
  } = useReport(reportId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const extractedStatements = report.statements.filter(
    (s) => s.status === "extracted",
  );

  return (
    <div>
      <ReportHeader
        name={report.name}
        status={report.status}
        parentReportId={report.parent_report_id}
        isEditingName={isEditingName}
        editedName={editedName}
        onEditedNameChange={setEditedName}
        onStartEditing={startEditingName}
        onSaveName={handleUpdateName}
        onCancelEditing={cancelEditingName}
      />

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {report.combined_result && (
        <div className="mb-8">
          <FinancialGuide report={report.combined_result} />
        </div>
      )}

      <StatementsList
        statements={report.statements}
        onDeleteStatement={handleDeleteStatement}
      />

      {report.status !== "analyzed" && (
        <>
          <MultiFileUpload
            reportGroupId={reportId}
            onUploadComplete={refreshReport}
          />

          <AnalyzeButton
            extractedCount={extractedStatements.length}
            isAnalyzing={isAnalyzing}
            onAnalyze={handleAnalyze}
          />
        </>
      )}
    </div>
  );
}
