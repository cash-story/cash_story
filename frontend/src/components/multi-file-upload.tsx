"use client";

import { useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  singleFileSchema,
  ACCEPTED_FILE_TYPES,
  formatFileSize,
  getFileType,
} from "@/schemas/upload";
import { cn } from "@/lib/utils";
import { useEncryption } from "@/contexts/encryption-context";
import { encryptData, type EncryptedData } from "@/lib/encryption";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";

interface ProcessedFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
  statementId?: string;
}

interface MultiFileUploadProps {
  reportGroupId: string;
  onUploadComplete?: (statementIds: string[]) => void;
  onFilesChange?: (files: ProcessedFile[]) => void;
}

function FileIcon({ type }: { type: "pdf" | "excel" | "csv" }) {
  if (type === "pdf") {
    return (
      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
        <FileText className="w-5 h-5 text-red-600" />
      </div>
    );
  }
  if (type === "excel") {
    return (
      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
        <FileSpreadsheet className="w-5 h-5 text-green-600" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
      <FileText className="w-5 h-5 text-blue-600" />
    </div>
  );
}

export function MultiFileUpload({
  reportGroupId,
  onUploadComplete,
  onFilesChange,
}: MultiFileUploadProps) {
  const { data: session } = useSession();
  const { encryptionKey } = useEncryption();
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accessToken = (session as any)?.accessToken;

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      setError(null);

      const filesToAdd: ProcessedFile[] = [];

      for (const file of Array.from(newFiles)) {
        // Validate each file
        const result = singleFileSchema.safeParse(file);
        if (!result.success) {
          setError(result.error.issues[0].message);
          continue;
        }

        // Check if file already added
        if (files.some((f) => f.file.name === file.name)) {
          continue;
        }

        filesToAdd.push({
          id: crypto.randomUUID(),
          file,
          status: "pending",
          progress: 0,
        });
      }

      if (filesToAdd.length > 0) {
        const updated = [...files, ...filesToAdd];
        if (updated.length > 10) {
          setError("Хамгийн ихдээ 10 файл оруулах боломжтой");
          return;
        }
        setFiles(updated);
        onFilesChange?.(updated);
      }
    },
    [files, onFilesChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(e.target.files);
      }
      // Reset input so same file can be added again if removed
      e.target.value = "";
    },
    [addFiles],
  );

  const handleRemoveFile = useCallback(
    (id: string) => {
      const updated = files.filter((f) => f.id !== id);
      setFiles(updated);
      onFilesChange?.(updated);
    },
    [files, onFilesChange],
  );

  const uploadFile = async (
    processedFile: ProcessedFile,
  ): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", processedFile.file);

    // If encryption is enabled, encrypt the text after extraction
    // For now, we'll let the server handle extraction and just upload the file
    // The encrypted_text will be added if encryption key is available

    try {
      const response = await fetch(
        `${BACKEND_URL}/report-groups/${reportGroupId}/statements`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Файл байршуулахад алдаа гарлаа");
      }

      const data = await response.json();
      return data.id;
    } catch (err) {
      throw err;
    }
  };

  const handleUploadAll = useCallback(async () => {
    if (!accessToken || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    const pendingFiles = files.filter((f) => f.status === "pending");
    const statementIds: string[] = [];

    for (const pf of pendingFiles) {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === pf.id
            ? { ...f, status: "uploading" as const, progress: 50 }
            : f,
        ),
      );

      try {
        const statementId = await uploadFile(pf);
        if (statementId) {
          statementIds.push(statementId);
        }

        // Update status to done
        setFiles((prev) =>
          prev.map((f) =>
            f.id === pf.id
              ? {
                  ...f,
                  status: "done" as const,
                  progress: 100,
                  statementId: statementId || undefined,
                }
              : f,
          ),
        );
      } catch (err) {
        // Update status to error
        setFiles((prev) =>
          prev.map((f) =>
            f.id === pf.id
              ? {
                  ...f,
                  status: "error" as const,
                  error: err instanceof Error ? err.message : "Алдаа гарлаа",
                }
              : f,
          ),
        );
      }
    }

    setIsUploading(false);

    if (statementIds.length > 0) {
      onUploadComplete?.(statementIds);
    }
  }, [accessToken, files, reportGroupId, onUploadComplete]);

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const completedCount = files.filter((f) => f.status === "done").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Хуулга оруулах</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50",
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleInputChange}
            multiple
            className="hidden"
          />

          <div className="space-y-3">
            <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Файл чирж тавих эсвэл сонгох</p>
              <p className="text-sm text-muted-foreground mt-1">
                PDF, Excel, CSV - файл тус бүр 10MB хүртэл
              </p>
            </div>
            <Button variant="outline" size="sm" type="button">
              <Plus className="w-4 h-4 mr-1" />
              Файл нэмэх
            </Button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((pf) => (
              <div
                key={pf.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileIcon type={getFileType(pf.file.name)} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{pf.file.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatFileSize(pf.file.size)}</span>
                      {pf.status === "done" && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="w-3 h-3" />
                          Амжилттай
                        </span>
                      )}
                      {pf.status === "error" && (
                        <span className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="w-3 h-3" />
                          {pf.error || "Алдаа"}
                        </span>
                      )}
                    </div>
                    {pf.status === "uploading" && (
                      <Progress value={pf.progress} className="h-1 mt-1" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pf.status === "uploading" && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  {pf.status !== "uploading" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFile(pf.id)}
                      className="h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary and upload button */}
        {files.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-muted-foreground">
              {completedCount > 0 && (
                <span className="text-green-600">
                  {completedCount} амжилттай
                </span>
              )}
              {completedCount > 0 &&
                (pendingCount > 0 || errorCount > 0) &&
                " | "}
              {pendingCount > 0 && <span>{pendingCount} хүлээгдэж байна</span>}
              {pendingCount > 0 && errorCount > 0 && " | "}
              {errorCount > 0 && (
                <span className="text-red-600">{errorCount} алдаатай</span>
              )}
            </div>
            <Button
              onClick={handleUploadAll}
              disabled={isUploading || pendingCount === 0}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Байршуулж байна...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Бүгдийг байршуулах
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
