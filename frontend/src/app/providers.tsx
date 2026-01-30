"use client";

import { SessionProvider } from "next-auth/react";
import { EncryptionProvider } from "@/contexts/encryption-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <EncryptionProvider>{children}</EncryptionProvider>
    </SessionProvider>
  );
}
