import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  Calendar,
  Check,
  FileText,
  AlertCircle,
  Camera,
  Trash2,
  Plus,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  RefreshCw,
  Edit3,
  ShieldAlert,
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

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  categories: CategoryItem[];
  editExpense?: Expense | null;
  initialMode?: 'manual' | 'scan';
  expenses?: Expense[];
}

const PRESET_CATEGORIES = ['Groceries', 'Gas', 'Bills', 'Shopping', 'Travel', 'Household'];
const PAYMENT_METHODS = ['UPI', 'Cash', 'Credit Card', 'Debit Card', 'Bank Transfer'];

const AUTOFILL_RULES: Array<{ keywords: string[]; category: string }> = [
  { keywords: ['rice', 'flour', 'atta', 'dal', 'pulses', 'oil', 'sugar', 'salt', 'egg', 'bread', 'veggie', 'vegetable', 'fruit'], category: 'Groceries' },
  { keywords: ['milk'], category: 'Groceries' },
  { keywords: ['cooking gas', 'gas cylinder', 'lpg', 'gas'], category: 'Gas' },
  { keywords: ['wifi', 'internet', 'broadband', 'electricity', 'water', 'bill', 'recharge', 'mobile bill', 'rent'], category: 'Bills' },
  { keywords: ['petrol', 'diesel', 'fuel', 'cab', 'uber', 'ola', 'taxi', 'flight', 'train', 'bus'], category: 'Travel' },
  { keywords: ['shirt', 'pants', 'shoes', 'clothes', 'dress', 'jacket', 't-shirt', 'laptop', 'phone'], category: 'Shopping' },
  { keywords: ['detergent', 'soap', 'shampoo', 'tissue', 'cleaner', 'mop', 'trash bag', 'dishwash'], category: 'Household' },
];

