"use client";

import { useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { analyzePdf } from "@/actions/analyze-pdf";
import type { ActionState } from "@/types";
import { cn } from "@/lib/utils";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";

interface PdfUploadProps {
  onAnalysisComplete: (result: ActionState) => void;
}

export function PdfUpload({ onAnalysisComplete }: PdfUploadProps) {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save analysis to backend
  const saveAnalysis = useCallback(
    async (fileName: string, result: Record<string, unknown>) => {
      if (!session?.accessToken) return;

      try {
        await fetch(`${BACKEND_URL}/analyses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({
            file_name: fileName,
            bank_name:
              (result as { overview?: { bankName?: string } }).overview
                ?.bankName || null,
            result: result,
          }),
        });
      } catch (err) {
        console.error("Failed to save analysis:", err);
      }
    },
    [session],
  );

  const handleFile = useCallback((selectedFile: File) => {
    setError(null);

    // Client-side validation
    if (selectedFile.type !== "application/pdf") {
      setError("Зөвхөн PDF файл зөвшөөрөгдөнө");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Файлын хэмжээ 10MB-с хэтрэхгүй байх ёстой");
      return;
    }

    setFile(selectedFile);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFile(droppedFile);
      }
    },
    [handleFile],
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
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFile(selectedFile);
      }
    },
    [handleFile],
  );

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await analyzePdf(formData);

      if (!result.success) {
        setError(result.error || "Алдаа гарлаа");
      } else {
        // Save to backend
        if (result.data) {
          await saveAnalysis(file.name, result.data as Record<string, unknown>);
        }
        onAnalysisComplete(result);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch {
      setError("Алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setIsLoading(false);
    }
  }, [file, onAnalysisComplete, saveAnalysis]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !file && fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50",
              file && "cursor-default",
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleInputChange}
              className="hidden"
            />

            {!file ? (
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium">
                    PDF файл чирж тавих эсвэл сонгох
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Хамгийн ихдээ 10MB хэмжээтэй PDF файл
                  </p>
                </div>
                <Button variant="outline" type="button">
                  Файл сонгох
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium truncate max-w-[200px] sm:max-w-[300px]">
                      {file.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  disabled={isLoading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit button */}
          {file && (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full mt-4"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Шинжилж байна...
                </>
              ) : (
                "Шинжилгээ хийх"
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {isLoading && (
        <Alert>
          <AlertDescription>
            Таны банкны хуулгыг AI ашиглан шинжилж байна. Энэ хэдэн секунд
            үргэлжилж болно...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
