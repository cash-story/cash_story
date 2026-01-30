import { Badge } from "@/components/ui/badge";
import type { ReportGroupListItem } from "@/lib/api/reports";

interface StatusBadgeProps {
  status: ReportGroupListItem["status"];
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "analyzed":
      return (
        <Badge variant="default" className="bg-green-600">
          Шинжилсэн
        </Badge>
      );
    case "draft":
      return <Badge variant="secondary">Ноорог</Badge>;
    case "archived":
      return <Badge variant="outline">Архивлагдсан</Badge>;
  }
}