const SCAN_STEPS = [
  'Uploading Receipt Image to Gemini Vision…',
  'Analyzing Merchant, Amounts & Date…',
  'Matching Categories & Tax Details…',
  'Review & Confirmation Ready',
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  editExpense,
  initialMode = 'manual',
  expenses = [],
}) => {
  const [mode, setMode] = useState<'manual' | 'scan'>(initialMode);

  // Manual Form State
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [totalPrice, setTotalPrice] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [userSelectedCategory, setUserSelectedCategory] = useState(false);

  // Receipt attachment state
  const [receiptDriveFileId, setReceiptDriveFileId] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [receiptViewLink, setReceiptViewLink] = useState<string>('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Scan Receipt Flow State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isReviewReady, setIsReviewReady] = useState(false);

  // Scan extracted review fields
  const [scanMerchant, setScanMerchant] = useState('');
  const [scanDate, setScanDate] = useState(new Date().toISOString().split('T')[0]);
  const [scanCategory, setScanCategory] = useState('Groceries');
  const [scanAmount, setScanAmount] = useState<string>('');
  const [scanPaymentMethod, setScanPaymentMethod] = useState('UPI');
  const [scanNotes, setScanNotes] = useState('');
  const [scanInvoiceNumber, setScanInvoiceNumber] = useState('');
  const [scanTaxAmount, setScanTaxAmount] = useState<number>(0);
  const [scanItems, setScanItems] = useState<EditableReceiptItem[]>([]);
  const [confidences, setConfidences] = useState<Record<string, 'High' | 'Medium' | 'Low'>>({
    merchant: 'High',
    amount: 'High',
    purchaseDate: 'High',
    category: 'High',
  });

  // Duplicate Check Modal State
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // Google Calendar Reminder state
  const [hasCalendarReminder, setHasCalendarReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState(new Date().toISOString().split('T')[0]);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [notificationBefore, setNotificationBefore] = useState(1440);
  const [calendarEventId, setCalendarEventId] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Input refs
  const itemNameInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanFileInputRef = useRef<HTMLInputElement>(null);
  const scanCameraInputRef = useRef<HTMLInputElement>(null);

  // Total price calculated for scanned items
  const scannedItemsTotal = useMemo(() => {
    if (scanItems.length === 0) return parseFloat(scanAmount) || 0;
    return scanItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  }, [scanItems, scanAmount]);

  // Sync total price when scan line items change
  useEffect(() => {
    if (isReviewReady && scanItems.length > 0) {
      const sum = scanItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
      setScanAmount(String(sum));
    }
  }, [scanItems, isReviewReady]);

  // Duplicate Check calculation
  const duplicateMatch = useMemo(() => {
    const targetMerchant = mode === 'scan' ? scanMerchant : itemName;
    const targetAmount = mode === 'scan' ? (parseFloat(scanAmount) || scannedItemsTotal) : (parseFloat(totalPrice) || 0);
    const targetDate = mode === 'scan' ? scanDate : purchaseDate;

    if (!targetMerchant || !targetAmount || !targetDate) return null;
    return expenses.find((exp) => {
      const expMerchant = (exp.merchant || exp.itemName || '').toLowerCase();
      const currMerchant = targetMerchant.toLowerCase();
      const matchMerchant = expMerchant.includes(currMerchant) || currMerchant.includes(expMerchant);
      const matchDate = exp.purchaseDate === targetDate;
      const matchAmount = Math.abs((exp.totalPrice || 0) - targetAmount) < 1;
      return matchMerchant && matchDate && matchAmount;
    });
  }, [expenses, mode, scanMerchant, scanAmount, scannedItemsTotal, scanDate, itemName, totalPrice, purchaseDate]);

  // Sync edit mode or reset for new expense
  useEffect(() => {
    setMode(initialMode);
    if (editExpense) {
      setMode('manual');
      setItemName(editExpense.itemName || '');
      setCategory(editExpense.category || 'Groceries');
      setTotalPrice(editExpense.totalPrice ? String(editExpense.totalPrice) : '');
      setPurchaseDate(editExpense.purchaseDate || new Date().toISOString().split('T')[0]);
      setPaymentMethod(editExpense.paymentMethod || 'UPI');
      setNotes(editExpense.notes || '');
      setReceiptDriveFileId(editExpense.receiptDriveFileId || '');
      setReceiptFileName(editExpense.receiptFileName || '');
      setReceiptViewLink(editExpense.receiptViewLink || '');
      setCalendarEventId(editExpense.calendarEventId || '');
      setHasCalendarReminder(Boolean(editExpense.calendarEventId));
      setReminderDate(editExpense.purchaseDate || new Date().toISOString().split('T')[0]);
      setUserSelectedCategory(true);
    } else {
      resetForms();
    }
    setFormError(null);
    setUploadError(null);
    setScanError(null);
    setSuccessNotice(null);

    if (isOpen && mode === 'manual') {
      setTimeout(() => {
        itemNameInputRef.current?.focus();
      }, 100);
    }
  }, [editExpense, isOpen, initialMode]);

  const resetForms = () => {
    setItemName('');
    setCategory('Groceries');
    setTotalPrice('');
    const today = new Date().toISOString().split('T')[0];
    setPurchaseDate(today);
    setPaymentMethod('UPI');
    setNotes('');
    setReceiptDriveFileId('');
    setReceiptFileName('');
    setReceiptViewLink('');
    setHasCalendarReminder(false);
    setReminderDate(today);
    setReminderTime('09:00');
    setNotificationBefore(1440);
    setCalendarEventId('');
    setUserSelectedCategory(false);

    // Reset Scan State
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsScanning(false);
    setScanStepIndex(0);
    setScanError(null);
    setIsReviewReady(false);
    setScanMerchant('');
    setScanDate(today);
    setScanCategory('Groceries');
    setScanAmount('');
    setScanPaymentMethod('UPI');
    setScanNotes('');
    setScanInvoiceNumber('');
    setScanTaxAmount(0);
    setScanItems([]);
    setShowDuplicateModal(false);
  };

  // Smart Autofill category selection when typing item name
  const handleItemNameChange = (val: string) => {
    setItemName(val);
    if (!userSelectedCategory && !editExpense && val.trim().length >= 2) {
      const lower = val.toLowerCase().trim();
      for (const rule of AUTOFILL_RULES) {
        if (rule.keywords.some((kw) => lower.includes(kw))) {
          setCategory(rule.category);
          break;
        }
      }
    }
  };

  if (!isOpen) return null;

  const categoryNamesSet = new Set([...PRESET_CATEGORIES, ...categories.map((c) => c.name)]);
  const allCategoryChips = Array.from(categoryNamesSet);
  const numPrice = parseFloat(totalPrice) || 0;

  // Handle Receipt Upload to Google Drive / local compress for Manual mode
  const handleManualReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingReceipt(true);
    setUploadError(null);

    try {
      setReceiptDriveFileId(`rec_${Date.now()}`);
      setReceiptFileName(file.name);
      setReceiptViewLink('#');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process receipt image.');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  // Handle Scan Receipt Selection & Processing
  const handleScanFileSelect = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setScanError('Please select a valid image (JPG, PNG, WEBP) or PDF receipt.');
      return;
    }

    setSelectedFile(file);
    setScanError(null);
    setIsReviewReady(false);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const executeReceiptScan = async () => {
    if (!selectedFile || isScanning) return;

    setIsScanning(true);
    setScanError(null);
    setScanStepIndex(0);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedFile);
      const base64Data = await base64Promise;

      setScanStepIndex(1);
      await new Promise((r) => setTimeout(r, 200));

      setScanStepIndex(2);

      const result = await SpendTrackApi.scanReceipt({
        name: selectedFile.name,
        type: selectedFile.type || 'image/jpeg',
        base64Data,
      });

      setScanStepIndex(3);

      const extractedMerchant = result.merchant || result.title || selectedFile.name.replace(/\.[^/.]+$/, '');
      const extractedAmount = typeof result.amount === 'number' ? String(result.amount) : (result.total ? String(result.total) : '0');
      const extractedDate = result.purchaseDate || result.date || new Date().toISOString().split('T')[0];
      const extractedCategory = result.category || 'Groceries';
      const extractedPaymentMethod = result.paymentMethod || 'UPI';

      setScanMerchant(extractedMerchant);
      setScanAmount(extractedAmount);
      setScanDate(extractedDate);
      setScanCategory(extractedCategory);
      setScanPaymentMethod(extractedPaymentMethod);
      if (result.invoiceNumber) setScanInvoiceNumber(result.invoiceNumber);
      if (typeof result.taxAmount === 'number') setScanTaxAmount(result.taxAmount);
      if (result.confidences) setConfidences(result.confidences);

      setReceiptDriveFileId(result.receiptDriveFileId || `rec_${Date.now()}`);
      setReceiptFileName(result.receiptFileName || selectedFile.name);
      setReceiptViewLink(result.receiptViewLink || previewUrl || '#');

      const parsedItems: EditableReceiptItem[] = (result.items || []).map((it: any, idx: number) => ({
        id: `extracted_${Date.now()}_${idx}`,
        name: it.name || 'Item',
        category: it.category || extractedCategory,
        quantity: typeof it.quantity === 'number' ? it.quantity : 1,
        unit: it.unit || 'unit',
        price: typeof it.price === 'number' ? it.price : 0,
      }));

      setScanItems(parsedItems.length > 0 ? parsedItems : [
        {
          id: `item_${Date.now()}`,
          name: extractedMerchant,
          category: extractedCategory,
          quantity: 1,
          unit: 'unit',
          price: Number(extractedAmount) || 0,
        },
      ]);

      setIsReviewReady(true);
    } catch (err: any) {
      console.error('Receipt AI scanning failure:', err);
      setScanError(err.message || "Could not read receipt image with AI. Please retry or enter manually.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleFallbackToManual = () => {
    if (selectedFile) {
      setReceiptDriveFileId(`rec_${Date.now()}`);
      setReceiptFileName(selectedFile.name);
      setReceiptViewLink(previewUrl || '#');
      if (scanMerchant) setItemName(scanMerchant);
      if (scanAmount) setTotalPrice(scanAmount);
      if (scanCategory) setCategory(scanCategory);
      if (scanDate) setPurchaseDate(scanDate);
    }
    setMode('manual');
    setScanError(null);
  };

  const validateManualForm = () => {
    if (!itemName.trim()) {
      setFormError('Please enter an item name.');
      itemNameInputRef.current?.focus();
      return null;
    }

    if (isNaN(numPrice) || numPrice <= 0) {
      setFormError('Please enter a valid positive amount.');
      priceInputRef.current?.focus();
      return null;
    }

    return {
      itemName: itemName.trim(),
      merchant: itemName.trim(),
      category,
      totalPrice: numPrice,
      purchaseDate,
      paymentMethod,
      notes: notes.trim() || undefined,
      receiptDriveFileId: receiptDriveFileId || undefined,
      receiptFileName: receiptFileName || undefined,
      receiptViewLink: receiptViewLink || undefined,
      calendarEventId: calendarEventId || undefined,
      source: 'manual' as const,
    };
  };

  const validateScanForm = () => {
    const parsedAmt = parseFloat(scanAmount) || scannedItemsTotal;
    if (!scanMerchant.trim()) {
      setFormError('Please enter a merchant name.');
      return null;
    }
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setFormError('Please enter a valid total amount.');
      return null;
    }

    const noteDetails = [
      scanNotes.trim(),
      scanInvoiceNumber ? `Inv: ${scanInvoiceNumber}` : '',
      `Receipt AI Scanned`
    ].filter(Boolean).join(' | ');

    return {
      itemName: scanMerchant.trim(),
      merchant: scanMerchant.trim(),
      category: scanCategory,
      totalPrice: parsedAmt,
      purchaseDate: scanDate,
      paymentMethod: scanPaymentMethod,
      taxAmount: scanTaxAmount || undefined,
      invoiceNumber: scanInvoiceNumber || undefined,
      notes: noteDetails || undefined,
      receiptDriveFileId: receiptDriveFileId || `rec_${Date.now()}`,
      receiptFileName: receiptFileName || selectedFile?.name || 'Receipt.jpg',
      receiptViewLink: receiptViewLink || previewUrl || '#',
      source: 'receipt' as const,
    };
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    setSuccessNotice(null);

    const payload = mode === 'manual' ? validateManualForm() : validateScanForm();
    if (!payload) return;

    if (duplicateMatch && !showDuplicateModal) {
      setShowDuplicateModal(true);
      return;
    }

    executeSavePayload(payload);
  };

  const executeSavePayload = async (payload: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    setShowDuplicateModal(false);
    try {
      setIsSubmitting(true);
      await onSave(payload);

      // Save to receipt vault in background if scanned
      if (mode === 'scan') {
        try {
          await SpendTrackApi.saveReceiptVault({
            merchant: payload.merchant,
            invoiceNumber: scanInvoiceNumber,
            purchaseDate: payload.purchaseDate,
            total: payload.totalPrice,
            paymentMethod: payload.paymentMethod,
            category: payload.category,
            receiptImage: previewUrl,
            items: scanItems.map((it) => ({
              name: it.name,
              quantity: it.quantity,
              pricePerUnit: it.price,
              lineAmount: it.price,
            })),
          });
        } catch (vErr) {
          console.warn('Receipt vault background save warning:', vErr);
        }
      }

      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderConfidenceBadge = (fieldKey: string) => {
    const level = confidences[fieldKey] || 'High';
    if (level === 'High') {
      return (
        <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          High AI Confidence
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-1 border border-amber-500/30">
        <AlertTriangle className="w-3 h-3" /> Verify Value
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 overflow-hidden">
      <div
        id="add-expense-modal-dialog"
        className="bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl border border-slate-200/90 dark:border-slate-800 w-[calc(100vw-24px)] max-w-[460px] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 select-none"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900 z-10">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {editExpense ? 'Edit Expense' : 'Add Expense'}
              </h3>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Transaction Workflow
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Record manual expense or scan receipt using Gemini Vision AI
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-[14px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        {!editExpense && (
          <div className="px-4 pt-3 pb-1 bg-slate-50/60 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
            <div className="flex p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setMode('manual');
                  setFormError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-[12px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === 'manual'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Manual Expense</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('scan');
                  setFormError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-[12px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === 'scan'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Scan Receipt</span>
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-[14px] text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-[14px] text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* MODE 1: MANUAL EXPENSE FORM                                   */}
          {/* ------------------------------------------------------------- */}
          {mode === 'manual' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Item / Merchant Name <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={itemNameInputRef}
                  type="text"
                  id="expense-item-name-input"
                  required
                  placeholder="e.g. Vegetables, Petrol, Dinner, Supermarket"
                  value={itemName}
                  onChange={(e) => handleItemNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      priceInputRef.current?.focus();
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 caret-emerald-400 rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold min-h-[44px] transition-all"
                />
              </div>

              {/* Amount & Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none select-none">₹</span>
                    <input
                      ref={priceInputRef}
                      type="number"
                      inputMode="decimal"
                      step="any"
                      id="expense-price-input"
                      required
                      placeholder="250"
                      value={totalPrice}
                      onChange={(e) => setTotalPrice(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 text-sm sm:text-base border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 caret-emerald-400 text-right tabular-nums rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-black min-h-[44px] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="expense-purchase-date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white caret-emerald-400 rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold min-h-[44px] transition-all"
                  />
                </div>
              </div>

              {/* Category Selectable Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {allCategoryChips.map((catName) => {
                    const isSelected = category === catName;
                    return (
                      <button
                        type="button"
                        key={catName}
                        onClick={() => {
                          setCategory(catName);
                          setUserSelectedCategory(true);
                        }}
                        id={`category-chip-${catName.toLowerCase().replace(/\s+/g, '-')}`}
                        className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all border cursor-pointer min-h-[38px] flex items-center gap-1 active:scale-95 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        <span>{catName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Method Selectable Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Payment Method
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PAYMENT_METHODS.map((pm) => {
                    const isSelected = paymentMethod === pm;
                    return (
                      <button
                        type="button"
                        key={pm}
                        onClick={() => setPaymentMethod(pm)}
                        className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all border cursor-pointer min-h-[38px] flex items-center gap-1 active:scale-95 ${
                          isSelected
                            ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        <span>{pm}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Receipt Attachment (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Receipt Attachment (Optional)
                </label>
                <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-[14px] bg-slate-50/60 dark:bg-slate-800/40">
                  {receiptDriveFileId ? (
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-[12px] border border-emerald-200 dark:border-emerald-800 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{receiptFileName || 'Receipt'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {receiptViewLink && (
                          <a
                            href={receiptViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-700 dark:text-emerald-400 hover:underline text-xs font-semibold"
                          >
                            View
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptDriveFileId('');
                            setReceiptFileName('');
                            setReceiptViewLink('');
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*,application/pdf"
                        onChange={handleManualReceiptFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingReceipt}
                        className="w-full py-2.5 px-3 border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-slate-900 rounded-[12px] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[40px]"
                      >
                        {isUploadingReceipt ? (
                          <span>Processing receipt image...</span>
                        ) : (
                          <>
                            <Camera className="w-4 h-4 text-slate-400" />
                            <span>Attach Receipt Photo</span>
                          </>
                        )}
                      </button>
                      {uploadError && (
                        <p className="text-[11px] text-rose-600 mt-1">{uploadError}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Notes (Optional)</label>
                <textarea
                  id="expense-notes-input"
                  rows={2}
                  placeholder="Store location, invoice reference, payment notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </form>
          ) : (
            /* ------------------------------------------------------------- */
            /* MODE 2: SCAN RECEIPT AI WORKFLOW                              */
            /* ------------------------------------------------------------- */
            <div className="space-y-4">
              {!isReviewReady ? (
                <div className="space-y-4">
                  {/* Image Picker / Camera Zone */}
                  <div
                    onClick={() => scanFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-[22px] p-6 text-center transition-all cursor-pointer ${
                      previewUrl
                        ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-500'
                    }`}
                  >
                    {previewUrl ? (
                      <div className="space-y-2">
                        <img src={previewUrl} alt="Receipt Preview" className="max-h-44 mx-auto rounded-xl object-contain" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedFile?.name}</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Tap to change image</p>
                      </div>
                    ) : (
                      <div className="space-y-3 py-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                          <Receipt className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white">Upload Receipt Photo</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Gemini Vision extracts merchant, total price, date & category
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              scanCameraInputRef.current?.click();
                            }}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Take Photo</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              scanFileInputRef.current?.click();
                            }}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Browse File</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={scanFileInputRef}
                    accept="image/*,application/pdf"
                    onChange={(e) => e.target.files?.[0] && handleScanFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={scanCameraInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => e.target.files?.[0] && handleScanFileSelect(e.target.files[0])}
                    className="hidden"
                  />

                  {/* OCR Error Fallback Screen */}
                  {scanError && (
                    <div className="p-4 rounded-[20px] bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 space-y-3">
                      <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                        <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
                        <div>
                          <h4 className="text-xs font-black">Receipt AI Scanning Unavailable</h4>
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">{scanError}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={executeReceiptScan}
                          disabled={isScanning}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                          <span>Retry Scan</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleFallbackToManual}
                          className="flex-1 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Enter Manually</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Scanning Trigger Button */}
                  {selectedFile && !isScanning && !scanError && (
                    <button
                      type="button"
                      onClick={executeReceiptScan}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Extract Receipt Intelligence (Gemini Vision)</span>
                    </button>
                  )}

                  {/* Scanning Loading State */}
                  {isScanning && (
                    <div className="p-5 rounded-[22px] bg-slate-900 text-white space-y-3 text-center border border-emerald-500/30">
                      <Loader2 className="w-7 h-7 text-emerald-400 animate-spin mx-auto" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-white">{SCAN_STEPS[scanStepIndex]}</h4>
                        <p className="text-[10px] text-slate-400">Processing image via Gemini Vision backend route</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ----------------------------------------------------------- */
                /* SCAN REVIEW SCREEN (Editable extracted details)             */
                /* ----------------------------------------------------------- */
                <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-800 pt-1">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Extracted Receipt Details (Review & Edit)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsReviewReady(false)}
                      className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Change Photo
                    </button>
                  </div>

                  {/* Merchant & Confidence */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Merchant / Store <span className="text-rose-500">*</span>
                      </label>
                      {renderConfidenceBadge('merchant')}
                    </div>
                    <input
                      type="text"
                      required
                      value={scanMerchant}
                      onChange={(e) => setScanMerchant(e.target.value)}
                      placeholder="e.g. D-Mart, Reliance Fresh, Petrol Pump"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[12px] font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Amount & Date Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Total Amount (₹) <span className="text-rose-500">*</span>
                        </label>
                        {renderConfidenceBadge('amount')}
                      </div>
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          required
                          value={scanAmount}
                          onChange={(e) => setScanAmount(e.target.value)}
                          className="w-full pl-8 pr-3 py-2.5 text-sm sm:text-base border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-right tabular-nums rounded-[12px] font-black focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Purchase Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={scanDate}
                        onChange={(e) => setScanDate(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[12px] font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Category Selector Chips */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {allCategoryChips.map((catName) => {
                        const isSelected = scanCategory === catName;
                        return (
                          <button
                            type="button"
                            key={catName}
                            onClick={() => setScanCategory(catName)}
                            className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all border cursor-pointer min-h-[36px] flex items-center gap-1 ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                            <span>{catName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment Method Selector Chips */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Payment Method
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {PAYMENT_METHODS.map((pm) => {
                        const isSelected = scanPaymentMethod === pm;
                        return (
                          <button
                            type="button"
                            key={pm}
                            onClick={() => setScanPaymentMethod(pm)}
                            className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all border cursor-pointer min-h-[36px] flex items-center gap-1 ${
                              isSelected
                                ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                            <span>{pm}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Extracted Items Breakdown */}
                  {scanItems.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Extracted Items Breakdown ({scanItems.length})
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setScanItems((prev) => [
                              ...prev,
                              {
                                id: `item_${Date.now()}`,
                                name: 'New Item',
                                category: scanCategory,
                                quantity: 1,
                                unit: 'unit',
                                price: 0,
                              },
                            ])
                          }
                          className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Item
                        </button>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {scanItems.map((it) => (
                          <div key={it.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                            <input
                              type="text"
                              value={it.name}
                              onChange={(e) =>
                                setScanItems((prev) =>
                                  prev.map((x) => (x.id === it.id ? { ...x, name: e.target.value } : x))
                                )
                              }
                              className="flex-1 bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none"
                            />
                            <div className="relative flex items-center w-24">
                              <span className="text-slate-400 mr-0.5">₹</span>
                              <input
                                type="number"
                                inputMode="decimal"
                                value={it.price || ''}
                                onChange={(e) =>
                                  setScanItems((prev) =>
                                    prev.map((x) => (x.id === it.id ? { ...x, price: Number(e.target.value) || 0 } : x))
                                  )
                                }
                                className="w-full bg-transparent text-right font-black text-slate-900 dark:text-white focus:outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setScanItems((prev) => prev.filter((x) => x.id !== it.id))}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes & Invoice # */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Notes / Invoice #</label>
                    <input
                      type="text"
                      placeholder="Invoice # or store notes"
                      value={scanNotes}
                      onChange={(e) => setScanNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[12px] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-[14px] transition-colors cursor-pointer min-h-[44px]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting || (mode === 'scan' && !isReviewReady)}
            id="expense-submit-button"
            className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-[14px] shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Expense...</span>
              </>
            ) : (
              <span>{editExpense ? 'Update Expense' : 'Save Expense'}</span>
            )}
          </button>
        </div>
      </div>

      {/* Duplicate Warning Dialog */}
      {showDuplicateModal && duplicateMatch && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[360px] rounded-[24px] p-5 border border-amber-500/40 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-amber-500">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Possible Duplicate Expense</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              A transaction for <strong className="text-slate-900 dark:text-white">"{duplicateMatch.merchant || duplicateMatch.itemName}"</strong> (₹{duplicateMatch.totalPrice}) on {duplicateMatch.purchaseDate} already exists.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Review & Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  const payload = mode === 'manual' ? validateManualForm() : validateScanForm();
                  if (payload) executeSavePayload(payload);
                }}
                className="px-4 py-2 rounded-xl text-xs font-black text-white bg-amber-600 hover:bg-amber-500 shadow-sm cursor-pointer"
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
