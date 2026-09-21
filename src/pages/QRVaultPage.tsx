import React, { useState, useEffect, useMemo } from 'react';
import {
  QrCode,
  Plus,
  Upload,
  Search,
  Star,
  ShieldCheck,
  Download,
  SlidersHorizontal,
  User,
  Briefcase,
  Users,
  Store,
  Sparkles,
  Lock,
} from 'lucide-react';
import { QRVaultStore, QRVaultItem, QRCategory } from '../services/qrVaultStore.js';
import { AppleWalletQRCard } from '../components/qrVault/AppleWalletQRCard.js';
import { FullScreenQRModal } from '../components/qrVault/FullScreenQRModal.js';
import { AddQRModal } from '../components/qrVault/AddQRModal.js';
import { ExportImportVaultModal } from '../components/qrVault/ExportImportVaultModal.js';
import { EmptyWorkspace } from '../components/ui/EmptyWorkspace.js';
import { GlassCard } from '../components/ui/GlassCard.js';

export const QRVaultPage: React.FC = () => {
  const [items, setItems] = useState<QRVaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [fullScreenItem, setFullScreenItem] = useState<QRVaultItem | null>(null);

  const loadQRCodes = async () => {
    setLoading(true);
    try {
      const data = await QRVaultStore.getAllQRCodes();
      setItems(data);
    } catch (err) {
      console.error('Failed to load QR Vault items from IndexedDB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQRCodes();
  }, []);

  const handleSaveItem = async (data: {
    name: string;
    category: QRCategory;
    upiId?: string;
    qrDataUrl: string;
    notes?: string;
  }) => {
    await QRVaultStore.saveQRCode({
      name: data.name,
      category: data.category,
      upiId: data.upiId,
      qrDataUrl: data.qrDataUrl,
      isFavorite: false,
      notes: data.notes,
    });
    await loadQRCodes();
  };

  const handleToggleFavorite = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await QRVaultStore.toggleFavorite(id);
      await loadQRCodes();
      if (fullScreenItem && fullScreenItem.id === id) {
        setFullScreenItem((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
      }
    } catch (err) {
      console.warn('Failed to toggle favorite:', err);
    }
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this QR Pass?')) {
      try {
        await QRVaultStore.deleteQRCode(id);
        await loadQRCodes();
      } catch (err) {
        console.warn('Failed to delete QR item:', err);
      }
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.upiId && item.upiId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesCat = true;
      if (selectedCategory === 'Favorites') {
        matchesCat = item.isFavorite;
      } else if (selectedCategory !== 'All') {
        matchesCat = item.category === selectedCategory;
      }

      return matchesSearch && matchesCat;
    });
  }, [items, searchQuery, selectedCategory]);

  const favoritesCount = items.filter((i) => i.isFavorite).length;

  return (
    <div className="space-y-6 pb-28 max-w-[1440px] mx-auto animate-in fade-in duration-300">
      
      {/* APPLE WALLET HERO HEADER */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 rounded-[32px] shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Offline & AES-GCM Encrypted IndexedDB</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <QrCode className="w-8 h-8 text-emerald-400" />
            <span>SpendTrack AI QR Vault</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-xl">
            Store unlimited QR codes & UPI passes styled like Apple Wallet. Zero internet requests after saving.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 z-10 flex-wrap">
          <button
            onClick={() => setIsExportImportOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Backup & Restore</span>
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add QR Pass</span>
          </button>
        </div>
      </div>

      {/* SEARCH BAR & CATEGORY FILTER CHIPS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search QR Vault by payee name, UPI ID, or note..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['All', 'Favorites', 'Personal', 'Business', 'Family', 'Merchant'].map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer border ${
                  active
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                {cat === 'Favorites' ? `★ Favorites (${favoritesCount})` : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* CARDS GRID / EMPTY WORKSPACE */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-56 rounded-[28px] bg-slate-900/60 border border-slate-800 animate-pulse p-6" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyWorkspace
          title={searchQuery || selectedCategory !== 'All' ? 'No QR Passes Match Filter' : 'Your Apple Wallet QR Vault is Empty'}
          description={
            searchQuery || selectedCategory !== 'All'
              ? 'Try adjusting your search terms or category selection.'
              : 'Store unlimited UPI QR codes and pass images offline with local AES-GCM encryption.'
          }
          icon={QrCode}
          actionText="Add First QR Pass"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <AppleWalletQRCard
              key={item.id}
              item={item}
              onSelect={setFullScreenItem}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDeleteItem}
            />
          ))}
        </div>
      )}

      {/* FULL-SCREEN SCANNER MODAL */}
      <FullScreenQRModal
        item={fullScreenItem}
        onClose={() => setFullScreenItem(null)}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* ADD / UPLOAD QR MODAL */}
      <AddQRModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleSaveItem}
      />

      {/* BACKUP & RESTORE MODAL */}
      <ExportImportVaultModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        onImportComplete={loadQRCodes}
      />

    </div>
  );
};
