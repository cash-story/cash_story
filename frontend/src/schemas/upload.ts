import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total

const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.ms-excel", // xls
  "text/csv",
  "application/csv",
];

const ACCEPTED_EXTENSIONS = [".pdf", ".xlsx", ".xls", ".csv"];

function getFileExtension(filename: string): string {
  return "." + filename.split(".").pop()?.toLowerCase();
}

function isValidFileType(file: File): boolean {
  const ext = getFileExtension(file.name);
  return (
    ACCEPTED_EXTENSIONS.includes(ext) || ACCEPTED_MIME_TYPES.includes(file.type)
  );
}

// Single file schema (for legacy support)
export const uploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: "Файлын хэмжээ 10MB-с хэтрэхгүй байх ёстой",
    })
    .refine((file) => file.type === "application/pdf", {
      message: "Зөвхөн PDF файл зөвшөөрөгдөнө",
    }),
});

// Single file schema for multi-format
export const singleFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: "Файлын хэмжээ 10MB-с хэтрэхгүй байх ёстой",
  })
  .refine((file) => isValidFileType(file), {
    message: "PDF, Excel, CSV файл зөвшөөрөгдөнө",
  });

// Multi-file schema
export const multiFileSchema = z.object({
  files: z
    .array(singleFileSchema)
    .min(1, "Дор хаяж нэг файл сонгоно уу")
    .max(10, "Хамгийн ихдээ 10 файл оруулах боломжтой")
    .refine(
      (files) => files.reduce((sum, f) => sum + f.size, 0) <= MAX_TOTAL_SIZE,
      { message: "Нийт файлын хэмжээ 50MB-с хэтрэхгүй байх ёстой" },
    ),
});

export type UploadInput = z.infer<typeof uploadSchema>;
export type MultiFileInput = z.infer<typeof multiFileSchema>;

// Helper to get accepted file types string for input element
export const ACCEPTED_FILE_TYPES = ACCEPTED_EXTENSIONS.join(",");

// Helper to format file size
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// Helper to get file icon type based on extension
export function getFileType(filename: string): "pdf" | "excel" | "csv" {
  const ext = getFileExtension(filename).toLowerCase();
  if (ext === ".pdf") return "pdf";
  if (ext === ".xlsx" || ext === ".xls") return "excel";
  return "csv";
}
