import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Crown,
  Edit3,
  Eye,
  Trash2,
  CheckCircle2,
  Mail,
  Copy,
  AlertCircle,
  HardDrive,
  FileSpreadsheet,
  Calendar,
  Sparkles,
  Loader2,
  Clock,
} from 'lucide-react';
import { useUser } from '../context/UserContext.js';
import { SpendTrackApi } from '../services/api.js';
import { BRAND_NAME } from '../constants/brand.js';

interface MemberItem {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: string;
}

interface InviteItem {
  id: string;
  email: string;
  role: 'editor' | 'viewer';
  token: string;
  createdAt: string;
  status: string;
}

export const FamilyWorkspacePage: React.FC = () => {
  const { user, workspace } = useUser();
  const [loading, setLoading] = useState(true);
  const [workspaceData, setWorkspaceData] = useState<any>(null);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [currentRole, setCurrentRole] = useState<string>('owner');

  // Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [isInviting, setIsInviting] = useState(false);
  const [acceptTokenInput, setAcceptTokenInput] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchWorkspaceMembers = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await SpendTrackApi.getWorkspaceMembers();
      setWorkspaceData(res.workspace);
      setMembers(res.members || []);
      setInvites(res.invites || []);
      setCurrentRole(res.currentRole || 'owner');
    } catch (err: any) {
      console.warn('Workspace members fetch notice:', err);
      setErrorMessage(err.message || 'Failed to load workspace members.');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceMembers();
  }, []);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsInviting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const inv = await SpendTrackApi.inviteWorkspaceMember(inviteEmail, inviteRole);
      setSuccessMessage(`Invitation created for ${inviteEmail}! Token: ${inv.token}`);
      setInviteEmail('');
      fetchWorkspaceMembers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send workspace invitation.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTokenInput) return;

    setIsAccepting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await SpendTrackApi.acceptWorkspaceInvite(acceptTokenInput);
      setSuccessMessage('Successfully joined family workspace!');
      setAcceptTokenInput('');
      fetchWorkspaceMembers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to accept invitation token.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRemoveMember = async (targetUid: string) => {
    if (!window.confirm('Are you sure you want to remove this member from your workspace?')) {
      return;
    }

    setErrorMessage(null);
    try {
      await SpendTrackApi.removeWorkspaceMember(targetUid);
      setSuccessMessage('Member removed successfully.');
      fetchWorkspaceMembers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove member.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage('Invite token copied to clipboard!');
  };

  const isOwner = currentRole === 'owner';

  return (
    <div className="space-y-6 pb-12" id="family-workspace-container">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>Collaborative Household Finance Platform</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Family Workspace & Member Roles
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
              Share one Google Sheet, Drive receipt repository, and Calendar across your household.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Role: {currentRole.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Alert Notifications */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-xs text-emerald-700 underline font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-xs text-rose-700 underline font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Grid Row 1: Workspace Profile Card & Accept Invite Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Workspace Profile Summary */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Workspace Details</span>
            </h2>
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Shared Household Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Google Sheet</span>
                <p className="text-xs font-extrabold text-slate-800 truncate">
                  {workspace?.spreadsheetId ? 'Connected' : `${BRAND_NAME} DB`}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Drive Receipts</span>
                <p className="text-xs font-extrabold text-slate-800 truncate">
                  {BRAND_NAME}/Receipts
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Google Calendar</span>
                <p className="text-xs font-extrabold text-slate-800 truncate">
                  Bill Reminders
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            All family members operate against the exact same Google Sheet database and Drive repository without duplicating resources.
          </p>
        </div>

        {/* Accept Invitation Token Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Join Family Workspace</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-3">
              Received an invite token from another member? Enter it here to join.
            </p>

            <form onSubmit={handleAcceptInvite} className="space-y-3">
              <input
                type="text"
                value={acceptTokenInput}
                onChange={(e) => setAcceptTokenInput(e.target.value)}
                placeholder="Enter invite token..."
                className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isAccepting || !acceptTokenInput}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {isAccepting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Accept & Join Workspace</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Invite Member Section (Owner only) */}
      {isOwner && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              <span>Invite Family Member</span>
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Owner Permission</span>
          </div>

          <form onSubmit={handleSendInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter family member's email address..."
                className="w-full px-4 py-2.5 text-xs sm:text-sm font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="px-3 py-2.5 text-xs sm:text-sm font-extrabold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="editor">Editor (Add/Edit Expenses)</option>
                <option value="viewer">Viewer (Read Only)</option>
              </select>

              <button
                type="submit"
                disabled={isInviting || !inviteEmail}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-75"
              >
                {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>Send Invite</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid Row 2: Members List & Pending Invitations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Members List */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Workspace Members ({members.length})</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400">Avatars & Online Status</span>
          </div>

          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.uid}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:border-emerald-300 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar & Online Dot */}
                  <div className="relative shrink-0">
                    {member.photoURL ? (
                      <img
                        src={member.photoURL}
                        alt={member.name}
                        className="w-11 h-11 rounded-2xl object-cover ring-2 ring-emerald-500/20"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                        {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                      </div>
                    )}
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white absolute -bottom-0.5 -right-0.5 shadow-2xs" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">{member.name}</h4>
                      {member.role === 'owner' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                          <Crown className="w-3 h-3 text-amber-600" />
                          Owner
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium truncate">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-bold capitalize border ${
                      member.role === 'owner'
                        ? 'bg-amber-50 text-amber-900 border-amber-200'
                        : member.role === 'editor'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {member.role}
                  </span>

                  {isOwner && member.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(member.uid)}
                      title="Remove Member"
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Invitations Section */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Pending Invites ({invites.length})</span>
              </h3>
            </div>

            {invites.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium text-center py-6">
                No pending invitations. Use the form above to invite household members.
              </p>
            ) : (
              <div className="space-y-3">
                {invites.map((inv) => (
                  <div key={inv.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 truncate">{inv.email}</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {inv.role}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-mono text-slate-500 truncate max-w-[140px]">
                        Token: {inv.token.substring(0, 10)}…
                      </span>
                      <button
                        onClick={() => copyToClipboard(inv.token)}
                        className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
            Invited members gain access upon token acceptance.
          </div>
        </div>
      </div>

      {/* Role Permission Policy Matrix */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
        <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          <span>Role Permission Policy</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
            <h4 className="font-extrabold text-amber-400 flex items-center gap-1.5 mb-1.5">
              <Crown className="w-4 h-4" />
              <span>Owner</span>
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Full workspace control. Invite family members, remove members, assign roles, manage Google Workspace links.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
            <h4 className="font-extrabold text-emerald-400 flex items-center gap-1.5 mb-1.5">
              <Edit3 className="w-4 h-4" />
              <span>Editor</span>
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Active household member. Add & edit expenses, scan receipts with Gemini Vision, manage monthly items and recurring bills.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
            <h4 className="font-extrabold text-slate-400 flex items-center gap-1.5 mb-1.5">
              <Eye className="w-4 h-4" />
              <span>Viewer</span>
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Read-only household member. View dashboard analytics, budget forecasts, and inflation reports.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
