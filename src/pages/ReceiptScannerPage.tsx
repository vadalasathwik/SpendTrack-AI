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
} from 'lucide-react';
import { CategoryItem, Expense } from '../types.js';
import { SpendTrackApi } from '../services/api.js';

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

  const [isSaving, setIsSaving] = useState(false);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setSelectedFile(file);
    setIsExtracted(false);

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      setPreviewUrl(resultStr);
      setBase64Data(resultStr);
    };
    reader.readAsDataURL(file);
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

      // Normalize extracted data
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
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.message || 'Failed to scan receipt with Gemini AI.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}_${prev.length}`,
        name: 'New Line Item',
        price: 0,
        quantity: 1,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof ExtractedItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleSaveToExpenses = async () => {
    const numAmount = parseFloat(amount);
    if (!title.trim()) {
      setError('Please enter a valid title for the expense.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
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
      // Reset form
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
    <div className="space-y-6 pb-20 max-w-[1440px] mx-auto text-slate-900 dark:text-white" id="receipt-scanner-page">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[18px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/60">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                AI Receipt Scanner
              </h1>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Gemini 2.5 Flash Vision
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Upload or snap a receipt image to automatically extract items, merchant, and total into PostgreSQL
            </p>
          </div>
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

      {/* Main Grid: Upload & Preview on Left, Extraction Form on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Upload & Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-[22px] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Receipt Image Upload</h3>

            {/* Hidden Input Files */}
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

            {/* Drag and Drop Zone */}
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

            {/* Camera Upload Button */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="w-full py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Capture with Camera</span>
            </button>

            {/* Image Preview */}
            {previewUrl && (
              <div className="space-y-3 pt-2">
                <div className="relative rounded-[16px] overflow-hidden border border-slate-200 dark:border-slate-700 max-h-72 flex items-center justify-center bg-slate-950">
                  <img src={previewUrl} alt="Receipt Preview" className="max-h-72 object-contain" />
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setBase64Data(null);
                      setIsExtracted(false);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors"
                    title="Clear Image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  id="scan-receipt-ai-btn"
                  onClick={handleScanReceipt}
                  disabled={isScanning}
                  className="w-full py-3 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-[14px] shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Scanning with Gemini AI…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 stroke-[2.5]" />
                      <span>Extract Receipt with Gemini AI</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 Cols): Editable Extracted Form */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[22px] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {isExtracted ? 'Extracted Receipt Details' : 'Receipt Details'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isExtracted
                    ? 'Review and edit extracted fields before saving to PostgreSQL'
                    : 'Upload a receipt image and click extract to auto-fill details'}
                </p>
              </div>

              {isExtracted && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  AI Parsed
                </span>
              )}
            </div>

            {/* Loading Indicator Overlay */}
            {isScanning && (
              <div className="p-8 rounded-[18px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto" />
                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{scanStep}</p>
                <p className="text-[11px] text-slate-400">Analyzing OCR image using Gemini 2.5 Flash Vision API</p>
              </div>
            )}

            {/* Editable Fields Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expense Title <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      id="receipt-title-input"
                      placeholder="e.g. Supermarket Grocery"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                    />
                  </div>
                </div>

                {/* Merchant */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Merchant / Store Name
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      id="receipt-merchant-input"
                      placeholder="e.g. Walmart / Target"
                      value={merchant}
                      onChange={(e) => setMerchant(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="number"
                      step="any"
                      id="receipt-amount-input"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                    />
                  </div>
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Purchase Date
                  </label>
                  <div className="relative">
                    <CalendarIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="date"
                      id="receipt-date-input"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <div className="relative">
                    <Tag className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <select
                      id="receipt-category-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                    >
                      {categories.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Extracted Line Items Section */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Line Items ({items.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-[12px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-medium"
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Price"
                        value={item.price}
                        onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-bold text-right"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Footer: Save to Expenses */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                <button
                  type="button"
                  id="save-scanned-expense-btn"
                  onClick={handleSaveToExpenses}
                  disabled={isSaving || !title.trim() || !amount}
                  className="px-6 py-3 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-[14px] shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? 'Saving to Database…' : 'Save Expense to Database'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
