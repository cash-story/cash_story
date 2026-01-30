"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ReportHeaderProps {
  name: string;
  status: "draft" | "analyzed" | "archived";
  parentReportId: string | null;
  isEditingName: boolean;
  editedName: string;
  onEditedNameChange: (name: string) => void;
  onStartEditing: () => void;
  onSaveName: () => void;
  onCancelEditing: () => void;
}

export function ReportHeader({
  name,
  status,
  parentReportId,
  isEditingName,
  editedName,
  onEditedNameChange,
  onStartEditing,
  onSaveName,
  onCancelEditing,
}: ReportHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-4 mb-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push("/dashboard")}
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <div className="flex-1">
        {isEditingName ? (
          <div className="flex items-center gap-2">
            <Input
              value={editedName}
              onChange={(e) => onEditedNameChange(e.target.value)}
              className="max-w-xs"
              autoFocus
            />
            <Button size="icon" variant="ghost" onClick={onSaveName}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onCancelEditing}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{name}</h1>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={onStartEditing}
            >
              <Edit2 className="w-3 h-3" />
            </Button>
            {status === "analyzed" && (
              <Badge className="bg-green-600">Шинжилсэн</Badge>
            )}
            {parentReportId && <Badge variant="outline">Өргөтгөсөн</Badge>}
          </div>
        )}
      </div>
    </div>
  );
}
