import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Receipt as ReceiptIcon,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  Calendar,
  Layers,
  ArrowUpRight,
  ScanLine,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SpendTrackApi } from '../services/api.js';
import { formatCurrency } from '../utils/calculations.js';
import { ReceiptsSkeleton } from '../components/SkeletonLoader.js';
import { EmptyState } from '../components/ui/EmptyState.js';

export interface ReceiptVaultItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  pricePerUnit: number;
  lineAmount: number;
  category?: string;
}

export interface ReceiptVaultRecord {
  id: string;
  merchant: string;
  invoiceNumber?: string | null;
  purchaseDate: string;
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  paymentMethod?: string | null;
  currency?: string | null;
  receiptImage?: string | null;
  ocrText?: string | null;
  createdAt: string;
  items: ReceiptVaultItem[];
}

interface ReceiptVaultPageProps {
  onSelectReceipt?: (receiptId: string) => void;
  onOpenScanner?: () => void;
}

export const ReceiptVaultPage: React.FC<ReceiptVaultPageProps> = ({
  onSelectReceipt,
  onOpenScanner,
}) => {
  const [receipts, setReceipts] = useState<ReceiptVaultRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'THIS_MONTH' | 'HIGH_VALUE'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchReceipts = async () => {
    setIsLoading(true);
    try {
      const data = await SpendTrackApi.getReceipts(searchQuery);
      setReceipts(data || []);
    } catch (err) {
      console.error('Failed to load receipts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [searchQuery]);

  // Client filtering
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      if (selectedFilter === 'THIS_MONTH') {
        const date = new Date(r.purchaseDate);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
      if (selectedFilter === 'HIGH_VALUE') {
        return r.total >= 500;
      }
      return true;
    });
  }, [receipts, selectedFilter]);

  // Group by Month Year (e.g., "September 2025")
  const groupedReceipts = useMemo(() => {
    const groups: { [key: string]: ReceiptVaultRecord[] } = {};
    filteredReceipts.forEach((r) => {
      const d = new Date(r.purchaseDate);
      const key = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return groups;
  }, [filteredReceipts]);

  return (
    <div className="space-y-6 pb-24 max-w-[1440px] mx-auto">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 p-5 rounded-[28px] border border-slate-800/80 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Vault</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Receipt Vault</h1>
          <p className="text-xs text-slate-400">
            Searchable OCR catalog of physical store bills & digital purchase receipts.
          </p>
        </div>

        {onOpenScanner && (
          <button
            onClick={onOpenScanner}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ScanLine className="w-4 h-4" />
            <span>Scan Receipt</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search merchant, item, invoice, OCR text..."
            className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all backdrop-blur-xl"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap cursor-pointer ${
              selectedFilter === 'ALL'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Receipts
          </button>
          <button
            onClick={() => setSelectedFilter('THIS_MONTH')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap cursor-pointer ${
              selectedFilter === 'THIS_MONTH'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setSelectedFilter('HIGH_VALUE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap cursor-pointer ${
              selectedFilter === 'HIGH_VALUE'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            &gt; ₹500
          </button>
        </div>
      </div>

      {/* Content Groups */}
      {isLoading ? (
        <ReceiptsSkeleton />
      ) : Object.keys(groupedReceipts).length === 0 ? (
        <EmptyState
          icon={ReceiptIcon}
          title="Your digital receipts will appear here"
          description="Scan your store receipts to automatically capture items, total spend, and warranty records."
          actionLabel="Scan Receipt Now"
          onAction={onOpenScanner}
        />
      ) : (
        <div className="space-y-6">
          {(Object.entries(groupedReceipts) as [string, ReceiptVaultRecord[]][]).map(([monthGroup, list]) => (
            <div key={monthGroup} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{monthGroup}</h2>
                <span className="text-[10px] text-slate-500 font-mono">{list.length} receipt{list.length > 1 ? 's' : ''}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {list.map((r) => (
                  <motion.div
                    key={r.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => onSelectReceipt && onSelectReceipt(r.id)}
                    className="bg-slate-900/60 hover:bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/40 rounded-[24px] p-4 transition-all cursor-pointer space-y-3 backdrop-blur-xl group shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                            {r.merchant}
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            {new Date(r.purchaseDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-white font-mono">
                          {formatCurrency(r.total, r.currency || 'INR')}
                        </span>
                        <p className="text-[10px] text-slate-500">
                          {r.items ? `${r.items.length} items` : '1 item'}
                        </p>
                      </div>
                    </div>

                    {r.receiptImage && (
                      <div className="h-28 rounded-xl bg-slate-950 overflow-hidden border border-slate-800/60 relative">
                        <img
                          src={r.receiptImage}
                          alt={r.merchant}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <ScanLine className="w-3 h-3" />
                          <span>OCR Verified</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-800/60">
                      <span className="font-mono text-[10px] text-slate-500">
                        {r.invoiceNumber ? `#${r.invoiceNumber}` : 'ID: ' + r.id.substring(0, 8)}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform">
                        View Details
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
