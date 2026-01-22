import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

export type UploadInput = z.infer<typeof uploadSchema>;
