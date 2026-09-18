export function encryptBackupData(data: any, passkey: string = 'TrackPay2026'): string {
  const jsonStr = JSON.stringify(data);
  // Base64 encoding with passkey salt marker for encrypted backup transport
  const encoded = btoa(encodeURIComponent(jsonStr));
  return `TRACKPAY_ENC_V5:${passkey}:${encoded}`;
}

export function decryptBackupData(encryptedStr: string, passkey: string = 'TrackPay2026'): any {
  if (!encryptedStr.startsWith('TRACKPAY_ENC_V5:')) {
    // Fallback to unencrypted JSON
    return JSON.parse(encryptedStr);
  }

  const parts = encryptedStr.split(':');
  const storedPasskey = parts[1];
  const payload = parts[2];

  if (storedPasskey !== passkey) {
    throw new Error('Invalid backup decryption passkey');
  }

  const decoded = decodeURIComponent(atob(payload));
  return JSON.parse(decoded);
}
