import React, { useState, useRef, useMemo } from 'react';
import {
  Camera,
  Upload,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  Trash2,
  Plus,
  AlertTriangle,
  Receipt,
  CloudOff,
  ShieldAlert,
  RefreshCw,
  Edit3,
} from 'lucide-react';
import { Expense, CategoryItem } from '../types.js';
import { SpendTrackApi } from '../services/api.js';
import { offlineSyncManager } from '../services/offlineSyncManager.js';
import { formatCurrency } from '../utils/calculations.js';

interface EditableReceiptItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
}

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  expenses?: Expense[];
  onSaveExpenses: (expenses: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  onSaveNote?: (content: string, title?: string, tags?: string) => Promise<void>;
}

const SCAN_STEPS = [
  'Reading Receipt Image & Text…',
  'Analyzing GST, Amounts & Date…',
  'Matching Categories & Items…',
  'Verification Ready',
];

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  categories,
  expenses = [],
  onSaveExpenses,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isOfflineScan, setIsOfflineScan] = useState(false);

  // Extracted Result Form State
  const [merchant, setMerchant] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [currency, setCurrency] = useState('INR');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [category, setCategory] = useState('Groceries');
  const [receiptDriveFileId, setReceiptDriveFileId] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [receiptViewLink, setReceiptViewLink] = useState('');
  const [items, setItems] = useState<EditableReceiptItem[]>([]);
  const [confidences, setConfidences] = useState<Record<string, 'High' | 'Medium' | 'Low'>>({
    merchant: 'High',
    amount: 'High',
    purchaseDate: 'High',
    category: 'High',
    taxAmount: 'Low',
    invoiceNumber: 'Low',
    paymentMethod: 'Medium',
  });

  const [isReviewReady, setIsReviewReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Duplicate Check Modal State
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const totalPriceCalculated = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  }, [items]);

  // Duplicate Check
  const duplicateMatch = useMemo(() => {
    if (!merchant || !totalPriceCalculated || !purchaseDate) return null;
    return expenses.find((exp) => {
      const expMerchant = (exp.merchant || exp.itemName || '').toLowerCase();
      const currMerchant = merchant.toLowerCase();
      const matchMerchant = expMerchant.includes(currMerchant) || currMerchant.includes(expMerchant);
      const matchDate = exp.purchaseDate === purchaseDate;
      const matchAmount = Math.abs((exp.totalPrice || 0) - totalPriceCalculated) < 1;
      return matchMerchant && matchDate && matchAmount;
    });
  }, [expenses, merchant, totalPriceCalculated, purchaseDate]);

  if (!isOpen) return null;

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsScanning(false);
    setScanStepIndex(0);
    setErrorMessage(null);
    setScanError(null);
    setIsOfflineScan(false);
    setMerchant('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setTaxAmount(0);
    setCurrency('INR');
    setInvoiceNumber('');
    setPaymentMethod('UPI');
    setCategory('Groceries');
    setReceiptDriveFileId('');
    setReceiptFileName('');
    setReceiptViewLink('');
    setItems([]);
    setConfidences({});
    setIsReviewReady(false);
    setIsSaving(false);
    setShowDuplicateModal(false);
  };

  const handleFileChange = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMessage('Please upload a valid image (JPG, PNG, WEBP) or PDF receipt.');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setScanError(null);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleScanReceipt = async () => {
    if (!selectedFile || isScanning) return;

    setIsScanning(true);
    setErrorMessage(null);
    setScanError(null);
    setScanStepIndex(0);
    setIsOfflineScan(!navigator.onLine);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedFile);
      const base64Data = await base64Promise;

      setScanStepIndex(1);
      await new Promise((r) => setTimeout(r, 300));

      setScanStepIndex(2);

      let result: any = null;

      if (!navigator.onLine) {
        // Offline receipt capture fallback
        result = {
          merchant: selectedFile.name.replace(/\.[^/.]+$/, ''),
          purchaseDate: new Date().toISOString().split('T')[0],
          amount: 0,
          taxAmount: 0,
          currency: 'INR',
          invoiceNumber: `OFFLINE-${Date.now().toString().slice(-6)}`,
          paymentMethod: 'UPI',
          category: 'Groceries',
          confidences: {
            merchant: 'Low',
            amount: 'Low',
            purchaseDate: 'Medium',
            category: 'Low',
            taxAmount: 'Low',
            invoiceNumber: 'Low',
            paymentMethod: 'Low',
          },
          items: [
            {
              name: selectedFile.name,
              price: 0,
              quantity: 1,
            },
          ],
        };
      } else {
        result = await SpendTrackApi.scanReceipt({
          name: selectedFile.name,
          type: selectedFile.type,
          base64Data,
        });
      }

      setScanStepIndex(3);

      if (result.merchant) setMerchant(result.merchant);
      if (result.purchaseDate) setPurchaseDate(result.purchaseDate);
      if (typeof result.taxAmount === 'number') setTaxAmount(result.taxAmount);
      if (result.currency) setCurrency(result.currency);
      if (result.invoiceNumber) setInvoiceNumber(result.invoiceNumber);
      if (result.paymentMethod) setPaymentMethod(result.paymentMethod);
      if (result.category) setCategory(result.category);
      if (result.confidences) setConfidences(result.confidences);
      if (result.receiptDriveFileId) setReceiptDriveFileId(result.receiptDriveFileId);
      if (result.receiptFileName) setReceiptFileName(result.receiptFileName);
      if (result.receiptViewLink) setReceiptViewLink(result.receiptViewLink);

      const parsedItems: EditableReceiptItem[] = (result.items || []).map((it: any, idx: number) => ({
        id: `extracted_${Date.now()}_${idx}`,
        name: it.name || 'Item',
        category: it.category || result.category || 'Groceries',
        quantity: typeof it.quantity === 'number' ? it.quantity : 1,
        unit: it.unit || 'unit',
        price: typeof it.price === 'number' ? it.price : 0,
      }));

      setItems(parsedItems.length > 0 ? parsedItems : [
        {
          id: `item_${Date.now()}`,
          name: result.merchant || 'Receipt Purchase',
          category: result.category || 'Groceries',
          quantity: 1,
          unit: 'unit',
          price: Number(result.amount) || 0,
        }
      ]);
      setIsReviewReady(true);
    } catch (err: any) {
      console.error('Receipt scanning error:', err);
      setScanError("We couldn't analyze this receipt right now.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleEnterManually = () => {
    setMerchant(selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, '') : '');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setTaxAmount(0);
    setCurrency('INR');
    setInvoiceNumber('');
    setPaymentMethod('UPI');
    setCategory(categories[0]?.name || 'Groceries');
    setItems([
      {
        id: `manual_${Date.now()}`,
        name: selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, '') : 'Expense Item',
        category: categories[0]?.name || 'Groceries',
        quantity: 1,
        unit: 'unit',
        price: 0,
      },
    ]);
    setConfidences({
      merchant: 'Low',
      amount: 'Low',
      purchaseDate: 'Medium',
      category: 'Low',
      taxAmount: 'Low',
      invoiceNumber: 'Low',
      paymentMethod: 'Low',
    });
    setErrorMessage(null);
    setScanError(null);
    setIsReviewReady(true);
  };

  const handleInitiateSave = () => {
    if (items.length === 0) {
      setErrorMessage('Please add at least one line item to save.');
      return;
    }

    if (duplicateMatch) {
      setShowDuplicateModal(true);
      return;
    }

    executeFinalSave();
  };

  const executeFinalSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setShowDuplicateModal(false);

    try {
      const isOffline = !navigator.onLine;

      const expensePayloads: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>[] = items.map((it) => ({
        purchaseDate,
        itemName: it.name,
        category: it.category || category,
        merchant,
        taxAmount,
        currency,
        invoiceNumber,
        paymentMethod,
        quantity: Number(it.quantity) || 1,
        unit: it.unit || 'unit',
        totalPrice: Number(it.price) || 0,
        pricePerUnit: Number(it.price) / (Number(it.quantity) || 1),
        notes: `Receipt AI ${invoiceNumber ? `[Inv: ${invoiceNumber}]` : ''} ${isOffline ? '[Pending Sync]' : ''}`.trim(),
        receiptDriveFileId,
        receiptFileName: receiptFileName || selectedFile?.name || 'Receipt.jpg',
        receiptViewLink,
        source: 'receipt',
      }));

      if (isOffline) {
        for (const payload of expensePayloads) {
          await offlineSyncManager.queueMutation('expenses', 'CREATE', payload);
        }
      } else {
        try {
          const subtotalCalculated = items.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
          await SpendTrackApi.saveReceiptVault({
            merchant,
            invoiceNumber,
            purchaseDate,
            subtotal: subtotalCalculated,
            discount: 0,
            taxAmount,
            total: subtotalCalculated + (taxAmount || 0),
            paymentMethod,
            currency,
            receiptImage: previewUrl,
            items: items.map((it) => ({
              name: it.name,
              quantity: Number(it.quantity) || 1,
              unit: it.unit || 'unit',
              pricePerUnit: Number(it.price) / (Number(it.quantity) || 1),
              lineAmount: Number(it.price) || 0,
              category: it.category || category,
            })),
          });
        } catch (vaultErr) {
          console.warn('Failed to save to receipt vault:', vaultErr);
        }
      }

      await onSaveExpenses(expensePayloads);
      handleReset();
      onClose();
    } catch (err: any) {
      console.error('Failed to save receipt expenses:', err);
      setErrorMessage(err.message || 'Failed to save transaction to database.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderConfidenceBadge = (fieldKey: string) => {
    const level = confidences[fieldKey] || 'High';
    if (level === 'High') {
      return (
        <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          High Confidence
        </span>
      );
    }
    if (level === 'Medium') {
      return (
        <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
          Medium Confidence
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-1 border border-amber-500/30 animate-pulse">
        <AlertTriangle className="w-3 h-3" />
        Low Confidence — Verify
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-[430px] rounded-[32px] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-950 text-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">AI Receipt Intelligence</h2>
              <p className="text-[10px] text-slate-300">Convert receipts into PostgreSQL transactions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isReviewReady && (
            <div className="space-y-4">
              {/* Capture & Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-[28px] p-6 text-center transition-all ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'
                }`}
              >
                {previewUrl ? (
                  <div className="relative group max-h-48 overflow-hidden rounded-2xl mx-auto">
                    <img src={previewUrl} alt="Receipt preview" className="w-full h-48 object-contain rounded-2xl" />
                    <button
                      onClick={handleReset}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 py-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white">Upload Receipt File</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Supports JPG, PNG, WEBP or PDF receipt invoices
                      </p>
                    </div>

                    {/* Hidden Inputs */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*,application/pdf"
                      onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={cameraInputRef}
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                      className="hidden"
                    />

                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        onClick={() => cameraInputRef.current?.click()}
                        className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-sm hover:scale-105 transition-transform cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Take Photo</span>
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-sm hover:scale-105 transition-transform cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Browse File</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Error UI State & Actions */}
              {scanError && (
                <div className="p-4 rounded-[24px] bg-rose-500/10 border border-rose-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-rose-500">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black text-rose-600 dark:text-rose-400">Receipt AI Unavailable</h4>
                      <p className="text-[11px] text-rose-500 dark:text-rose-300">{scanError}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleScanReceipt}
                      disabled={isScanning}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                      <span>{isScanning ? 'Retrying…' : 'Retry'}</span>
                    </button>
                    <button
                      onClick={handleEnterManually}
                      className="flex-1 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Enter Manually</span>
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Action Trigger */}
              {selectedFile && !isScanning && !scanError && (
                <button
                  onClick={handleScanReceipt}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Extract Receipt Intelligence</span>
                </button>
              )}

              {/* Progress State */}
              {isScanning && (
                <div className="p-5 rounded-[28px] bg-slate-950 text-white space-y-4 text-center border border-emerald-500/30">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-white">{SCAN_STEPS[scanStepIndex]}</h4>
                    <p className="text-[10px] text-slate-400">Gemini 3.6 Vision OCR active</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* VERIFICATION & EDIT FORM SCREEN                              */}
          {/* ----------------------------------------------------------- */}
          {isReviewReady && (
            <div className="space-y-3.5">
              {isOfflineScan && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-bold flex items-center gap-2">
                  <CloudOff className="w-4 h-4 shrink-0" />
                  <span>Offline Mode: Receipt queued for auto-sync when network returns.</span>
                </div>
              )}

              {/* Merchant & Confidence */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Merchant</label>
                  {renderConfidenceBadge('merchant')}
                </div>
                <input
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="Merchant / Store Name"
                  className={`w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                    confidences.merchant === 'Low'
                      ? 'border-amber-500/50 bg-amber-500/5'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                />
              </div>

              {/* Date & Invoice Number */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Date</label>
                  </div>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Invoice #</label>
                  </div>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Invoice #"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Category & Payment Method */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="UPI">UPI / Google Pay</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="NetBanking">NetBanking</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              {/* Tax / GST */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Tax / GST Amount</label>
                  {renderConfidenceBadge('taxAmount')}
                </div>
                <input
                  type="number"
                  value={taxAmount || ''}
                  onChange={(e) => setTaxAmount(Number(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none font-mono"
                />
              </div>

              {/* Extracted Line Items */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Line Items ({items.length})
                  </h4>
                  <button
                    onClick={() =>
                      setItems((prev) => [
                        ...prev,
                        {
                          id: `item_${Date.now()}`,
                          name: 'Item Name',
                          category,
                          quantity: 1,
                          unit: 'unit',
                          price: 0,
                        },
                      ])
                    }
                    className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {items.map((it) => (
                    <div key={it.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                      <input
                        type="text"
                        value={it.name}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((x) => (x.id === it.id ? { ...x, name: e.target.value } : x))
                          )
                        }
                        className="flex-1 bg-transparent text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none"
                      />
                      <input
                        type="number"
                        value={it.price || ''}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((x) => (x.id === it.id ? { ...x, price: Number(e.target.value) || 0 } : x))
                          )
                        }
                        className="w-20 bg-transparent text-right text-xs font-black font-mono text-slate-900 dark:text-white focus:outline-none"
                      />
                      <button
                        onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
                        className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Card */}
              <div className="p-3 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase">Total Transaction</span>
                  <p className="text-xs text-emerald-400 font-bold">{paymentMethod} • {category}</p>
                </div>
                <span className="text-base font-black text-white font-mono">
                  {formatCurrency(totalPriceCalculated)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {isReviewReady && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-slate-50 dark:bg-slate-900 shrink-0">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 transition-colors cursor-pointer"
            >
              Re-scan
            </button>
            <button
              onClick={handleInitiateSave}
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Save Transaction</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Duplicate Warning Modal */}
      {showDuplicateModal && duplicateMatch && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[360px] rounded-[28px] p-5 border border-amber-500/40 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-500">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Likely Duplicate Detected</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              An expense for <strong className="text-slate-900 dark:text-white">"{duplicateMatch.merchant || duplicateMatch.itemName}"</strong> ({formatCurrency(duplicateMatch.totalPrice)}) on {duplicateMatch.purchaseDate} already exists in PostgreSQL.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Review / Edit
              </button>
              <button
                onClick={executeFinalSave}
                className="px-4 py-2 rounded-xl text-xs font-black text-white bg-amber-600 hover:bg-amber-500 shadow-md cursor-pointer"
              >
                Save Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
