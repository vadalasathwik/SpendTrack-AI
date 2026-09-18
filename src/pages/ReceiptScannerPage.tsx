import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Loader2,
  CheckCircle2,
  Trash2,
  Plus,
  Tag,
  Calendar as CalendarIcon,
  DollarSign,
  Store,
  FileText,
  X,
  AlertCircle,
  Receipt,
  FileSpreadsheet,
  Building,
  Check,
} from 'lucide-react';
import { CategoryItem, Expense } from '../types.js';
import { SpendTrackApi } from '../services/api.js';
import { GlassCard } from '../components/ui/GlassCard.js';

interface ExtractedItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ReceiptScannerPageProps {
  categories: CategoryItem[];
  onSaveExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onNavigateToExpenses?: () => void;
}

export const ReceiptScannerPage: React.FC<ReceiptScannerPageProps> = ({
  categories,
  onSaveExpense,
  onNavigateToExpenses,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const statementInputRef = useRef<HTMLInputElement>(null);

  const [activeMode, setActiveMode] = useState<'RECEIPT' | 'BANK_STATEMENT'>('RECEIPT');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Extraction State
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState('Uploading image…');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Extracted Editable Form State
  const [isExtracted, setIsExtracted] = useState(false);
  const [title, setTitle] = useState('');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [category, setCategory] = useState<string>('Groceries');
  const [items, setItems] = useState<ExtractedItem[]>([]);

  // Bank Statement Import State
  const [statementResult, setStatementResult] = useState<any>(null);

  const [isSaving, setIsSaving] = useState(false);

  const handleFileSelect = (file: File) => {
    setError(null);
    setSuccessMsg(null);
    setSelectedFile(file);

    if (activeMode === 'RECEIPT') {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid receipt image (JPEG, PNG, WEBP).');
        return;
      }
      setIsExtracted(false);
      const reader = new FileReader();
      reader.onload = () => {
        const resultStr = reader.result as string;
        setPreviewUrl(resultStr);
        setBase64Data(resultStr);
      };
      reader.readAsDataURL(file);
    } else {
      // Bank Statement Import
      handleImportStatement(file);
    }
  };

  const handleImportStatement = async (file: File) => {
    setIsScanning(true);
    setScanStep('Parsing PDF / CSV bank statement transactions with Gemini AI…');
    try {
      const result = await SpendTrackApi.importBankStatement({
        fileName: file.name,
      });
      setStatementResult(result);
      setSuccessMsg(`Bank Statement "${file.name}" imported with ${result.totalRowsProcessed} transactions categorized!`);
    } catch (err: any) {
      setError(err.message || 'Failed to parse bank statement.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleScanReceipt = async () => {
    if (!base64Data) {
      setError('Please upload or capture a receipt image first.');
      return;
    }

    setIsScanning(true);
    setError(null);
    setSuccessMsg(null);
    setScanStep('Uploading receipt to Gemini 2.5 Vision…');

    try {
      const mimeType = selectedFile?.type || 'image/jpeg';
      setScanStep('Extracting merchant, items, and total amount…');

      const extracted = await SpendTrackApi.scanReceipt({
        name: selectedFile?.name || 'receipt.jpg',
        type: mimeType,
        base64Data,
      });

      setTitle(extracted.title || extracted.merchant || 'Receipt Purchase');
      setMerchant(extracted.merchant || extracted.title || 'Store Merchant');
      setAmount(String(extracted.amount || extracted.total || 0));
      setPurchaseDate(
        extracted.purchaseDate || extracted.date || new Date().toISOString().split('T')[0]
      );
      setCategory(extracted.category || 'Groceries');

      if (Array.isArray(extracted.items) && extracted.items.length > 0) {
        setItems(
          extracted.items.map((item: any, idx: number) => ({
            id: `item_${Date.now()}_${idx}`,
            name: item.name || 'Item',
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
          }))
        );
      } else {
        setItems([
          {
            id: `item_${Date.now()}_0`,
            name: extracted.title || 'Receipt Item',
            price: Number(extracted.amount) || 0,
            quantity: 1,
          },
        ]);
      }

      setIsExtracted(true);
      setSuccessMsg('Receipt scanned successfully! Review extracted items below.');
    } catch (err: any) {
      console.error('Scan receipt error:', err);
      setError(err.message || 'Failed to extract receipt data using Gemini Vision.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveScannedExpense = async () => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid total price.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter an expense title.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSaveExpense({
        itemName: title.trim(),
        totalPrice: numAmount,
        category,
        purchaseDate,
        notes: `Merchant: ${merchant} | Scanned via Gemini 2.5 Flash AI Vision`,
        source: 'receipt',
      });

      setSuccessMsg(`Expense "${title}" saved successfully to PostgreSQL!`);
      setSelectedFile(null);
      setPreviewUrl(null);
      setBase64Data(null);
      setIsExtracted(false);
      setTitle('');
      setMerchant('');
      setAmount('');
      setItems([]);

      if (onNavigateToExpenses) {
        setTimeout(() => {
          onNavigateToExpenses();
        }, 1200);
      }
    } catch (err: any) {
      console.error('Save expense error:', err);
      setError(err.message || 'Failed to save expense.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-28 max-w-[1440px] mx-auto text-slate-900 dark:text-white" id="receipt-scanner-page">
      {/* Header Banner & Mode Selector */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[18px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/60">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                AI Receipt & Statement Import Intelligence v4.8.0
              </h1>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Gemini 2.5 Flash Vision
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Scan receipts or import PDF / CSV Bank Statements with AI Confidence Indicators
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start sm:self-center">
          <button
            onClick={() => setActiveMode('RECEIPT')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeMode === 'RECEIPT'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Receipt Scanner
          </button>
          <button
            onClick={() => setActiveMode('BANK_STATEMENT')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeMode === 'BANK_STATEMENT'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Statement Import (PDF/CSV)
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-[16px] bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-[16px] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeMode === 'RECEIPT' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (5 Cols): Upload & Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-[22px] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Receipt Image Upload</h3>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-[18px] text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-400'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Drag & Drop receipt image here
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Supports PNG, JPG, WEBP formats</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Capture with Camera</span>
              </button>

              {previewUrl && (
                <div className="space-y-3 pt-2">
                  <div className="relative rounded-[16px] overflow-hidden border border-slate-200 dark:border-slate-700 max-h-[300px] flex items-center justify-center bg-slate-950">
                    <img src={previewUrl} alt="Receipt preview" className="object-contain max-h-[300px] w-full" />
                  </div>
                  <button
                    type="button"
                    disabled={isScanning}
                    onClick={handleScanReceipt}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{scanStep}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Extract with Gemini Vision</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (7 Cols): Editable Extracted Form */}
          <div className="lg:col-span-7">
            {isExtracted ? (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[22px] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Review Extracted Expense
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Expense Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Merchant</label>
                    <input
                      type="text"
                      value={merchant}
                      onChange={(e) => setMerchant(e.target.value)}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Total Amount (₹)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    >
                      {categories.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleSaveScannedExpense}
                  disabled={isSaving}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  {isSaving ? 'Saving to PostgreSQL…' : 'Confirm & Save Expense'}
                </button>
              </div>
            ) : (
              <GlassCard className="p-12 text-center text-slate-400">
                Upload a receipt image and click "Extract with Gemini Vision" to inspect parsed items.
              </GlassCard>
            )}
          </div>
        </div>
      ) : (
        /* PHASE 1: STATEMENT IMPORT INTELLIGENCE WORKSPACE */
        <div className="space-y-6">
          <GlassCard className="p-6 space-y-4">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Bank Statement Import (PDF / CSV / Excel)
            </h3>
            <p className="text-xs text-slate-400">
              Select or drop your PDF Bank Statement to automatically categorize debits/credits with AI confidence indicators.
            </p>

            <input
              type="file"
              ref={statementInputRef}
              accept=".pdf,.csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />

            <button
              type="button"
              onClick={() => statementInputRef.current?.click()}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Upload className="w-4 h-4" />
              <span>Select Statement File (PDF / CSV)</span>
            </button>
          </GlassCard>

          {statementResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-[28px] p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Imported File: {statementResult.fileName}</span>
                  <h3 className="text-lg font-black text-white">Parsed Transactions ({statementResult.totalRowsProcessed})</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 block uppercase">Average AI Confidence</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">{statementResult.averageConfidence}%</span>
                </div>
              </div>

              {/* Transactions Table with AI Confidence Badges */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Merchant / Description</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Account</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                      <th className="p-3 text-center">AI Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {statementResult.transactions?.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-slate-400">{tx.date}</td>
                        <td className="p-3 font-bold text-white">{tx.merchant} <span className="text-[10px] text-slate-500 block font-normal">{tx.description}</span></td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-extrabold text-[10px]">
                            {tx.category}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{tx.mappedAccount}</td>
                        <td className={`p-3 text-right font-mono font-black ${tx.type === 'DEBIT' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {tx.type === 'DEBIT' ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black">
                            {tx.confidenceScore}% AI Conf.
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
