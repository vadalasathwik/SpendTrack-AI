/**
 * Local Web Crypto API (AES-GCM 256-bit) encryption for QR Vault items
 */

const VAULT_KEY_STORAGE_KEY = 'spendtrack_qr_vault_crypto_key';

async function getOrCreateKey(): Promise<CryptoKey> {
  let rawKeyStr = localStorage.getItem(VAULT_KEY_STORAGE_KEY);
  if (!rawKeyStr) {
    const randomArray = new Uint8Array(32);
    window.crypto.getRandomValues(randomArray);
    rawKeyStr = Array.from(randomArray)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    localStorage.setItem(VAULT_KEY_STORAGE_KEY, rawKeyStr);
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(rawKeyStr);
  const hash = await window.crypto.subtle.digest('SHA-256', keyData);

  return window.crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptQRPayload(plainText: string): Promise<string> {
  try {
    const key = await getOrCreateKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(plainText);

    const ciphertext = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    let binary = '';
    for (let i = 0; i < combined.length; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return `ENC_V1:${btoa(binary)}`;
  } catch (err) {
    console.warn('Crypto fallback encoding:', err);
    return `PLAIN:${btoa(encodeURIComponent(plainText))}`;
  }
}

export async function decryptQRPayload(encryptedStr: string): Promise<string> {
  if (!encryptedStr) return '';

  if (encryptedStr.startsWith('PLAIN:')) {
    const base64 = encryptedStr.replace(/^PLAIN:/, '');
    return decodeURIComponent(atob(base64));
  }

  if (!encryptedStr.startsWith('ENC_V1:')) {
    return encryptedStr;
  }

  try {
    const key = await getOrCreateKey();
    const base64 = encryptedStr.replace(/^ENC_V1:/, '');
    const binary = atob(base64);
    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      combined[i] = binary.charCodeAt(i);
    }

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.warn('Failed to decrypt payload:', err);
    return '';
  }
}
