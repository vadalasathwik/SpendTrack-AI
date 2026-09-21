import React, { useState, useEffect } from 'react';
import {
  Wallet,
  QrCode,
  CreditCard,
  Building2,
  Plus,
  ShieldCheck,
  Search,
  Sparkles,
  ArrowUpRight,
  Copy,
  Check,
  Smartphone,
  Lock,
  Download,
  Share2,
  Database,
  Wifi,
  Star,
  Cpu,
} from 'lucide-react';
import { QRVaultStore, QRVaultItem } from '../services/qrVaultStore.js';
import { AppleWalletQRCard } from '../components/qrVault/AppleWalletQRCard.js';
import { FullScreenQRModal } from '../components/qrVault/FullScreenQRModal.js';
import { AddQRModal } from '../components/qrVault/AddQRModal.js';
import { formatCurrency } from '../utils/calculations.js';

interface WalletPageProps {
  expenses?: any[];
  userSettings?: any;
}

export const WalletPage: React.FC<WalletPageProps> = () => {
  const [activeSegment, setActiveSegment] = useState<'all' | 'accounts' | 'qrs' | 'upis' | 'cards'>('all');
  const [qrItems, setQrItems] = useState<QRVaultItem[]>([]);
  const [isAddQRModalOpen, setIsAddQRModalOpen] = useState(false);
  const [selectedQRItem, setSelectedQRItem] = useState<QRVaultItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    loadQRItems();

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

  const handleToggleFav = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await QRVaultStore.toggleFavorite(id);
    await loadQRItems();
  };

  const handleDeleteQR = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Delete this pass from your local QR vault?')) {
      await QRVaultStore.deleteQRCode(id);
      await loadQRItems();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredQRs = qrItems.filter((q) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      q.name.toLowerCase().includes(term) ||
      (q.upiId && q.upiId.toLowerCase().includes(term)) ||
      (q.notes && q.notes.toLowerCase().includes(term));
    const matchesCat = selectedCategory === 'All' || q.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalBalance = 227700;

  // 1. Bank Accounts (Apple Wallet Styled Passes)
  const bankAccounts = [
    {
      id: 'acc-1',
      bankName: 'HDFC Bank',
      accountType: 'Savings Salary',
      accountNumber: '•••• 4821',
      balance: 142500,
      gradient: 'from-blue-700 via-indigo-800 to-slate-950',
      isPrimary: true,
      logoText: 'HDFC',
    },
    {
      id: 'acc-2',
      bankName: 'ICICI Bank',
      accountType: 'Wealth Savings',
      accountNumber: '•••• 9104',
      balance: 85200,
      gradient: 'from-amber-600 via-orange-700 to-slate-950',
      isPrimary: false,
      logoText: 'ICICI',
    },
  ];

  // 3. Saved UPI Handles & Mandates
  const savedUpiIds = [
    {
      id: 'upi-1',
      title: 'Primary Google Pay UPI',
      upiHandle: 'user@okhdfcbank',
      app: 'Google Pay',
      isDefault: true,
    },
    {
      id: 'upi-2',
      title: 'PhonePe Secondary UPI',
      upiHandle: 'user@ybl',
      app: 'PhonePe',
      isDefault: false,
    },
    {
      id: 'upi-3',
      title: 'SIP AutoPay Mandate',
      upiHandle: 'autopay.sip@icici',
      app: 'Auto-Debit',
      isDefault: false,
      amount: '₹15,000 / mo',
    },
  ];

  // 4. Glass Payment Cards (Apple Wallet Metallic Cards)
  const paymentCards = [
    {
      id: 'card-1',
      bank: 'HDFC Bank',
      cardName: 'Regalia Gold',
      network: 'VISA SIGNATURE',
      cardNumber: '4532 •••• •••• 8821',
      cardHolder: 'AUTHENTICATED USER',
      expiry: '09/28',
      gradient: 'from-slate-900 via-purple-950 to-black',
      accentColor: 'text-purple-400',
    },
    {
      id: 'card-2',
      bank: 'ICICI Bank',
      cardName: 'Sapphiro World',
      network: 'MASTERCARD',
      cardNumber: '5412 •••• •••• 3910',
      cardHolder: 'AUTHENTICATED USER',
      expiry: '11/27',
      gradient: 'from-amber-950 via-stone-900 to-black',
      accentColor: 'text-amber-400',
    },
    {
      id: 'card-3',
      bank: 'SBI Card',
      cardName: 'RuPay Select',
      network: 'RUPAY',
      cardNumber: '6521 •••• •••• 1042',
      cardHolder: 'AUTHENTICATED USER',
      expiry: '04/29',
      gradient: 'from-teal-950 via-slate-900 to-black',
      accentColor: 'text-teal-400',
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ------------------------------------------------------------- */}
      {/* Apple Wallet Security & Vault Header Banner                   */}
      {/* ------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 p-5 sm:p-6 text-white border border-emerald-500/30 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-56 h-56 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm">
                <Wallet className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-black text-emerald-300 uppercase tracking-widest">
                Apple Wallet & Vault
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Financial Vault
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Encrypted bank accounts, payment passes & offline QR store
            </p>
          </div>

          <button
            onClick={() => setIsAddQRModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add QR</span>
          </button>
        </div>

        {/* 5. Offline Encrypted Badge Header Strip */}
        <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>256-bit AES Client Encrypted</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                isOnline
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              <Database className="w-3 h-3" />
              {isOnline ? 'Online (IndexedDB Synced)' : 'Offline Vault Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Navigation Filter Segment Pills                               */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'All Passes' },
          { id: 'accounts', label: 'Bank Accounts' },
          { id: 'qrs', label: `QR Vault (${qrItems.length})` },
          { id: 'upis', label: 'Saved UPI IDs' },
          { id: 'cards', label: 'Payment Cards' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSegment(tab.id as any)}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
              activeSegment === tab.id
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-105'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. BANK ACCOUNTS SECTION (Glassmorphic Stack)                 */}
      {/* ------------------------------------------------------------- */}
      {(activeSegment === 'all' || activeSegment === 'accounts') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Connected Bank Accounts
            </h2>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Total: {formatCurrency(totalBalance)}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {bankAccounts.map((acc) => (
              <div
                key={acc.id}
                className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br ${acc.gradient} p-5 text-white shadow-xl border border-white/15 backdrop-blur-xl hover:scale-[1.01] transition-all duration-300 group`}
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-2 right-4 text-white/5 font-mono text-5xl font-black pointer-events-none select-none">
                  {acc.logoText}
                </div>

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center font-black text-xs text-white border border-white/20 shadow-inner">
                      {acc.logoText}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white tracking-tight">{acc.bankName}</h3>
                      <p className="text-[11px] text-slate-300 font-medium">{acc.accountType}</p>
                    </div>
                  </div>

                  {acc.isPrimary ? (
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
                      Primary Salary
                    </span>
                  ) : (
                    <Wifi className="w-4 h-4 text-white/60 rotate-90" />
                  )}
                </div>

                <div className="flex items-end justify-between relative z-10 pt-2 border-t border-white/10">
                  <div>
                    <span className="text-[10px] text-slate-300 uppercase tracking-widest font-black block">Available Balance</span>
                    <span className="text-2xl font-black text-white tracking-tight">{formatCurrency(acc.balance)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-300 uppercase tracking-widest font-black block">Account No.</span>
                    <span className="text-xs font-mono font-bold tracking-widest text-slate-200">{acc.accountNumber}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. QR VAULT SECTION (Search, Favorites & Full-Screen Trigger) */}
      {/* ------------------------------------------------------------- */}
      {(activeSegment === 'all' || activeSegment === 'qrs') && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <QrCode className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Offline Encrypted QR Vault
            </h2>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {qrItems.length} Stored Passes
            </span>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search pass by name, UPI ID or note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              {['All', 'Personal', 'Business', 'Family', 'Merchant'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredQRs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredQRs.map((qr) => (
                <AppleWalletQRCard
                  key={qr.id}
                  item={qr}
                  onSelect={(item) => setSelectedQRItem(item)}
                  onToggleFavorite={handleToggleFav}
                  onDelete={handleDeleteQR}
                />
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
                <QrCode className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {searchQuery ? 'No Passes Match Your Search' : 'No QR Passes in Offline Vault'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  {searchQuery
                    ? 'Try searching with another keyword or category.'
                    : 'Add UPI payment QR codes or upload images to access them offline anytime.'}
                </p>
              </div>
              {!searchQuery && (
                <button
                  onClick={() => setIsAddQRModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs shadow-md shadow-teal-600/20 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add First QR Pass</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. PAYMENT CARDS SECTION (Glass Credit & Debit Passes)        */}
      {/* ------------------------------------------------------------- */}
      {(activeSegment === 'all' || activeSegment === 'cards') && (
        <div className="space-y-3 px-1">
          <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Payment Credit & Debit Cards
          </h2>

          <div className="grid grid-cols-1 gap-3.5">
            {paymentCards.map((card) => (
              <div
                key={card.id}
                className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br ${card.gradient} p-5 text-white shadow-xl border border-white/15 backdrop-blur-xl hover:scale-[1.01] transition-transform duration-300 min-h-[190px] flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-7 rounded-lg bg-gradient-to-tr from-amber-200 via-amber-400 to-yellow-100 border border-amber-300/60 shadow-inner flex items-center justify-center">
                      <Cpu className="w-5 h-5 text-amber-900/60" />
                    </div>
                    <Wifi className="w-5 h-5 text-white/70 rotate-90" />
                  </div>
                  <span className={`text-xs font-black tracking-widest ${card.accentColor}`}>
                    {card.network}
                  </span>
                </div>

                <div className="my-3">
                  <span className="text-lg sm:text-xl font-mono tracking-[0.25em] text-slate-100 font-bold drop-shadow-md">
                    {card.cardNumber}
                  </span>
                </div>

                <div className="flex items-end justify-between border-t border-white/10 pt-3">
                  <div>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Cardholder</span>
                    <span className="text-xs font-bold tracking-wider text-slate-200">{card.cardHolder}</span>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Expires</span>
                    <span className="text-xs font-mono font-bold text-slate-200">{card.expiry}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. SAVED UPI IDS & MANDATES SECTION                           */}
      {/* ------------------------------------------------------------- */}
      {(activeSegment === 'all' || activeSegment === 'upis') && (
        <div className="space-y-3 px-1">
          <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            Saved UPI IDs & AutoPay Mandates
          </h2>

          <div className="space-y-2.5">
            {savedUpiIds.map((upi) => (
              <div
                key={upi.id}
                className="p-4 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-sm hover:border-cyan-500/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">{upi.title}</h3>
                      {upi.isDefault && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                      {upi.upiHandle} {upi.amount ? `(${upi.amount})` : ''}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(upi.upiHandle, upi.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === upi.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. OFFLINE ENCRYPTED BADGE FOOTER                             */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 rounded-[28px] bg-slate-900/90 text-white border border-emerald-500/20 backdrop-blur-xl space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white">Apple Wallet Local Vault Security</h4>
            <p className="text-[11px] text-slate-400">
              All financial passes & QR codes are encrypted on-device via WebCrypto AES-256-GCM.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddQRModal
        isOpen={isAddQRModalOpen}
        onClose={() => setIsAddQRModalOpen(false)}
        onSave={async (qrData) => {
          await QRVaultStore.saveQRCode(qrData);
          await loadQRItems();
        }}
      />

      <FullScreenQRModal
        isOpen={selectedQRItem !== null}
        onClose={() => setSelectedQRItem(null)}
        item={selectedQRItem}
        onToggleFavorite={async (id) => {
          await QRVaultStore.toggleFavorite(id);
          await loadQRItems();
          if (selectedQRItem && selectedQRItem.id === id) {
            setSelectedQRItem({ ...selectedQRItem, isFavorite: !selectedQRItem.isFavorite });
          }
        }}
      />
    </div>
  );
};

