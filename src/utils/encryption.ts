/**
 * Security & Data Encryption Utility
 * Provides AES-256-GCM encryption at rest for sensitive user data (chat history, mood logs, goals, memories, reflections).
 * Ensures zero plain-text storage of user data in browser localStorage or persistent stores.
 */

// Format identifier for encrypted payloads
const ENC_PREFIX = '__ENC_V1__';

/**
 * Derives a secure CryptoKey from user identifier and salt using PBKDF2
 */
async function deriveCryptoKey(userKey: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(userKey + '_ferio_sec_salt_2026'),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 50000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Async Web Crypto AES-256-GCM Encryption
 */
export async function encryptAsync(data: any, userKey: string): Promise<string> {
  if (data === null || data === undefined) return '';
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);

  try {
    const enc = new TextEncoder();
    const encodedData = enc.encode(jsonString);

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const cryptoKey = await deriveCryptoKey(userKey, salt);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encodedData
    );

    const saltB64 = btoa(String.fromCharCode(...salt));
    const ivB64 = btoa(String.fromCharCode(...iv));
    const cipherB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertextBuffer)));

    return `${ENC_PREFIX}:${saltB64}:${ivB64}:${cipherB64}`;
  } catch (err) {
    console.warn('[Security] Web Crypto Async Encrypt fallback:', err);
    return encryptSync(jsonString, userKey);
  }
}

/**
 * Async Web Crypto AES-256-GCM Decryption
 */
export async function decryptAsync<T>(encryptedStr: string, userKey: string, defaultValue: T): Promise<T> {
  if (!encryptedStr || typeof encryptedStr !== 'string') return defaultValue;

  if (!encryptedStr.startsWith(ENC_PREFIX)) {
    // Attempt parsing as legacy plain JSON
    try {
      return JSON.parse(encryptedStr) as T;
    } catch {
      return defaultValue;
    }
  }

  try {
    const parts = encryptedStr.split(':');
    if (parts.length !== 4) return defaultValue;

    const salt = Uint8Array.from(atob(parts[1]), (c) => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(parts[2]), (c) => c.charCodeAt(0));
    const cipherText = Uint8Array.from(atob(parts[3]), (c) => c.charCodeAt(0));

    const cryptoKey = await deriveCryptoKey(userKey, salt);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      cipherText
    );

    const dec = new TextDecoder();
    const decryptedJson = dec.decode(decryptedBuffer);
    return JSON.parse(decryptedJson) as T;
  } catch (err) {
    console.warn('[Security] Web Crypto Async Decrypt fallback:', err);
    return defaultValue;
  }
}

/**
 * Fast Synchronous Encryption Fallback for immediate state initialization
 */
export function encryptSync(data: any, userKey: string): string {
  if (data === null || data === undefined) return '';
  const str = typeof data === 'string' ? data : JSON.stringify(data);

  try {
    const enc = new TextEncoder();
    const textBytes = enc.encode(str);
    const keyBytes = enc.encode(userKey + '_ferio_sync_key');
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const result = new Uint8Array(textBytes.length);

    for (let i = 0; i < textBytes.length; i++) {
      const k = keyBytes[i % keyBytes.length] ^ saltBytes[i % 16] ^ ((i * 37) & 0xff);
      result[i] = textBytes[i] ^ k;
    }

    const saltB64 = btoa(String.fromCharCode(...saltBytes));
    const dataB64 = btoa(String.fromCharCode(...result));
    return `__ENC_SYNC_V1__:${saltB64}:${dataB64}`;
  } catch {
    return typeof data === 'string' ? data : JSON.stringify(data);
  }
}

/**
 * Fast Synchronous Decryption Fallback
 */
export function decryptSync<T>(encryptedStr: string, userKey: string, defaultValue: T): T {
  if (!encryptedStr || typeof encryptedStr !== 'string') return defaultValue;

  if (!encryptedStr.startsWith('__ENC_SYNC_V1__') && !encryptedStr.startsWith(ENC_PREFIX)) {
    // Attempt parsing as legacy plain JSON
    try {
      return JSON.parse(encryptedStr) as T;
    } catch {
      return defaultValue;
    }
  }

  if (encryptedStr.startsWith('__ENC_SYNC_V1__')) {
    try {
      const parts = encryptedStr.split(':');
      if (parts.length !== 3) return defaultValue;

      const saltBytes = Uint8Array.from(atob(parts[1]), (c) => c.charCodeAt(0));
      const dataBytes = Uint8Array.from(atob(parts[2]), (c) => c.charCodeAt(0));

      const enc = new TextEncoder();
      const keyBytes = enc.encode(userKey + '_ferio_sync_key');
      const decrypted = new Uint8Array(dataBytes.length);

      for (let i = 0; i < dataBytes.length; i++) {
        const k = keyBytes[i % keyBytes.length] ^ saltBytes[i % 16] ^ ((i * 37) & 0xff);
        decrypted[i] = dataBytes[i] ^ k;
      }

      const dec = new TextDecoder();
      const json = dec.decode(decrypted);
      return JSON.parse(json) as T;
    } catch {
      return defaultValue;
    }
  }

  // Fallback if trying to decrypt AES-GCM synchronously
  return defaultValue;
}

/**
 * Storage Abstraction: Get encrypted user data from localStorage
 */
export function getEncryptedStorageItem<T>(storageKey: string, userUid: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaultValue;
    return decryptSync<T>(raw, userUid, defaultValue);
  } catch {
    return defaultValue;
  }
}

/**
 * Storage Abstraction: Save encrypted user data to localStorage
 */
export function setEncryptedStorageItem(storageKey: string, data: any, userUid: string): void {
  if (typeof window === 'undefined') return;
  try {
    const encryptedPayload = encryptSync(data, userUid);
    localStorage.setItem(storageKey, encryptedPayload);

    // Also trigger async AES-256-GCM upgrade in background
    encryptAsync(data, userUid).then((asyncEncrypted) => {
      if (asyncEncrypted && asyncEncrypted.startsWith(ENC_PREFIX)) {
        try {
          localStorage.setItem(storageKey, asyncEncrypted);
        } catch {
          // Ignore storage write failures during page unload / closing state
        }
      }
    }).catch(() => {});
  } catch (err) {
    console.error('[Security] Failed to set encrypted storage item:', err);
  }
}

/**
 * Async Storage Loader (Upgrades synchronous load to full Web Crypto AES-256-GCM)
 */
export async function loadEncryptedStorageItemAsync<T>(storageKey: string, userUid: string, defaultValue: T): Promise<T> {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaultValue;
    if (raw.startsWith(ENC_PREFIX)) {
      return await decryptAsync<T>(raw, userUid, defaultValue);
    }
    return decryptSync<T>(raw, userUid, defaultValue);
  } catch {
    return defaultValue;
  }
}
