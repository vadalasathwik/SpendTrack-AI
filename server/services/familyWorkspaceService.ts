import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface WorkspaceDoc {
  id: string;
  name: string;
  ownerUid: string;
  spreadsheetId: string;
  driveFolderId: string;
  calendarId: string;
  createdAt: string;
}

export interface WorkspaceMemberDoc {
  id: string;
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  workspaceId: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: string;
}

export interface WorkspaceInviteDoc {
  id: string;
  workspaceId: string;
  email: string;
  role: 'editor' | 'viewer';
  token: string;
  invitedByUid: string;
  createdAt: string;
  status: 'pending' | 'accepted';
}

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const WORKSPACES_FILE = path.join(DATA_DIR, 'family_workspaces.json');
const MEMBERS_FILE = path.join(DATA_DIR, 'family_members.json');
const INVITES_FILE = path.join(DATA_DIR, 'family_invites.json');

class FamilyWorkspaceService {
  private workspaces: Map<string, WorkspaceDoc> = new Map();
  private members: Map<string, WorkspaceMemberDoc> = new Map();
  private invites: Map<string, WorkspaceInviteDoc> = new Map();
  private loaded = false;

  private ensureLoaded() {
    if (this.loaded) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(WORKSPACES_FILE)) {
        const raw = JSON.parse(fs.readFileSync(WORKSPACES_FILE, 'utf-8'));
        for (const w of raw) this.workspaces.set(w.id, w);
      }
      if (fs.existsSync(MEMBERS_FILE)) {
        const raw = JSON.parse(fs.readFileSync(MEMBERS_FILE, 'utf-8'));
        for (const m of raw) this.members.set(m.id || `${m.workspaceId}_${m.uid}`, m);
      }
      if (fs.existsSync(INVITES_FILE)) {
        const raw = JSON.parse(fs.readFileSync(INVITES_FILE, 'utf-8'));
        for (const i of raw) this.invites.set(i.id, i);
      }
    } catch (e) {
      console.warn('Family workspace load notice:', e);
    }
    this.loaded = true;
  }

  private saveAll() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(WORKSPACES_FILE, JSON.stringify(Array.from(this.workspaces.values()), null, 2));
      fs.writeFileSync(MEMBERS_FILE, JSON.stringify(Array.from(this.members.values()), null, 2));
      fs.writeFileSync(INVITES_FILE, JSON.stringify(Array.from(this.invites.values()), null, 2));
    } catch (e) {
      console.warn('Family workspace save notice:', e);
    }
  }

  /**
   * Get or Create Workspace for User
   */
  public getOrCreateWorkspace(user: { uid: string; email: string; name?: string; photoURL?: string }, defaultWs: { spreadsheetId: string; driveFolderId: string; calendarId?: string }): { workspace: WorkspaceDoc; role: 'owner' | 'editor' | 'viewer'; members: WorkspaceMemberDoc[] } {
    this.ensureLoaded();

    // Check if user is a member of any workspace
    const memberRecord = Array.from(this.members.values()).find((m) => m.uid === user.uid);
    let workspace: WorkspaceDoc | undefined;

    if (memberRecord) {
      workspace = this.workspaces.get(memberRecord.workspaceId);
    }

    if (!workspace) {
      const wsId = `ws_family_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();

      workspace = {
        id: wsId,
        name: `${user.name || user.email.split('@')[0]}'s Family Workspace`,
        ownerUid: user.uid,
        spreadsheetId: defaultWs.spreadsheetId,
        driveFolderId: defaultWs.driveFolderId,
        calendarId: defaultWs.calendarId || 'primary',
        createdAt: now,
      };

      this.workspaces.set(wsId, workspace);

      const ownerMember: WorkspaceMemberDoc = {
        id: `${wsId}_${user.uid}`,
        uid: user.uid,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        photoURL: user.photoURL,
        workspaceId: wsId,
        role: 'owner',
        joinedAt: now,
      };

      this.members.set(ownerMember.id, ownerMember);
      this.saveAll();
    }

    const currentMember = Array.from(this.members.values()).find((m) => m.workspaceId === workspace!.id && m.uid === user.uid);
    const wsMembers = Array.from(this.members.values()).filter((m) => m.workspaceId === workspace!.id);

    return {
      workspace,
      role: currentMember?.role || 'owner',
      members: wsMembers,
    };
  }

  /**
   * Invite member by email
   */
  public inviteMember(invitedBy: { uid: string; email: string }, email: string, role: 'editor' | 'viewer'): WorkspaceInviteDoc {
    this.ensureLoaded();

    const userWs = this.getOrCreateWorkspace(invitedBy, { spreadsheetId: '', driveFolderId: '' });
    if (userWs.role !== 'owner') {
      throw new Error('Only workspace owners can invite new members.');
    }

    const inviteId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const token = crypto.randomBytes(16).toString('hex');
    const now = new Date().toISOString();

    const invite: WorkspaceInviteDoc = {
      id: inviteId,
      workspaceId: userWs.workspace.id,
      email: email.toLowerCase().trim(),
      role,
      token,
      invitedByUid: invitedBy.uid,
      createdAt: now,
      status: 'pending',
    };

    this.invites.set(inviteId, invite);
    this.saveAll();
    return invite;
  }

  /**
   * Accept invite using token
   */
  public acceptInvite(user: { uid: string; email: string; name?: string; photoURL?: string }, token: string): { workspace: WorkspaceDoc; member: WorkspaceMemberDoc } {
    this.ensureLoaded();

    const invite = Array.from(this.invites.values()).find((i) => i.token === token && i.status === 'pending');
    if (!invite) {
      throw new Error('Invalid or expired invitation token.');
    }

    const workspace = this.workspaces.get(invite.workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found for this invitation.');
    }

    const now = new Date().toISOString();
    const memberId = `${workspace.id}_${user.uid}`;
    const newMember: WorkspaceMemberDoc = {
      id: memberId,
      uid: user.uid,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      photoURL: user.photoURL,
      workspaceId: workspace.id,
      role: invite.role,
      joinedAt: now,
    };

    this.members.set(memberId, newMember);
    invite.status = 'accepted';
    this.saveAll();

    return { workspace, member: newMember };
  }

  /**
   * List members and pending invites for workspace
   */
  public getWorkspaceDetails(uid: string): { workspace: WorkspaceDoc | null; members: WorkspaceMemberDoc[]; invites: WorkspaceInviteDoc[]; currentRole: string } {
    this.ensureLoaded();

    const memberRecord = Array.from(this.members.values()).find((m) => m.uid === uid);
    if (!memberRecord) {
      return { workspace: null, members: [], invites: [], currentRole: 'owner' };
    }

    const workspace = this.workspaces.get(memberRecord.workspaceId) || null;
    const wsMembers = Array.from(this.members.values()).filter((m) => m.workspaceId === memberRecord.workspaceId);
    const wsInvites = Array.from(this.invites.values()).filter((i) => i.workspaceId === memberRecord.workspaceId && i.status === 'pending');

    return {
      workspace,
      members: wsMembers,
      invites: wsInvites,
      currentRole: memberRecord.role,
    };
  }

  /**
   * Remove member or change role
   */
  public removeMember(ownerUid: string, targetUid: string): boolean {
    this.ensureLoaded();

    const ownerMember = Array.from(this.members.values()).find((m) => m.uid === ownerUid);
    if (!ownerMember || ownerMember.role !== 'owner') {
      throw new Error('Only the workspace owner can remove members.');
    }

    const targetMember = Array.from(this.members.values()).find((m) => m.workspaceId === ownerMember.workspaceId && m.uid === targetUid);
    if (targetMember) {
      if (targetMember.role === 'owner') {
        throw new Error('Cannot remove the workspace owner.');
      }
      this.members.delete(targetMember.id);
      this.saveAll();
      return true;
    }

    return false;
  }
}

export const familyWorkspaceService = new FamilyWorkspaceService();
