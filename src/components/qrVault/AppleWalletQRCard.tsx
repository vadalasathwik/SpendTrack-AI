import React from 'react';
import { Star, QrCode, Copy, Check, Trash2, Maximize2, ShieldCheck, User, Briefcase, Users, Store } from 'lucide-react';
import { QRVaultItem, QRCategory } from '../../services/qrVaultStore.js';

interface AppleWalletQRCardProps {
  item: QRVaultItem;
  onSelect: (item: QRVaultItem) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

const CATEGORY_STYLES: Record<
  QRCategory,
  {
    gradient: string;
    badgeBg: string;
    border: string;
    icon: any;
    label: string;
  }
> = {
  Personal: {
    gradient: 'from-emerald-600/90 via-teal-700/80 to-slate-900/95',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    border: 'border-emerald-500/30 hover:border-emerald-400/60',
    icon: User,
    label: 'Personal Pass',
  },
  Business: {
    gradient: 'from-indigo-600/90 via-purple-700/80 to-slate-900/95',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
    border: 'border-indigo-500/30 hover:border-indigo-400/60',
    icon: Briefcase,
    label: 'Business Pass',
  },
  Family: {
    gradient: 'from-amber-600/90 via-rose-700/80 to-slate-900/95',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    border: 'border-amber-500/30 hover:border-amber-400/60',
    icon: Users,
    label: 'Family Pass',
  },
  Merchant: {
    gradient: 'from-slate-800/90 via-amber-700/70 to-slate-950/95',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    border: 'border-amber-500/30 hover:border-amber-400/60',
    icon: Store,
    label: 'Merchant Pass',
  },
};

export const AppleWalletQRCard: React.FC<AppleWalletQRCardProps> = ({
  item,
  onSelect,
  onToggleFavorite,
  onDelete,
}) => {
  const [copied, setCopied] = React.useState(false);
  const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.Personal;
  const CategoryIcon = style.icon;

  const handleCopyUpi = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.upiId) {
      navigator.clipboard.writeText(item.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      onClick={() => onSelect(item)}
      className={`group relative rounded-[28px] p-5 bg-gradient-to-br ${style.gradient} border ${style.border} shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald-500/10 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[220px]`}
    >
      {/* Background Decorative Mesh & Chip Icon */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-3 right-3 text-white/5 font-mono text-6xl font-black pointer-events-none select-none">
        QR
      </div>

      {/* Header: Pass Type Badge & Favorite / Delete buttons */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold border backdrop-blur-md shadow-sm uppercase tracking-wider">
            <CategoryIcon className="w-3.5 h-3.5" />
            <span>{style.label}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => onToggleFavorite(item.id, e)}
              className={`p-2 rounded-xl backdrop-blur-md transition-all cursor-pointer ${
                item.isFavorite
                  ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                  : 'bg-white/10 text-white/70 hover:text-amber-300 hover:bg-white/20'
              }`}
              title={item.isFavorite ? 'Remove Favorite' : 'Mark Favorite'}
            >
              <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-slate-950' : ''}`} />
            </button>

            <button
              onClick={(e) => onDelete(item.id, e)}
              className="p-2 rounded-xl bg-white/10 text-white/60 hover:text-rose-400 hover:bg-white/20 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
              title="Delete Pass"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card Title & Payee Details */}
        <h3 className="text-xl font-black text-white tracking-tight drop-shadow-sm line-clamp-1">
          {item.name}
        </h3>
        {item.upiId && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-mono font-medium text-white/80 bg-black/30 px-2.5 py-0.5 rounded-lg backdrop-blur-md border border-white/10">
              {item.upiId}
            </span>
            <button
              onClick={handleCopyUpi}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition-colors cursor-pointer"
              title="Copy UPI ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Section: QR Thumbnail & Action Prompt */}
      <div className="flex items-end justify-between pt-4 mt-4 border-t border-white/10">
        <div className="flex items-center gap-2 text-white/70 text-[11px] font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-300" />
          <span>Encrypted Offline Pass</span>
        </div>

        {/* High Contrast Thumbnail QR Preview */}
        <div className="relative group/qr p-1.5 rounded-2xl bg-white shadow-xl border border-slate-200 transition-transform group-hover:scale-105">
          <img
            src={item.qrDataUrl}
            alt={item.name}
            className="w-14 h-14 object-contain rounded-xl"
          />
          <div className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover/qr:opacity-100 flex items-center justify-center transition-opacity">
            <Maximize2 className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};
