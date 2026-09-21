import QRCode from 'qrcode';

export interface GenerateUPIQROptions {
  upiId: string;
  name: string;
  amount?: number;
  note?: string;
}

/**
 * Format standard UPI payment string according to NPCI specs
 * Example: upi://pay?pa=name@okaxis&pn=John%20Doe&cu=INR
 */
export function formatUPIPaymentString(options: GenerateUPIQROptions): string {
  const cleanUpi = options.upiId.trim();
  const cleanName = options.name.trim();

  const params = new URLSearchParams();
  params.append('pa', cleanUpi);
  params.append('pn', cleanName);
  params.append('cu', 'INR');

  if (options.amount && options.amount > 0) {
    params.append('am', options.amount.toString());
  }

  if (options.note) {
    params.append('tn', options.note.trim());
  }

  return `upi://pay?${params.toString()}`;
}

/**
 * Generate high-contrast PNG Data URL offline using canvas
 */
export async function generateQRCodeDataUrl(textOrUpi: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(textOrUpi, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      width: 400,
      color: {
        dark: '#020617', // Slate 950
        light: '#FFFFFF',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate offline QR code:', err);
    throw new Error('Could not generate QR code image.');
  }
}
