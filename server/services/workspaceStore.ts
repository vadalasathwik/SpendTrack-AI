import fs from 'fs';
import path from 'path';

export interface UserWorkspaceRecord {
  uid: string;
  email: string;
  spreadsheetId: string;
  driveFolderId: string;
  calendarId: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const WORKSPACE_FILE = path.join(DATA_DIR, 'workspaces.json');

class WorkspaceStore {
  private cache: Map<string, UserWorkspaceRecord> = new Map();
  private isLoaded = false;

  private ensureLoaded() {
    if (this.isLoaded) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(WORKSPACE_FILE)) {
        const raw = fs.readFileSync(WORKSPACE_FILE, 'utf-8');
        const list: UserWorkspaceRecord[] = JSON.parse(raw);
        for (const item of list) {
          this.cache.set(item.uid, item);
        }
      }
    } catch (e) {
      console.warn('Workspace store load notice:', e);
    }
    this.isLoaded = true;
  }

  private saveToFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const list = Array.from(this.cache.values());
      fs.writeFileSync(WORKSPACE_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Workspace store save notice:', e);
    }
  }

  getWorkspace(uid: string): UserWorkspaceRecord | null {
    this.ensureLoaded();
    return this.cache.get(uid) || null;
  }

  saveWorkspace(record: Omit<UserWorkspaceRecord, 'createdAt' | 'updatedAt'>): UserWorkspaceRecord {
    this.ensureLoaded();
    const existing = this.cache.get(record.uid);
    const now = new Date().toISOString();

    const fullRecord: UserWorkspaceRecord = {
      ...record,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    this.cache.set(record.uid, fullRecord);
    this.saveToFile();
    return fullRecord;
  }
}

export const workspaceStore = new WorkspaceStore();
