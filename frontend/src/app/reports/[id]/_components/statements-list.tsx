"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileIcon } from "./file-icon";
import { formatFileSize, getFileType } from "@/schemas/upload";
import type { Statement } from "@/lib/api/reports";

interface StatementsListProps {
  statements: Statement[];
  onDeleteStatement: (id: string) => void;
}

export function StatementsList({ statements, onDeleteStatement }: StatementsListProps) {
  if (statements.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Оруулсан хуулгууд</CardTitle>
        <CardDescription>
          {statements.length} хуулга оруулсан
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {statements.map((statement) => (
            <div
              key={statement.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <FileIcon type={getFileType(statement.file_name)} size="sm" />
                <div>
                  <p className="font-medium text-sm">{statement.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {statement.file_size
                      ? formatFileSize(statement.file_size)
                      : ""}
                    {statement.bank_name && ` | ${statement.bank_name}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {statement.status === "error" && (
                  <Badge variant="destructive" className="text-xs">
                    Алдаа
                  </Badge>
                )}
                {statement.status === "extracted" && (
                  <Badge variant="secondary" className="text-xs">
                    Бэлэн
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onDeleteStatement(statement.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
