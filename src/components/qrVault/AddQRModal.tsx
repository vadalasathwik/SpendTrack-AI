import React, { useState } from 'react';
import { X, QrCode, Upload, Sparkles, User, Briefcase, Users, Store, ShieldCheck } from 'lucide-react';
import { QRCategory } from '../../services/qrVaultStore.js';
import { formatUPIPaymentString, generateQRCodeDataUrl } from '../../utils/qrGenerator.js';

interface AddQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    category: QRCategory;
    upiId?: string;
    qrDataUrl: string;
    notes?: string;
  }) => Promise<void>;
}

export const AddQRModal: React.FC<AddQRModalProps> = ({ isOpen, onClose, onSave }) => {
  const [tab, setTab] = useState<'UPI' | 'UPLOAD'>('UPI');

  // Form State
  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [category, setCategory] = useState<QRCategory>('Personal');
  const [notes, setNotes] = useState('');
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGeneratePreview = async () => {
    if (!upiId.trim() || !name.trim()) return;
    try {
      const upiString = formatUPIPaymentString({ upiId, name });
      const generated = await generateQRCodeDataUrl(upiString);
      setPreviewDataUrl(generated);
    } catch (e) {
      console.warn('Preview generation failed:', e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedDataUrl(result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter a Payee or Pass Name.');
      return;
    }

    setLoading(true);
    try {
      let finalQrDataUrl = '';

      if (tab === 'UPI') {
        if (!upiId.trim()) {
          setError('Please enter a valid UPI ID (e.g. name@okaxis).');
          setLoading(false);
          return;
        }
        const upiString = formatUPIPaymentString({ upiId, name, note: notes });
        finalQrDataUrl = await generateQRCodeDataUrl(upiString);
      } else {
        if (!uploadedDataUrl) {
          setError('Please upload a QR Code image.');
          setLoading(false);
          return;
        }
        finalQrDataUrl = uploadedDataUrl;
      }

      await onSave({
        name: name.trim(),
        category,
        upiId: upiId.trim() || undefined,
        qrDataUrl: finalQrDataUrl,
        notes: notes.trim() || undefined,
      });

      // Reset and close
      setName('');
      setUpiId('');
      setNotes('');
      setUploadedDataUrl(null);
      setPreviewDataUrl(null);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save QR Code pass.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Add QR Pass to Vault</h3>
              <p className="text-xs text-slate-400">100% Offline & Locally Encrypted Storage</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setTab('UPI')}
            className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === 'UPI'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate from UPI ID</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('UPLOAD')}
            className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === 'UPLOAD'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload QR Image</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
              Pass / Payee Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Primary HDFC UPI, Swiggy Merchant, Wife GPay"
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
              Pass Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Personal', 'Business', 'Family', 'Merchant'] as QRCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    category === cat
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {tab === 'UPI' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                  UPI VPA / Handle *
                </label>
                <input
                  type="text"
                  required={tab === 'UPI'}
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  onBlur={handleGeneratePreview}
                  placeholder="e.g. sathwik@okaxis, 9876543210@ybl"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {previewDataUrl && (
                <div className="p-3 bg-white rounded-2xl flex items-center justify-center max-w-[160px] mx-auto shadow-lg">
                  <img src={previewDataUrl} alt="Preview QR" className="w-32 h-32 object-contain" />
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                Upload QR Image File *
              </label>
              <div className="relative border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 text-center bg-slate-950/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {uploadedDataUrl ? (
                  <div className="flex flex-col items-center space-y-2">
                    <img src={uploadedDataUrl} alt="Uploaded QR" className="w-24 h-24 object-contain rounded-xl bg-white p-2" />
                    <span className="text-xs text-emerald-400 font-bold">Image Uploaded Successfully</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="text-xs text-slate-400 font-medium">Click or Drag & Drop QR Image File</p>
                    <span className="text-[10px] text-slate-500">Supports PNG, JPG, WEBP</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
              Notes / Remarks (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Primary UPI for household grocery payments"
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              <span>{loading ? 'Encrypting & Saving...' : 'Save Pass to Vault'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
