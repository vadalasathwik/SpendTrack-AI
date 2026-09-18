import React from 'react';
import { FileText, Tag, Download, Trash2, Eye } from 'lucide-react';
import { GlassCard } from './GlassCard.js';

interface DocumentCardProps {
  document: {
    id: string;
    title: string;
    category: string;
    fileUrl: string;
    fileType?: string;
    summary?: string;
    tags?: string;
    uploadedAt: string;
  };
  onDelete?: (id: string) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document, onDelete }) => {
  return (
    <GlassCard className="p-4 space-y-3 relative group">
      {onDelete && (
        <button
          onClick={() => onDelete(document.id)}
          className="absolute top-3 right-3 p-1 rounded text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-start gap-3 pr-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
          <FileText className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white/5 text-indigo-300">
              {document.category}
            </span>
          </div>
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate mt-1">
            {document.title}
          </h4>
        </div>
      </div>

      {document.summary && (
        <p className="text-xs text-slate-400 line-clamp-2 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">
          "{document.summary}"
        </p>
      )}

      <div className="flex items-center justify-between text-[11px] pt-1">
        <span className="text-slate-400">
          {new Date(document.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <div className="flex items-center gap-2">
          {document.tags && (
            <span className="flex items-center gap-1 text-[10px] text-teal-400">
              <Tag className="w-3 h-3" /> {document.tags}
            </span>
          )}
          <a
            href={document.fileUrl || '#'}
            target="_blank"
            rel="noreferrer"
            className="p-1 text-slate-300 hover:text-emerald-400 cursor-pointer"
            title="View Document"
          >
            <Eye className="w-4 h-4" />
          </a>
        </div>
      </div>
    </GlassCard>
  );
};
