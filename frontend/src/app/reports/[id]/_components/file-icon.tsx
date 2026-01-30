import { FileText, FileSpreadsheet } from "lucide-react";

interface FileIconProps {
  type: "pdf" | "excel" | "csv";
  size?: "sm" | "md";
}

export function FileIcon({ type, size = "md" }: FileIconProps) {
  const sizeClasses = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  if (type === "pdf") {
    return (
      <div className={`${sizeClasses} rounded bg-red-100 flex items-center justify-center`}>
        <FileText className={`${iconSize} text-red-600`} />
      </div>
    );
  }
  if (type === "excel") {
    return (
      <div className={`${sizeClasses} rounded bg-green-100 flex items-center justify-center`}>
        <FileSpreadsheet className={`${iconSize} text-green-600`} />
      </div>
    );
  }
  return (
    <div className={`${sizeClasses} rounded bg-blue-100 flex items-center justify-center`}>
      <FileText className={`${iconSize} text-blue-600`} />
    </div>
  );
}
