/**
 * Client-side encryption utilities using Web Crypto API.
 * Provides AES-256-GCM encryption with PBKDF2 key derivation.
 */

export interface EncryptedData {
  ciphertext: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded IV
}

export interface EncryptionKey {
  key: CryptoKey;
  salt: Uint8Array;
}

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

/**
 * Convert ArrayBuffer or Uint8Array to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Derive an encryption key from a password/PIN using PBKDF2
 *
 * @param password - User's password or PIN
 * @param salt - Salt for key derivation (optional, generates new if not provided)
 * @returns EncryptionKey with derived key and salt
 */
export async function deriveKey(
  password: string,
  salt?: Uint8Array,
): Promise<EncryptionKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Generate or use provided salt
  const keySalt = salt || generateSalt();

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  // Derive AES-GCM key
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: keySalt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  );

  return { key, salt: keySalt };
}

/**
 * Encrypt data using AES-256-GCM
 *
 * @param data - Data to encrypt (string or ArrayBuffer)
 * @param key - CryptoKey for encryption
 * @returns EncryptedData with ciphertext and IV
 */
export async function encryptData(
  data: ArrayBuffer | string,
  key: CryptoKey,
): Promise<EncryptedData> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoder = new TextEncoder();

  const dataBuffer = typeof data === "string" ? encoder.encode(data) : data;

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    dataBuffer,
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
  };
}

/**
 * Decrypt data using AES-256-GCM
 *
 * @param encryptedData - Encrypted data with ciphertext and IV
 * @param key - CryptoKey for decryption
 * @returns Decrypted ArrayBuffer
 */
export async function decryptData(
  encryptedData: EncryptedData,
  key: CryptoKey,
): Promise<ArrayBuffer> {
  const ciphertext = base64ToUint8Array(encryptedData.ciphertext);
  const iv = base64ToUint8Array(encryptedData.iv);

  return await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer,
  );
}

/**
 * Decrypt data and return as string
 *
 * @param encryptedData - Encrypted data with ciphertext and IV
 * @param key - CryptoKey for decryption
 * @returns Decrypted string
 */
export async function decryptDataAsString(
  encryptedData: EncryptedData,
  key: CryptoKey,
): Promise<string> {
  const decrypted = await decryptData(encryptedData, key);
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Create a verification hash for the key
 * Used to verify the key is correct without storing the key itself
 *
 * @param key - CryptoKey to create verification for
 * @returns Base64 encoded verification hash
 */
export async function createVerificationHash(key: CryptoKey): Promise<string> {
  const testData = "verification-test-string";
  const encrypted = await encryptData(testData, key);
  // Use first 32 chars of ciphertext as verification
  return encrypted.ciphertext.substring(0, 32);
}

/**
 * Verify a key by checking if it can produce the expected verification hash
 *
 * @param key - CryptoKey to verify
 * @param expectedHash - Expected verification hash
 * @returns true if key is valid
 */
export async function verifyKey(
  key: CryptoKey,
  expectedHash: string,
): Promise<boolean> {
  try {
    const hash = await createVerificationHash(key);
    return hash === expectedHash;
  } catch {
    return false;
  }
}

// --- Session Storage (IndexedDB) ---

const DB_NAME = "cash-story-encryption";
const STORE_NAME = "keys";
const KEY_ID = "user-encryption-key";

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Store encryption key in session (IndexedDB)
 * Note: CryptoKey cannot be directly stored, so we store key material
 *
 * @param salt - Salt used for key derivation
 */
export async function storeKeyInSession(salt: Uint8Array): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  await new Promise<void>((resolve, reject) => {
    const request = store.put(arrayBufferToBase64(salt), KEY_ID);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });

  db.close();
}

/**
 * Get encryption key salt from session storage
 *
 * @returns Salt if stored, null otherwise
 */
export async function getKeyFromSession(): Promise<Uint8Array | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const result = await new Promise<string | null>((resolve, reject) => {
      const request = store.get(KEY_ID);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    db.close();

    if (result) {
      return base64ToUint8Array(result);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clear encryption key from session storage
 */
export async function clearKeyFromSession(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(KEY_ID);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });

    db.close();
  } catch {
    // Ignore errors when clearing
  }
}

/**
 * Convert salt to Base64 for API transmission
 */
export function saltToBase64(salt: Uint8Array): string {
  return arrayBufferToBase64(salt);
}

/**
 * Convert Base64 to salt
 */
export function base64ToSalt(base64: string): Uint8Array {
  return base64ToUint8Array(base64);
}
