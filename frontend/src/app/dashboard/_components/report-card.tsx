"use client";

import { useRouter } from "next/navigation";
import {
  FileText,
  Calendar,
  MoreHorizontal,
  Trash2,
  Eye,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./status-badge";
import type { ReportGroupListItem } from "@/lib/api/reports";

interface ReportCardProps {
  report: ReportGroupListItem;
  onDelete: (id: string) => void;
  onExtend: (id: string) => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ReportCard({ report, onDelete, onExtend }: ReportCardProps) {
  const router = useRouter();

  return (
    <Card
      className="hover:border-primary/50 transition-colors cursor-pointer"
      onClick={() => router.push(`/reports/${report.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate">{report.name}</h3>
              <StatusBadge status={report.status} />
              {report.parent_report_id && (
                <Badge variant="outline" className="text-xs">
                  Өргөтгөсөн
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {report.statement_count} хуулга
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(report.updated_at)}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/reports/${report.id}`);
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Харах
              </DropdownMenuItem>
              {report.status === "analyzed" && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onExtend(report.id);
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Өргөтгөх
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(report.id);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Устгах
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
