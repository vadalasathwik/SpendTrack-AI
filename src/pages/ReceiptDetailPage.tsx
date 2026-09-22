import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Share2,
  Download,
  FileJson,
  Search,
  Sparkles,
  Receipt as ReceiptIcon,
  Store,
  Calendar,
  CreditCard,
  Building2,
  CheckCircle2,
  ExternalLink,
  QrCode,
  Loader2,
  Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SpendTrackApi } from '../services/api.js';
import { formatCurrency } from '../utils/calculations.js';

interface ReceiptDetailPageProps {
  receiptId: string;
  onBack: () => void;
}

export const ReceiptDetailPage: React.FC<ReceiptDetailPageProps> = ({
  receiptId,
  onBack,
}) => {
  const [receipt, setReceipt] = useState<any>(null);
  const [merchantStats, setMerchantStats] = useState<any>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);

  const fetchReceiptDetail = async () => {
    setIsLoading(true);
    try {
      const data = await SpendTrackApi.getReceiptById(receiptId);
      setReceipt(data);

      if (data?.merchant) {
        const stats = await SpendTrackApi.getMerchantIntelligence(data.merchant);
        setMerchantStats(stats);
      }
    } catch (err) {
      console.error('Failed to load receipt details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceiptDetail();
  }, [receiptId]);

  const filteredItems = useMemo(() => {
    if (!receipt?.items) return [];
    if (!itemSearchQuery.trim()) return receipt.items;
    return receipt.items.filter((it: any) =>
      it.name.toLowerCase().includes(itemSearchQuery.toLowerCase())
    );
  }, [receipt, itemSearchQuery]);

  // Actions
  const handleShare = async () => {
    if (!receipt) return;
    const shareText = `Receipt from ${receipt.merchant}\nTotal: ${formatCurrency(receipt.total)}\nInvoice: #${receipt.invoiceNumber || 'N/A'}\nDate: ${new Date(receipt.purchaseDate).toLocaleDateString()}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt - ${receipt.merchant}`,
          text: shareText,
        });
      } catch (err) {
        console.warn('Share cancelled or failed:', err);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Receipt details copied to clipboard!');
    }
  };

  const handleDownloadJson = () => {
    if (!receipt) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(receipt, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `Receipt_${receipt.merchant}_${receipt.invoiceNumber || 'Detail'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[430px] mx-auto min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center py-20 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
        <p className="text-xs text-slate-400">Loading receipt vault details...</p>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="w-full max-w-[430px] mx-auto min-h-screen bg-slate-950 text-white p-6 font-sans">
        <button onClick={onBack} className="flex items-center text-xs text-slate-400 mb-6 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Vault
        </button>
        <p className="text-center text-slate-400 text-sm">Receipt record not found.</p>
      </div>
    );
  }

  const dateStr = new Date(receipt.purchaseDate).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="w-full max-w-[430px] mx-auto min-h-screen bg-slate-950 text-white pb-28 px-4 pt-4 font-sans select-none print:bg-white print:text-black">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <button
          onClick={onBack}
          className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Vault
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            title="Share Receipt"
            className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownloadJson}
            title="Export JSON"
            className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
          >
            <FileJson className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownloadPdf}
            title="Print / Save PDF"
            className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-teal-400 hover:border-teal-500/30 transition-all"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Card */}
      <div className="relative bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-900/60 border border-slate-800/80 rounded-[28px] p-5 mb-4 shadow-2xl backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {receipt.receiptImage && (
          <div
            onClick={() => setShowImageModal(true)}
            className="w-full h-36 mb-4 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 relative cursor-pointer group"
          >
            <img
              src={receipt.receiptImage}
              alt="Receipt Preview"
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-all duration-300 opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                <ExternalLink className="w-3 h-3" /> View Original Document
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 font-extrabold text-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            {receipt.merchant.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">{receipt.merchant}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {receipt.invoiceNumber ? `Invoice #${receipt.invoiceNumber}` : 'Standard Receipt'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
          <div>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Purchase Date</p>
            <p className="text-xs font-semibold text-slate-200 mt-0.5">{dateStr}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Payment Method</p>
            <p className="text-xs font-semibold text-emerald-400 mt-0.5 uppercase font-mono">
              {receipt.paymentMethod || 'UPI'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-[28px] p-5 mb-4 shadow-xl backdrop-blur-xl">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Financial Summary</h2>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span className="font-mono text-slate-200">{formatCurrency(receipt.subtotal)}</span>
          </div>

          {receipt.discount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Discount</span>
              <span className="font-mono">- {formatCurrency(receipt.discount)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-400">
            <span>GST / Tax</span>
            <span className="font-mono text-slate-200">{formatCurrency(receipt.taxAmount)}</span>
          </div>

          <div className="flex justify-between text-sm font-bold text-white pt-2.5 border-t border-slate-800">
            <span>Grand Total</span>
            <span className="font-mono text-emerald-400 text-base">{formatCurrency(receipt.total)}</span>
          </div>
        </div>
      </div>

      {/* Itemized Purchases Section */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-[28px] p-5 mb-4 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Itemized Purchases ({receipt.items?.length || 0})
          </h2>
        </div>

        {/* Item Search inside receipt */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={itemSearchQuery}
            onChange={(e) => setItemSearchQuery(e.target.value)}
            placeholder="Search items in receipt..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/40"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-800">
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 font-medium text-center">Qty</th>
                <th className="pb-2 font-medium text-right">Price</th>
                <th className="pb-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredItems.map((item: any, idx: number) => (
                <tr key={item.id || idx} className="text-slate-300">
                  <td className="py-2.5 font-medium text-slate-200 pr-2 line-clamp-1">{item.name}</td>
                  <td className="py-2.5 text-center font-mono text-slate-400 text-[11px]">{item.quantity}</td>
                  <td className="py-2.5 text-right font-mono text-slate-400 text-[11px]">
                    {formatCurrency(item.pricePerUnit)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-100 font-semibold">
                    {formatCurrency(item.lineAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Merchant Intelligence */}
      {merchantStats && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-emerald-500/20 rounded-[28px] p-5 mb-4 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Merchant Intelligence ({merchantStats.merchant})
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
              <p className="text-[10px] text-slate-500 font-medium">Total Visits</p>
              <p className="text-base font-bold text-slate-100 mt-0.5">{merchantStats.totalVisits}</p>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
              <p className="text-[10px] text-slate-500 font-medium">Total Spent</p>
              <p className="text-base font-bold text-emerald-400 mt-0.5">{formatCurrency(merchantStats.totalSpent)}</p>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
              <p className="text-[10px] text-slate-500 font-medium">Average Bill</p>
              <p className="text-base font-bold text-cyan-400 mt-0.5">{formatCurrency(merchantStats.averageBill)}</p>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
              <p className="text-[10px] text-slate-500 font-medium">Last Visit</p>
              <p className="text-xs font-semibold text-slate-300 mt-1">
                {merchantStats.lastPurchase
                  ? new Date(merchantStats.lastPurchase).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                  : 'Today'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Barcode & Verification Footer */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-[28px] p-5 text-center flex flex-col items-center justify-center">
        <QrCode className="w-16 h-16 text-slate-400 mb-2 opacity-80" />
        <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
          {receipt.invoiceNumber ? `INV:${receipt.invoiceNumber}` : `REC:${receipt.id}`}
        </p>
        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" /> Verified Digital Record
        </span>
      </div>

      {/* Image Full Modal */}
      {showImageModal && receipt.receiptImage && (
        <div
          onClick={() => setShowImageModal(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <img
            src={receipt.receiptImage}
            alt="Original Receipt Full"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-slate-800"
          />
        </div>
      )}
    </div>
  );
};
