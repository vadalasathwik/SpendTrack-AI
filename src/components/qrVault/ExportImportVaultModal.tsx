import React, { useState } from 'react';
import { X, Download, Upload, ShieldCheck, FileCheck, AlertTriangle } from 'lucide-react';
import { QRVaultStore } from '../../services/qrVaultStore.js';

interface ExportImportVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const ExportImportVaultModal: React.FC<ExportImportVaultModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setLoading(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const dataStr = await QRVaultStore.exportVaultData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `spendtrack-qr-vault-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setStatusMsg('Encrypted QR Vault backup exported successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Export failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg(null);
    setStatusMsg(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const count = await QRVaultStore.importVaultData(jsonStr);
        setStatusMsg(`Successfully imported ${count} QR Pass(es) into your Vault.`);
        onImportComplete();
      } catch (err: any) {
        setErrorMsg(err.message || 'Invalid backup file.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">QR Vault Backup & Sync</h3>
              <p className="text-xs text-slate-400">Offline JSON Import / Export</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <FileCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{statusMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Export Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" /> Export Encrypted Vault
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Save your complete QR Vault locally as an encrypted JSON file for backup or transferring to another browser.
            </p>
            <button
              onClick={handleExport}
              disabled={loading}
              className="mt-2 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-md shadow-emerald-500/20"
            >
              {loading ? 'Exporting...' : 'Export Backup File (.json)'}
            </button>
          </div>

          {/* Import Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-400" /> Restore / Import Vault
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Select a previously exported `.json` QR Vault backup file to restore into IndexedDB.
            </p>

            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <button
                type="button"
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold transition-all cursor-pointer border border-slate-700 pointer-events-none"
              >
                {loading ? 'Importing...' : 'Choose Backup JSON File'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
