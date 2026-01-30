"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import {
  deriveKey,
  storeKeyInSession,
  getKeyFromSession,
  clearKeyFromSession,
  createVerificationHash,
  saltToBase64,
  base64ToSalt,
  type EncryptionKey,
} from "@/lib/encryption";

interface EncryptionContextType {
  encryptionKey: CryptoKey | null;
  isKeySet: boolean;
  isLoading: boolean;
  hasServerKey: boolean;
  setupKey: (password: string) => Promise<boolean>;
  unlockKey: (password: string) => Promise<boolean>;
  lockKey: () => Promise<void>;
  checkServerKey: () => Promise<void>;
}

const EncryptionContext = createContext<EncryptionContextType | null>(null);

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";

export function EncryptionProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasServerKey, setHasServerKey] = useState(false);
  const [serverSalt, setServerSalt] = useState<string | null>(null);

  const accessToken = (session as any)?.accessToken;

  // Check if user has encryption key on server
  const checkServerKey = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/users/encryption-key`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHasServerKey(data.has_key);
        if (data.salt) {
          setServerSalt(data.salt);
        }
      }
    } catch (error) {
      console.error("Failed to check server key:", error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  // Try to restore key from session on mount
  useEffect(() => {
    async function restoreKey() {
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      // First check if we have a key in session storage
      const storedSalt = await getKeyFromSession();
      if (storedSalt && serverSalt) {
        // We have local salt but need password to derive key
        // User will need to unlock
        setIsLoading(false);
        return;
      }

      // Check server for key info
      await checkServerKey();
    }

    restoreKey();
  }, [accessToken, serverSalt, checkServerKey]);

  // Setup new encryption key (first time)
  const setupKey = useCallback(
    async (password: string): Promise<boolean> => {
      if (!accessToken) return false;

      try {
        setIsLoading(true);

        // Derive key with new salt
        const { key, salt } = await deriveKey(password);

        // Create verification hash
        const verificationHash = await createVerificationHash(key);

        // Store salt on server
        const response = await fetch(`${BACKEND_URL}/users/encryption-key`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            salt: saltToBase64(salt),
            verification_hash: verificationHash,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save key to server");
        }

        // Store salt in session
        await storeKeyInSession(salt);

        // Set key in context
        setEncryptionKey(key);
        setHasServerKey(true);
        setServerSalt(saltToBase64(salt));

        return true;
      } catch (error) {
        console.error("Failed to setup key:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken]
  );

  // Unlock existing key
  const unlockKey = useCallback(
    async (password: string): Promise<boolean> => {
      if (!accessToken || !serverSalt) return false;

      try {
        setIsLoading(true);

        // Derive key with server salt
        const salt = base64ToSalt(serverSalt);
        const { key } = await deriveKey(password, salt);

        // Store salt in session for future use
        await storeKeyInSession(salt);

        // Set key in context
        setEncryptionKey(key);

        return true;
      } catch (error) {
        console.error("Failed to unlock key:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, serverSalt]
  );

  // Lock key (clear from memory)
  const lockKey = useCallback(async (): Promise<void> => {
    setEncryptionKey(null);
    await clearKeyFromSession();
  }, []);

  const value: EncryptionContextType = {
    encryptionKey,
    isKeySet: encryptionKey !== null,
    isLoading,
    hasServerKey,
    setupKey,
    unlockKey,
    lockKey,
    checkServerKey,
  };

  return (
    <EncryptionContext.Provider value={value}>
      {children}
    </EncryptionContext.Provider>
  );
}

export function useEncryption(): EncryptionContextType {
  const context = useContext(EncryptionContext);
  if (!context) {
    throw new Error("useEncryption must be used within EncryptionProvider");
  }
  return context;
}
