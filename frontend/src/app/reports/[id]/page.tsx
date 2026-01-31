"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MultiFileUpload } from "@/components/multi-file-upload";
import { FinancialGuide } from "@/components/financial-guide";
import { TransactionReview } from "@/components/transactions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReport } from "./_hooks";
import { ReportHeader, StatementsList, AnalyzeButton } from "./_components";

export default function ReportPage() {
  const params = useParams();
  const reportId = params.id as string;
  const [activeStatementId, setActiveStatementId] = useState<string | null>(
    null,
  );

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

  // Set first statement as active if not set
  if (!activeStatementId && extractedStatements.length > 0) {
    setActiveStatementId(extractedStatements[0].id);
  }

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

      {report.status !== "analyzed" && (
        <>
          <StatementsList
            statements={report.statements}
            onDeleteStatement={handleDeleteStatement}
          />

          <MultiFileUpload
            reportGroupId={reportId}
            onUploadComplete={refreshReport}
          />

          {/* Transaction Review Section */}
          {extractedStatements.length > 0 && (
            <div className="mt-6 mb-6">
              <h3 className="text-lg font-semibold mb-3">Гүйлгээ ангилах</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Хуулга бүрээс гүйлгээнүүдийг AI-гаар задалж, категори оноох
                боломжтой. Энэ нь илүү дэлгэрэнгүй тайлан гаргахад тусална.
              </p>

              {extractedStatements.length === 1 ? (
                <TransactionReview
                  statementId={extractedStatements[0].id}
                  reportGroupId={reportId}
                />
              ) : (
                <Tabs
                  value={activeStatementId || extractedStatements[0]?.id}
                  onValueChange={setActiveStatementId}
                >
                  <TabsList className="mb-4 flex-wrap h-auto">
                    {extractedStatements.map((stmt, idx) => (
                      <TabsTrigger
                        key={stmt.id}
                        value={stmt.id}
                        className="text-xs sm:text-sm"
                      >
                        {stmt.bank_name || `Хуулга ${idx + 1}`}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {extractedStatements.map((stmt) => (
                    <TabsContent key={stmt.id} value={stmt.id}>
                      <TransactionReview
                        statementId={stmt.id}
                        reportGroupId={reportId}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </div>
          )}

          <AnalyzeButton
            extractedCount={extractedStatements.length}
            isAnalyzing={isAnalyzing}
            onAnalyze={handleAnalyze}
          />
        </>
      )}

      {report.status === "analyzed" && (
        <StatementsList
          statements={report.statements}
          onDeleteStatement={handleDeleteStatement}
        />
      )}
    </div>
  );
}
