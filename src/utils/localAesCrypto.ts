/**
 * Client-Side Web Crypto API (AES-GCM 256-bit) Encryption / Decryption
 * Secure local data encryption for offline IndexedDB caching.
 */

const KEY_STORAGE_KEY = 'spendtrack_local_aes_raw_key';

// Derive or retrieve persistent CryptoKey for local storage
async function getOrCreateCryptoKey(): Promise<CryptoKey> {
  let rawKeyHex = localStorage.getItem(KEY_STORAGE_KEY);
  if (!rawKeyHex) {
    const randomBytes = new Uint8Array(32);
    window.crypto.getRandomValues(randomBytes);
    rawKeyHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(KEY_STORAGE_KEY, rawKeyHex);
  }

  const match = rawKeyHex.match(/.{1,2}/g);
  const keyBuffer = new Uint8Array(match ? match.map(byte => parseInt(byte, 16)) : new Array(32).fill(0));

  return window.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts an object/string to a Base64-encoded string containing IV + Ciphertext
 */
export async function encryptLocalData<T>(data: T): Promise<string> {
  try {
    const key = await getOrCreateCryptoKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const jsonString = JSON.stringify(data);
    const encodedData = new TextEncoder().encode(jsonString);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encodedData
    );

    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    let binary = '';
    const bytes = combined;
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  } catch (err) {
    console.error('Failed to encrypt local data:', err);
    // Fallback to unencrypted JSON string if Web Crypto fails
    return JSON.stringify(data);
  }
}

/**
 * Decrypts a Base64-encoded string containing IV + Ciphertext back into object T
 */
export async function decryptLocalData<T>(cipherText: string): Promise<T> {
  try {
    if (cipherText.startsWith('{') || cipherText.startsWith('[')) {
      // Unencrypted JSON fallback
      return JSON.parse(cipherText) as T;
    }

    const key = await getOrCreateCryptoKey();
    const binary = window.atob(cipherText);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const iv = bytes.slice(0, 12);
    const dataBuffer = bytes.slice(12);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      dataBuffer
    );

    const decodedString = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decodedString) as T;
  } catch (err) {
    console.error('Failed to decrypt local data:', err);
    try {
      return JSON.parse(cipherText) as T;
    } catch {
      throw new Error('Unable to decrypt cached entity.');
    }
  }
}
