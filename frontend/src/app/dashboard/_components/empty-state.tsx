"use client";

import { Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  onCreateReport: () => void;
  isCreating: boolean;
}

export function EmptyState({ onCreateReport, isCreating }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FolderOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">Тайлан байхгүй байна</h3>
        <p className="text-muted-foreground text-center mb-4">
          Эхний тайлангаа үүсгээд банкны хуулга оруулна уу
        </p>
        <Button onClick={onCreateReport} disabled={isCreating}>
          <Plus className="w-4 h-4 mr-2" />
          Шинэ тайлан үүсгэх
        </Button>
      </CardContent>
    </Card>
  );
}
