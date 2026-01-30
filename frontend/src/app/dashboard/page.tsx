"use client";

import { Plus, Loader2, LogIn } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useReports } from "./_hooks";
import { ReportCard, EmptyState } from "./_components";

export default function DashboardPage() {
  const {
    reports,
    isLoading,
    isAuthenticated,
    error,
    isCreating,
    handleCreate,
    handleDelete,
    handleExtend,
  } = useReports();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Нэвтрэх шаардлагатай</h1>
            <p className="text-muted-foreground">
              Тайлан үүсгэх болон харахын тулд эхлээд нэвтэрнэ үү
            </p>
          </div>
          <Button size="lg" onClick={() => signIn("google")}>
            <LogIn className="w-4 h-4 mr-2" />
            Google-ээр нэвтрэх
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Миний тайлангууд</h1>
          <p className="text-muted-foreground mt-1">
            Банкны хуулгын шинжилгээний түүх
          </p>
        </div>
        <Button onClick={handleCreate} disabled={isCreating}>
          {isCreating ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Шинэ тайлан
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {reports.length === 0 ? (
        <EmptyState onCreateReport={handleCreate} isCreating={isCreating} />
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onDelete={handleDelete}
              onExtend={handleExtend}
            />
          ))}
        </div>
      )}
    </div>
  );
}
