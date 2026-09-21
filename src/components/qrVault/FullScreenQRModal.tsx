import React, { useState } from 'react';
import { X, Copy, Check, Download, Share2, ShieldCheck, Sun, Star } from 'lucide-react';
import { QRVaultItem } from '../../services/qrVaultStore.js';

interface FullScreenQRModalProps {
  item: QRVaultItem | null;
  onClose: () => void;
  onToggleFavorite?: (id: string) => void;
}

export const FullScreenQRModal: React.FC<FullScreenQRModalProps> = ({
  item,
  onClose,
  onToggleFavorite,
}) => {
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const handleCopy = () => {
    if (item.upiId) {
      navigator.clipboard.writeText(item.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = item.qrDataUrl;
    link.download = `${item.name.replace(/[^a-zA-Z0-9]/g, '_')}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (navigator.share && item.upiId) {
      try {
        await navigator.share({
          title: item.name,
          text: `Pay via UPI to ${item.name}: ${item.upiId}`,
          url: item.upiId.startsWith('upi://') ? item.upiId : `upi://pay?pa=${item.upiId}&pn=${encodeURIComponent(item.name)}&cu=INR`,
        });
      } catch (e) {
        console.warn('Share cancelled:', e);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[36px] p-6 shadow-2xl flex flex-col items-center text-center space-y-6">
        
        {/* Top Header Actions */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted Scanner Pass</span>
          </div>

          <div className="flex items-center gap-2">
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(item.id)}
                className={`p-2.5 rounded-full transition-all cursor-pointer ${
                  item.isFavorite
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-slate-950' : ''}`} />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Payee Info */}
        <div className="space-y-1">
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            {item.category} Pass
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight">{item.name}</h2>
          {item.upiId && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 font-mono text-xs text-emerald-400 mt-1">
              <span>{item.upiId}</span>
              <button
                onClick={handleCopy}
                className="hover:text-white transition-colors cursor-pointer"
                title="Copy UPI ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Brightness / High-Contrast Hint */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/20">
          <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
          <span>Maximum Scanner Contrast Enabled</span>
        </div>

        {/* Pure White Container for Scanner Readability */}
        <div className="p-5 bg-white rounded-[28px] shadow-2xl border-4 border-slate-800 flex items-center justify-center">
          <img
            src={item.qrDataUrl}
            alt={item.name}
            className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
          />
        </div>

        {/* Bottom Action Bar */}
        <div className="w-full grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleDownload}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Save QR Image</span>
          </button>

          <button
            onClick={handleShare}
            className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            <span>Share UPI Pass</span>
          </button>
        </div>

      </div>
    </div>
  );
};
