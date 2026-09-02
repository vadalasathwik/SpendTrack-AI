import { DriveStorageRepository } from '../services/interfaces.js';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

export class GoogleDriveService implements DriveStorageRepository {
  private async fetchWithAuth(url: string, token: string, options: RequestInit = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = `Google Drive API Error (${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        msg = parsed.error?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    return res.json();
  }

  /**
   * Find or create folder in Drive
   */
  private async findOrCreateFolder(token: string, folderName: string, parentId?: string): Promise<string> {
    let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }

    const searchUrl = `${DRIVE_API}/files?q=${encodeURIComponent(query)}&spaces=drive&fields=files(id,name)`;
    const searchRes = await this.fetchWithAuth(searchUrl, token);

    if (searchRes.files && searchRes.files.length > 0) {
      return searchRes.files[0].id;
    }

    // Create folder
    const createUrl = `${DRIVE_API}/files`;
    const body: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentId) {
      body.parents = [parentId];
    }

    const createRes = await this.fetchWithAuth(createUrl, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return createRes.id;
  }

  /**
   * Ensures SpendTrack directory structure exists:
   * SpendTrack/
   *   ├── Receipts/
   *   ├── Exports/
   *   └── Backups/
   */
  async ensureFolders(token: string) {
    const rootFolderId = await this.findOrCreateFolder(token, 'SpendTrack');
    const receiptsFolderId = await this.findOrCreateFolder(token, 'Receipts', rootFolderId);
    const exportsFolderId = await this.findOrCreateFolder(token, 'Exports', rootFolderId);
    const backupsFolderId = await this.findOrCreateFolder(token, 'Backups', rootFolderId);

    return {
      rootFolderId,
      receiptsFolderId,
      exportsFolderId,
      backupsFolderId,
    };
  }

  /**
   * Upload receipt file into SpendTrack/Receipts folder
   */
  async uploadReceipt(token: string, file: { name: string; type: string; base64Data: string }) {
    const { receiptsFolderId } = await this.ensureFolders(token);

    // Prepare multipart upload
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: `Receipt_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
      parents: [receiptsFolderId],
      mimeType: file.type || 'image/jpeg',
    };

    const cleanBase64 = file.base64Data.replace(/^data:[^;]+;base64,/, '');
    const binaryData = Buffer.from(cleanBase64, 'base64');

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${file.type || 'image/jpeg'}\r\n` +
      'Content-Transfer-Encoding: base64\r\n\r\n' +
      binaryData.toString('base64') +
      closeDelimiter;

    const uploadUrl = `${UPLOAD_API}/files?uploadType=multipart&fields=id,name,webViewLink,thumbnailLink`;

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = `Failed to upload receipt to Google Drive (${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        msg = parsed.error?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    const data = await res.json();
    return {
      fileId: data.id,
      fileName: data.name,
      webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
    };
  }

  /**
   * Retrieves receipt file metadata
   */
  async getReceiptFile(token: string, fileId: string) {
    const url = `${DRIVE_API}/files/${fileId}?fields=id,name,mimeType,webViewLink,thumbnailLink,webContentLink`;
    const data = await this.fetchWithAuth(url, token);
    return {
      fileId: data.id,
      name: data.name,
      mimeType: data.mimeType,
      webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
      thumbnailLink: data.thumbnailLink,
    };
  }
}
