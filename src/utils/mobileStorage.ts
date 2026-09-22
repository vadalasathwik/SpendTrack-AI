import { SpendTrackApi } from '../services/api.js';
import { QRVaultStore } from '../services/qrVaultStore.js';
import { getCachedItems, saveAllCachedItems } from '../services/offlineStore.js';

function triggerFileDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

function getFormattedTimestamp(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

/**
 * Export all receipts stored in system to a downloadable JSON backup.
 */
export async function exportReceiptsJSON(): Promise<void> {
  try {
    const receipts = await SpendTrackApi.getReceipts();
    const jsonStr = JSON.stringify(receipts, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    triggerFileDownload(blob, `SpendTrack_Receipts_Backup_${getFormattedTimestamp()}.json`);
  } catch (err) {
    console.error('Failed to export receipts JSON:', err);
    throw err;
  }
}

/**
 * Export encrypted QR Vault stored in IndexedDB/Storage to a downloadable JSON backup.
 */
export async function exportQRVaultJSON(): Promise<void> {
  try {
    const qrs = await QRVaultStore.getAllQRCodes();
    const jsonStr = JSON.stringify(qrs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    triggerFileDownload(blob, `SpendTrack_QR_Vault_Backup_${getFormattedTimestamp()}.json`);
  } catch (err) {
    console.error('Failed to export QR Vault JSON:', err);
    throw err;
  }
}

/**
 * Export expenses database to a CSV spreadsheet.
 */
export async function exportExpensesCSV(expensesData?: any[]): Promise<void> {
  try {
    let data = expensesData;
    if (!data || data.length === 0) {
      data = await getCachedItems('expenses');
    }
    if (!data || data.length === 0) {
      const resp = await SpendTrackApi.getExpenses();
      data = resp || [];
    }

    const headers = ['ID', 'Date', 'Category', 'Description', 'Amount', 'Currency', 'PaymentMethod', 'Merchant'];
    const rows = (data || []).map((exp: any) => [
      `"${exp.id || ''}"`,
      `"${exp.date || ''}"`,
      `"${(exp.category || '').replace(/"/g, '""')}"`,
      `"${(exp.description || '').replace(/"/g, '""')}"`,
      exp.amount || 0,
      `"${exp.currency || 'INR'}"`,
      `"${(exp.paymentMethod || '').replace(/"/g, '""')}"`,
      `"${(exp.merchant || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerFileDownload(blob, `SpendTrack_Expenses_${getFormattedTimestamp()}.csv`);
  } catch (err) {
    console.error('Failed to export expenses CSV:', err);
    throw err;
  }
}

/**
 * Save HTML/PDF blob directly into device Downloads folder.
 */
export function savePDFToDownloads(blob: Blob, fileName: string): void {
  triggerFileDownload(blob, fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
}

/**
 * Import and restore complete JSON backup into offline device storage.
 */
export async function importBackupJSON(file: File): Promise<{ success: boolean; itemCount: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) throw new Error('File content is empty');

        const parsed = JSON.parse(text);
        let itemCount = 0;

        if (Array.isArray(parsed)) {
          // If it's an array of receipts or expenses
          if (parsed.length > 0 && parsed[0].merchant) {
            // Receipts array
            for (const item of parsed) {
              await saveAllCachedItems('expenses', [item]);
              itemCount++;
            }
          } else if (parsed.length > 0 && (parsed[0].amount !== undefined || parsed[0].title)) {
            // Expenses or QR codes array
            for (const item of parsed) {
              if (item.qrCodeData || item.upiId) {
                await QRVaultStore.saveQRCode(item);
              } else {
                await saveAllCachedItems('expenses', [item]);
              }
              itemCount++;
            }
          }
        } else if (typeof parsed === 'object') {
          // Full backup object containing multiple stores
          if (parsed.expenses && Array.isArray(parsed.expenses)) {
            await saveAllCachedItems('expenses', parsed.expenses);
            itemCount += parsed.expenses.length;
          }
          if (parsed.qrCodes && Array.isArray(parsed.qrCodes)) {
            for (const qr of parsed.qrCodes) {
              await QRVaultStore.saveQRCode(qr);
            }
            itemCount += parsed.qrCodes.length;
          }
        }

        resolve({ success: true, itemCount });
      } catch (err) {
        console.error('Failed to parse and import backup file:', err);
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}
