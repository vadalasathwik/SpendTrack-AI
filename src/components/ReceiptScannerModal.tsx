import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  Trash2,
  Plus,
  FileSpreadsheet,
  HardDrive,
  Calendar,
  DollarSign,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { Expense, CategoryItem } from '../types.js';
import { SpendTrackApi } from '../services/api.js';

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
  onSaveExpenses: (expenses: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
}

const SCAN_STEPS = [
  'Uploading Receipt…',
  'Reading Receipt…',
  'Extracting Items…',
  'Ready for Review',
];

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSaveExpenses,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result / Edit Form State
  const [merchant, setMerchant] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptDriveFileId, setReceiptDriveFileId] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [receiptViewLink, setReceiptViewLink] = useState('');
  const [items, setItems] = useState<EditableReceiptItem[]>([]);
  const [isReviewReady, setIsReviewReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsScanning(false);
    setScanStepIndex(0);
    setErrorMessage(null);
    setMerchant('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setReceiptDriveFileId('');
    setReceiptFileName('');
    setReceiptViewLink('');
    setItems([]);
    setIsReviewReady(false);
    setIsSaving(false);
  };

  const handleFileChange = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMessage('Please upload a valid image (JPG, PNG, WEBP) or PDF receipt.');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);

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
    if (!selectedFile) return;

    setIsScanning(true);
    setErrorMessage(null);
    setScanStepIndex(0); // 1. Uploading Receipt…

    try {
      // Convert file to Base64 string
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedFile);
      const base64Data = await base64Promise;

      setScanStepIndex(1); // 2. Reading Receipt…
      await new Promise((r) => setTimeout(r, 600));

      setScanStepIndex(2); // 3. Extracting Items…

      // Call API
      const result = await SpendTrackApi.scanReceipt({
        name: selectedFile.name,
        type: selectedFile.type,
        base64Data,
      });

      setScanStepIndex(3); // 4. Ready for Review

      if (result.merchant) setMerchant(result.merchant);
      if (result.purchaseDate) setPurchaseDate(result.purchaseDate);
      if (result.receiptDriveFileId) setReceiptDriveFileId(result.receiptDriveFileId);
      if (result.receiptFileName) setReceiptFileName(result.receiptFileName);
      if (result.receiptViewLink) setReceiptViewLink(result.receiptViewLink);

      const parsedItems: EditableReceiptItem[] = (result.items || []).map((it, idx) => ({
        id: `extracted_${Date.now()}_${idx}`,
        name: it.name || 'Item',
        category: it.category || 'Groceries',
        quantity: typeof it.quantity === 'number' ? it.quantity : 1,
        unit: it.unit || 'unit',
        price: typeof it.price === 'number' ? it.price : 0,
      }));

      setItems(parsedItems);
      setIsReviewReady(true);
    } catch (err: any) {
      console.error('Receipt scanning error:', err);
      setErrorMessage(err.message || 'Failed to scan receipt. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleItemChange = (id: string, field: keyof EditableReceiptItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: 'New Item',
        category: categories[0]?.name || 'Groceries',
        quantity: 1,
        unit: 'unit',
        price: 0,
      },
    ]);
  };

  const handleSaveAll = async () => {
    if (items.length === 0) {
      setErrorMessage('Please add at least one item to save.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      // Map extracted items into separate expense rows linked to receipt Drive URL
      const expensePayloads: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>[] = items.map((it) => ({
        purchaseDate,
        itemName: it.name,
        category: it.category,
        quantity: Number(it.quantity) || 1,
        unit: it.unit || 'unit',
        totalPrice: Number(it.price) || 0,
        pricePerUnit: Number(it.price) / (Number(it.quantity) || 1),
        notes: `Extracted from receipt: ${merchant}`,
        receiptDriveFileId,
        receiptFileName: receiptFileName || selectedFile?.name || 'Receipt.jpg',
        receiptViewLink,
      }));

      await onSaveExpenses(expensePayloads);
      handleReset();
      onClose();
    } catch (err: any) {
      console.error('Failed to save receipt expenses:', err);
      setErrorMessage(err.message || 'Failed to save expenses to Google Sheets.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalCalculated = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto selection:bg-emerald-100">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-8 shadow-2xl border border-slate-100 relative my-6 max-h-[90vh] flex flex-col justify-between overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/25">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>AI Receipt Scanner</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/60">
                  Gemini Vision
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Upload or photograph a receipt to auto-extract items to Google Sheets
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6">

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <p className="font-semibold flex-1">{errorMessage}</p>
            </div>
          )}

          {/* STEP 1: Upload / Dropzone & Camera Section (If review not ready) */}
          {!isReviewReady && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center relative overflow-hidden group ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-50/70 scale-[1.01]'
                    : selectedFile
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-emerald-400 bg-slate-50/80 hover:bg-emerald-50/10'
                }`}
              >
                {previewUrl ? (
                  <div className="relative group/prev max-h-56">
                    <img
                      src={previewUrl}
                      alt="Receipt preview"
                      className="max-h-52 rounded-2xl object-contain shadow-md border border-slate-200"
                    />
                    <div className="mt-3 text-xs font-bold text-slate-700">
                      {selectedFile?.name} ({(selectedFile!.size / 1024).toFixed(0)} KB)
                    </div>
                  </div>
                ) : selectedFile ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-slate-800">{selectedFile.name}</span>
                    <span className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(0)} KB</span>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shadow-2xs mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-7 h-7 stroke-[2]" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Drag & Drop receipt or browse file
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports JPG, PNG, WEBP, or PDF invoices
                    </p>
                  </>
                )}

                {/* Hidden Inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                />
              </div>

              {/* Action Buttons: Camera Capture & Browse */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>Take Photo with Camera</span>
                </button>

                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleScanReceipt}
                    disabled={isScanning}
                    className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-75"
                  >
                    {isScanning ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>Scan with Gemini AI</span>
                  </button>
                )}
              </div>

              {/* Scan Animation & Progress Indicator */}
              {isScanning && (
                <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-4 shadow-xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      Gemini Vision OCR Processing
                    </span>
                    <span className="text-xs font-mono text-slate-400">Step {scanStepIndex + 1} / 4</span>
                  </div>

                  {/* Steps Progress Checklist */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SCAN_STEPS.map((stepText, idx) => {
                      const isDone = idx < scanStepIndex;
                      const isCurrent = idx === scanStepIndex;
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                            isDone
                              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                              : isCurrent
                              ? 'bg-slate-800 border-emerald-400 text-white animate-pulse'
                              : 'bg-slate-800/40 border-slate-700/50 text-slate-500'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : isCurrent ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400 shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full bg-slate-700 shrink-0" />
                          )}
                          <span className="truncate">{stepText}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Review & Editable Items Table (Once scanned) */}
          {isReviewReady && (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Receipt Metadata Header Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Store / Merchant
                  </label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    placeholder="e.g. D-Mart, Reliance, Kirana Store"
                    className="w-full px-3.5 py-2 text-sm font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Extracted Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Extracted Items ({items.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider">
                        <th className="p-3">Item Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 w-20">Qty</th>
                        <th className="p-3 w-24">Unit</th>
                        <th className="p-3 w-28">Price (₹)</th>
                        <th className="p-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Item Name */}
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                              className="w-full px-2.5 py-1.5 font-bold text-slate-900 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                          </td>

                          {/* Category */}
                          <td className="p-2.5">
                            <select
                              value={item.category}
                              onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                              className="w-full px-2 py-1.5 font-semibold text-slate-800 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            >
                              {categories.map((c) => (
                                <option key={c.name} value={c.name}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Qty */}
                          <td className="p-2.5">
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                              className="w-full px-2 py-1.5 font-bold text-slate-900 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none text-center"
                            />
                          </td>

                          {/* Unit */}
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                              className="w-full px-2 py-1.5 text-slate-700 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                          </td>

                          {/* Price */}
                          <td className="p-2.5">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.price}
                              onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                              className="w-full px-2.5 py-1.5 font-extrabold text-emerald-700 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none text-right"
                            />
                          </td>

                          {/* Delete Item */}
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Summary Footer */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-bold text-slate-600">
                  Total Calculated Amount ({items.length} items)
                </span>
                <span className="text-lg font-black text-emerald-800">
                  ₹{totalCalculated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          {isReviewReady ? (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              Scan Another Receipt
            </button>
          ) : (
            <span className="text-xs text-slate-400 font-medium">
              Powered by Google Gemini 2.5 Vision
            </span>
          )}

          {isReviewReady && (
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving || items.length === 0}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-75 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Save All to Google Sheets</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
