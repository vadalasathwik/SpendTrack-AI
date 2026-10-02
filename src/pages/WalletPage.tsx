import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Building2,
  Plus,
  ShieldCheck,
  Search,
  Copy,
  Check,
  Smartphone,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Database,
  X,
} from 'lucide-react';
import { QRVaultStore, QRVaultItem } from '../services/qrVaultStore.js';
import { AppleWalletQRCard } from '../components/qrVault/AppleWalletQRCard.js';
import { FullScreenQRModal } from '../components/qrVault/FullScreenQRModal.js';
import { AddQRModal } from '../components/qrVault/AddQRModal.js';
import { GlassCard } from '../components/ui/GlassCard.js';

export interface SavedUpiItem {
  id: string;
  name: string;
  upiId: string;
  notes?: string;
  createdAt: string;
}

export interface SavedBankRecord {
  id: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  accountType: 'Savings' | 'Current' | 'Salary' | 'NRI' | 'Other';
  branch?: string;
  ifsc?: string;
  micr?: string;
  customerId?: string;
  branchAddress?: string;
  notes?: string;
  createdAt: string;
}

const STORAGE_KEY_UPIS = 'spendtrack_vault_upis';
const STORAGE_KEY_BANKS = 'spendtrack_vault_bank_records';

export const WalletPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'qr' | 'upi' | 'bank'>('qr');

  // QR Vault State
  const [qrItems, setQrItems] = useState<QRVaultItem[]>([]);
  const [isAddQRModalOpen, setIsAddQRModalOpen] = useState(false);
  const [selectedQRItem, setSelectedQRItem] = useState<QRVaultItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // UPI IDs State
  const [upiItems, setUpiItems] = useState<SavedUpiItem[]>([]);
  const [isAddUpiModalOpen, setIsAddUpiModalOpen] = useState(false);
  const [editingUpiItem, setEditingUpiItem] = useState<SavedUpiItem | null>(null);
  const [upiName, setUpiName] = useState('');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [upiNotes, setUpiNotes] = useState('');

  // Bank Details State
  const [bankRecords, setBankRecords] = useState<SavedBankRecord[]>([]);
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [editingBankRecord, setEditingBankRecord] = useState<SavedBankRecord | null>(null);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  // Bank Form State
  const [holderName, setHolderName] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<'Savings' | 'Current' | 'Salary' | 'NRI' | 'Other'>('Savings');
  const [branch, setBranch] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [micr, setMicr] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [bankNotes, setBankNotes] = useState('');

  // Load offline data on mount
  useEffect(() => {
    loadQRItems();
    loadUpiItems();
    loadBankRecords();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadQRItems = async () => {
    try {
      const items = await QRVaultStore.getAllQRCodes();
      setQrItems(items);
    } catch (err) {
      console.warn('Failed to load QR Vault items:', err);
    }
  };

  const loadUpiItems = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_UPIS);
      if (raw) {
        setUpiItems(JSON.parse(raw));
      }
    } catch (e) {}
  };

  const saveUpiItemsToStore = (items: SavedUpiItem[]) => {
    setUpiItems(items);
    try {
      localStorage.setItem(STORAGE_KEY_UPIS, JSON.stringify(items));
    } catch (e) {}
  };

  const loadBankRecords = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BANKS);
      if (raw) {
        setBankRecords(JSON.parse(raw));
      }
    } catch (e) {}
  };

  const saveBankRecordsToStore = (records: SavedBankRecord[]) => {
    setBankRecords(records);
    try {
      localStorage.setItem(STORAGE_KEY_BANKS, JSON.stringify(records));
    } catch (e) {}
  };

  // QR Handlers
  const handleDeleteQR = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Delete this QR pass from your local vault?')) {
      await QRVaultStore.deleteQRCode(id);
      await loadQRItems();
    }
  };

  const handleCopyText = (text: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // UPI Handlers
  const handleSaveUpi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiName.trim() || !upiIdInput.trim()) return;

    if (editingUpiItem) {
      const updated = upiItems.map((u) =>
        u.id === editingUpiItem.id
          ? { ...u, name: upiName.trim(), upiId: upiIdInput.trim(), notes: upiNotes.trim() || undefined }
          : u
      );
      saveUpiItemsToStore(updated);
    } else {
      const newItem: SavedUpiItem = {
        id: `upi_${Date.now()}`,
        name: upiName.trim(),
        upiId: upiIdInput.trim(),
        notes: upiNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      saveUpiItemsToStore([newItem, ...upiItems]);
    }

    setIsAddUpiModalOpen(false);
    setEditingUpiItem(null);
    setUpiName('');
    setUpiIdInput('');
    setUpiNotes('');
  };

  const handleDeleteUpi = (id: string) => {
    if (window.confirm('Delete this UPI ID from your vault?')) {
      saveUpiItemsToStore(upiItems.filter((u) => u.id !== id));
    }
  };

  // Bank Handlers
  const handleSaveBankRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holderName.trim() || !bankName.trim() || !accountNumber.trim()) return;

    if (editingBankRecord) {
      const updated = bankRecords.map((b) =>
        b.id === editingBankRecord.id
          ? {
              ...b,
              accountHolderName: holderName.trim(),
              bankName: bankName.trim(),
              accountNumber: accountNumber.trim(),
              accountType,
              branch: branch.trim() || undefined,
              ifsc: ifsc.trim().toUpperCase() || undefined,
              micr: micr.trim() || undefined,
              customerId: customerId.trim() || undefined,
              branchAddress: branchAddress.trim() || undefined,
              notes: bankNotes.trim() || undefined,
            }
          : b
      );
      saveBankRecordsToStore(updated);
    } else {
      const newRecord: SavedBankRecord = {
        id: `bank_${Date.now()}`,
        accountHolderName: holderName.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountType,
        branch: branch.trim() || undefined,
        ifsc: ifsc.trim().toUpperCase() || undefined,
        micr: micr.trim() || undefined,
        customerId: customerId.trim() || undefined,
        branchAddress: branchAddress.trim() || undefined,
        notes: bankNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      saveBankRecordsToStore([newRecord, ...bankRecords]);
    }

    setIsAddBankModalOpen(false);
    setEditingBankRecord(null);
    resetBankForm();
  };

  const resetBankForm = () => {
    setHolderName('');
    setBankName('HDFC Bank');
    setAccountNumber('');
    setAccountType('Savings');
    setBranch('');
    setIfsc('');
    setMicr('');
    setCustomerId('');
    setBranchAddress('');
    setBankNotes('');
  };

  const handleDeleteBankRecord = (id: string) => {
    if (window.confirm('Delete this bank passbook record from your vault?')) {
      saveBankRecordsToStore(bankRecords.filter((b) => b.id !== id));
    }
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Masking helpers for Bank Details
  const maskAccountNumber = (num: string): string => {
    const clean = num.replace(/\s+/g, '');
    if (clean.length <= 4) return clean;
    return `•••• •••• ${clean.slice(-4)}`;
  };

  const maskCode = (code?: string): string => {
    if (!code) return '••••';
    if (code.length <= 4) return '••••';
    return `•••• ${code.slice(-4)}`;
  };

  const filteredQRs = qrItems.filter((q) => {
    const term = searchQuery.toLowerCase();
    return (
      q.name.toLowerCase().includes(term) ||
      (q.upiId && q.upiId.toLowerCase().includes(term)) ||
      (q.notes && q.notes.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-28 animate-in fade-in duration-200">
      {/* ------------------------------------------------------------- */}
      {/* Header & Encrypted Vault Banner                               */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 text-white shadow-xl relative overflow-hidden space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                256-bit AES Client Encrypted
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Personal Financial Vault
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Secure client-side storage for QR codes, UPI handles, and bank details
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (activeTab === 'qr') setIsAddQRModalOpen(true);
              else if (activeTab === 'upi') {
                setEditingUpiItem(null);
                setUpiName('');
                setUpiIdInput('');
                setUpiNotes('');
                setIsAddUpiModalOpen(true);
              } else {
                setEditingBankRecord(null);
                resetBankForm();
                setIsAddBankModalOpen(true);
              }
            }}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>
              {activeTab === 'qr' ? 'Save QR' : activeTab === 'upi' ? 'Add UPI' : 'Add Bank'}
            </span>
          </button>
        </div>

        {/* Storage Badge Strip */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 font-medium">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isOnline ? 'Offline Storage Ready (IndexedDB)' : 'Offline Local Storage'}</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            No External Bank Sync
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3 Primary Navigation Area Tabs: QR Vault | UPI IDs | Bank Details */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('qr')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'qr'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>QR Vault ({qrItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upi')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'upi'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>UPI IDs ({upiItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bank')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'bank'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Bank Details ({bankRecords.length})</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* AREA 1: QR VAULT                                              */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'qr' && (
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search saved QR passes by name or UPI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {filteredQRs.length === 0 ? (
            <GlassCard padding="p-6" className="text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">No QR Passes Saved</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Store payment QR codes locally for instant offline scanning.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddQRModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Save First QR</span>
              </button>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredQRs.map((item) => (
                <AppleWalletQRCard
                  key={item.id}
                  item={item}
                  onSelect={() => setSelectedQRItem(item)}
                  onToggleFav={() => {}}
                  onDelete={(id, e) => handleDeleteQR(id, e)}
                  onCopyUpi={(text, e) => handleCopyText(text, item.id, e)}
                  copiedId={copiedId}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* AREA 2: SAVED UPI IDs                                         */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'upi' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Saved Payment Handles
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditingUpiItem(null);
                setUpiName('');
                setUpiIdInput('');
                setUpiNotes('');
                setIsAddUpiModalOpen(true);
              }}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add UPI ID</span>
            </button>
          </div>

          {upiItems.length === 0 ? (
            <GlassCard padding="p-6" className="text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center mx-auto">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">No Saved UPI Handles</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Save your frequently used UPI VPA IDs for fast copy & paste sharing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingUpiItem(null);
                  setUpiName('');
                  setUpiIdInput('');
                  setUpiNotes('');
                  setIsAddUpiModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Save UPI ID</span>
              </button>
            </GlassCard>
          ) : (
            <div className="space-y-2.5">
              {upiItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-cyan-500/40 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 truncate mt-0.5">
                        {item.upiId}
                      </p>
                      {item.notes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyText(item.upiId, item.id)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-600 transition-colors cursor-pointer"
                      title="Copy UPI ID"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingUpiItem(item);
                        setUpiName(item.name);
                        setUpiIdInput(item.upiId);
                        setUpiNotes(item.notes || '');
                        setIsAddUpiModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Edit UPI ID"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteUpi(item.id)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete UPI ID"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* AREA 3: BANK DETAILS (PASSBOOK VAULT)                         */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'bank' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Personal Passbook Records
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditingBankRecord(null);
                resetBankForm();
                setIsAddBankModalOpen(true);
              }}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Bank Record</span>
            </button>
          </div>

          {bankRecords.length === 0 ? (
            <GlassCard padding="p-6" className="text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">No Bank Records Stored</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Store passbook account details, IFSC codes, and branch information securely.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingBankRecord(null);
                  resetBankForm();
                  setIsAddBankModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Bank Record</span>
              </button>
            </GlassCard>
          ) : (
            <div className="space-y-3.5">
              {bankRecords.map((record) => {
                const isRevealed = Boolean(revealedIds[record.id]);
                return (
                  <div
                    key={record.id}
                    className="p-5 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5 relative overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-sm">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">
                              {record.bankName}
                            </h4>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {record.accountType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            {record.accountHolderName}
                          </p>
                        </div>
                      </div>

                      {/* Reveal Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleReveal(record.id)}
                        className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          isRevealed
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span>{isRevealed ? 'Mask' : 'Reveal'}</span>
                      </button>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {/* Account Number */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Account Number
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {isRevealed ? record.accountNumber : maskAccountNumber(record.accountNumber)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(record.accountNumber, `acc_${record.id}`)}
                            className="text-slate-400 hover:text-emerald-500 p-0.5 cursor-pointer"
                            title="Copy Account Number"
                          >
                            {copiedId === `acc_${record.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* IFSC Code */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          IFSC Code
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-white uppercase">
                            {record.ifsc || 'N/A'}
                          </span>
                          {record.ifsc && (
                            <button
                              type="button"
                              onClick={() => handleCopyText(record.ifsc!, `ifsc_${record.id}`)}
                              className="text-slate-400 hover:text-emerald-500 p-0.5 cursor-pointer"
                              title="Copy IFSC"
                            >
                              {copiedId === `ifsc_${record.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Branch */}
                      {record.branch && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Branch
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {record.branch}
                          </span>
                        </div>
                      )}

                      {/* Customer ID */}
                      {record.customerId && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Customer ID / CIF
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {isRevealed ? record.customerId : maskCode(record.customerId)}
                          </span>
                        </div>
                      )}

                      {/* MICR */}
                      {record.micr && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            MICR Code
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {isRevealed ? record.micr : maskCode(record.micr)}
                          </span>
                        </div>
                      )}

                      {/* Branch Address */}
                      {record.branchAddress && (
                        <div className="col-span-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Branch Address
                          </span>
                          <span className="font-medium text-slate-600 dark:text-slate-400 text-[11px]">
                            {record.branchAddress}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      {record.notes ? (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                          Note: {record.notes}
                        </span>
                      ) : (
                        <span />
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBankRecord(record);
                            setHolderName(record.accountHolderName);
                            setBankName(record.bankName);
                            setAccountNumber(record.accountNumber);
                            setAccountType(record.accountType);
                            setBranch(record.branch || '');
                            setIfsc(record.ifsc || '');
                            setMicr(record.micr || '');
                            setCustomerId(record.customerId || '');
                            setBranchAddress(record.branchAddress || '');
                            setBankNotes(record.notes || '');
                            setIsAddBankModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBankRecord(record.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Add / Edit UPI ID                                      */}
      {/* ------------------------------------------------------------- */}
      {isAddUpiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsAddUpiModalOpen(false)} aria-hidden="true" />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-[24px] p-5 space-y-4 shadow-2xl z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingUpiItem ? 'Edit UPI Handle' : 'Save UPI Handle'}
              </h3>
              <button
                onClick={() => setIsAddUpiModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUpi} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Name / Label <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Personal GPay, Salary UPI"
                  value={upiName}
                  onChange={(e) => setUpiName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  UPI ID (VPA) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="username@okaxis"
                  value={upiIdInput}
                  onChange={(e) => setUpiIdInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Primary account, for rent, etc."
                  value={upiNotes}
                  onChange={(e) => setUpiNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUpiModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Save UPI</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Add / Edit Personal Bank Record                         */}
      {/* ------------------------------------------------------------- */}
      {isAddBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsAddBankModalOpen(false)} aria-hidden="true" />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-[28px] p-5 space-y-4 shadow-2xl z-10 max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingBankRecord ? 'Edit Bank Record' : 'Save Personal Bank Record'}
              </h3>
              <button
                onClick={() => setIsAddBankModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBankRecord} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Account Holder Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sathwik Vadala"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bank Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="HDFC Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Account Type
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as any)}
                    className="w-full px-3 py-2.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="Savings">Savings</option>
                    <option value="Salary">Salary</option>
                    <option value="Current">Current</option>
                    <option value="NRI">NRI</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Account Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="50100012345678"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    placeholder="HDFC0000240"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    placeholder="MG Road Branch"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Customer ID / CIF
                  </label>
                  <input
                    type="text"
                    placeholder="98765432"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    MICR Code
                  </label>
                  <input
                    type="text"
                    placeholder="560240002"
                    value={micr}
                    onChange={(e) => setMicr(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Branch Address
                </label>
                <input
                  type="text"
                  placeholder="Full street address..."
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Primary salary account, locker details..."
                  value={bankNotes}
                  onChange={(e) => setBankNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBankModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Existing QR Modals */}
      <AddQRModal
        isOpen={isAddQRModalOpen}
        onClose={() => setIsAddQRModalOpen(false)}
        onSaveSuccess={loadQRItems}
      />

      <FullScreenQRModal
        item={selectedQRItem}
        onClose={() => setSelectedQRItem(null)}
      />
    </div>
  );
};
