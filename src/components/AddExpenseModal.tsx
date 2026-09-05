import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Calendar,
  Check,
  FileText,
  AlertCircle,
  Tag,
  Package,
  Layers,
  Sparkles,
  Info,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Zap,
  Camera,
  Trash2,
  Plus,
} from 'lucide-react';
import { Expense, CategoryItem, MonthlyItem } from '../types.js';
import { DEFAULT_UNITS } from '../data/defaults.js';
import {
  calculateDuration,
  calculatePricePerUnit,
  calculateDailyCost,
  calculateDailyQuantity,
  calculateWeeklyQuantity,
  calculateMonthlyEstimate,
  getCurrentlyInUseStatus,
  formatConsumptionVelocity,
  formatCurrency,
} from '../utils/calculations.js';
import { SpendTrackApi } from '../services/api.js';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  categories: CategoryItem[];
  editExpense?: Expense | null;
  monthlyItems?: MonthlyItem[];
  initialMonthlyItem?: MonthlyItem | null;
}

const PRESET_CATEGORIES = ['Groceries', 'Gas', 'Bills', 'Shopping', 'Travel', 'Household'];

const AUTOFILL_RULES: Array<{ keywords: string[]; category: string; unit: string }> = [
  { keywords: ['rice', 'flour', 'atta', 'dal', 'pulses', 'oil', 'sugar', 'salt', 'egg', 'bread', 'veggie', 'vegetable', 'fruit'], category: 'Groceries', unit: 'kg' },
  { keywords: ['milk'], category: 'Groceries', unit: 'litre' },
  { keywords: ['cooking gas', 'gas cylinder', 'lpg', 'gas'], category: 'Gas', unit: 'cylinder' },
  { keywords: ['wifi', 'internet', 'broadband', 'electricity', 'water', 'bill', 'recharge', 'mobile bill', 'rent'], category: 'Bills', unit: 'month' },
  { keywords: ['petrol', 'diesel', 'fuel', 'cab', 'uber', 'ola', 'taxi', 'flight', 'train', 'bus'], category: 'Travel', unit: 'litre' },
  { keywords: ['shirt', 'pants', 'shoes', 'clothes', 'dress', 'jacket', 't-shirt', 'laptop', 'phone'], category: 'Shopping', unit: 'item' },
  { keywords: ['detergent', 'soap', 'shampoo', 'tissue', 'cleaner', 'mop', 'trash bag', 'dishwash'], category: 'Household', unit: 'pack' },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  editExpense,
  monthlyItems = [],
  initialMonthlyItem,
}) => {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [subcategory, setSubcategory] = useState('');
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState('kg');
  const [totalPrice, setTotalPrice] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [usageStartDate, setUsageStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [usageEndDate, setUsageEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // User manually selected category indicator so autofill doesn't overwrite manual selection
  const [userSelectedCategory, setUserSelectedCategory] = useState(false);

  // Receipt state
  const [receiptDriveFileId, setReceiptDriveFileId] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [receiptViewLink, setReceiptViewLink] = useState<string>('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for keyboard focus navigation
  const itemNameInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyTemplate = (template: MonthlyItem) => {
    setItemName(template.name);
    if (template.category) {
      setCategory(template.category);
      setUserSelectedCategory(true);
    }
    if (template.subcategory) setSubcategory(template.subcategory);
    if (template.unit) setUnit(template.unit);
    if (template.typicalPrice !== undefined) setTotalPrice(String(template.typicalPrice));
    if (template.typicalQuantity !== undefined) setQuantity(String(template.typicalQuantity));
    if (template.notes && !notes) setNotes(template.notes);

    const today = new Date().toISOString().split('T')[0];
    if (!purchaseDate) setPurchaseDate(today);
    if (template.usageTrackingEnabled) {
      setUsageStartDate(today);
    }
  };

  // Sync edit mode or template prefill
  useEffect(() => {
    if (editExpense) {
      setItemName(editExpense.itemName);
      setCategory(editExpense.category || 'Groceries');
      setSubcategory(editExpense.subcategory || '');
      setQuantity(editExpense.quantity !== undefined ? String(editExpense.quantity) : '');
      setUnit(editExpense.unit || 'kg');
      setTotalPrice(String(editExpense.totalPrice || ''));
      setPurchaseDate(editExpense.purchaseDate || new Date().toISOString().split('T')[0]);
      setUsageStartDate(editExpense.usageStartDate || editExpense.purchaseDate || '');
      setUsageEndDate(editExpense.usageEndDate || '');
      setNotes(editExpense.notes || '');
      setReceiptDriveFileId(editExpense.receiptDriveFileId || '');
      setReceiptFileName(editExpense.receiptFileName || '');
      setReceiptViewLink(editExpense.receiptViewLink || '');
      setUserSelectedCategory(true);
      if (editExpense.notes || editExpense.receiptDriveFileId || editExpense.subcategory || editExpense.usageEndDate) {
        setShowAdvanced(true);
      } else {
        setShowAdvanced(false);
      }
    } else if (initialMonthlyItem) {
      applyTemplate(initialMonthlyItem);
      setShowAdvanced(false);
    } else {
      // Reset form for new expense
      setItemName('');
      setCategory('Groceries');
      setSubcategory('');
      setQuantity('');
      setUnit('kg');
      setTotalPrice('');
      const today = new Date().toISOString().split('T')[0];
      setPurchaseDate(today);
      setUsageStartDate(today);
      setUsageEndDate('');
      setNotes('');
      setReceiptDriveFileId('');
      setReceiptFileName('');
      setReceiptViewLink('');
      setShowAdvanced(false);
      setUserSelectedCategory(false);
    }
    setFormError(null);
    setUploadError(null);
    setSuccessNotice(null);

    // Auto-focus Item Name input on modal open
    if (isOpen) {
      setTimeout(() => {
        itemNameInputRef.current?.focus();
      }, 100);
    }
  }, [editExpense, initialMonthlyItem, isOpen]);

  // Smart Autofill Rule execution when item name changes
  const handleItemNameChange = (val: string) => {
    setItemName(val);
    if (!userSelectedCategory && !editExpense && val.trim().length >= 2) {
      const lower = val.toLowerCase().trim();
      for (const rule of AUTOFILL_RULES) {
        if (rule.keywords.some((kw) => lower.includes(kw))) {
          setCategory(rule.category);
          if (rule.unit) setUnit(rule.unit);
          break;
        }
      }
    }
  };

  if (!isOpen) return null;

  // Build merged Category list for chips
  const categoryNamesSet = new Set([...PRESET_CATEGORIES, ...categories.map((c) => c.name)]);
  const allCategoryChips = Array.from(categoryNamesSet);

  // Selected category subcategories
  const currentCategoryItem = categories.find((c) => c.name === category);
  const subcategoriesList = currentCategoryItem ? currentCategoryItem.subcategories : [];

  // Active Monthly Items
  const activeMonthlyItems = monthlyItems.filter((m) => m.isEnabled !== false);

  // Live Calculations
  const numPrice = parseFloat(totalPrice) || 0;
  const numQty = parseFloat(quantity) || undefined;
  const durationDays = calculateDuration(usageStartDate, usageEndDate);
  const inUseStatus = getCurrentlyInUseStatus(usageStartDate, usageEndDate);
  const pricePerUnit = calculatePricePerUnit(numPrice, numQty);
  const dailyCost = calculateDailyCost(numPrice, durationDays);
  const dailyQuantity = calculateDailyQuantity(numQty, durationDays);
  const velocityStr = formatConsumptionVelocity(numQty, unit, durationDays);

  // Partial in-use daily cost estimation
  const inUseDays = inUseStatus.isInUse ? inUseStatus.daysSoFar : undefined;
  const inUseDailyCost = inUseDays && inUseDays > 0 && numPrice > 0 ? Number((numPrice / inUseDays).toFixed(2)) : undefined;

  // Handle Receipt Upload to Drive with client-side image compression
  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingReceipt(true);
    setUploadError(null);

    try {
      const compressImage = (imageFile: File): Promise<{ base64Data: string; mimeType: string }> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const maxDim = 1600;
              let width = img.width;
              let height = img.height;

              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                resolve({ base64Data: event.target?.result as string, mimeType: imageFile.type || 'image/jpeg' });
                return;
              }
              ctx.drawImage(img, 0, 0, width, height);
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
              resolve({ base64Data: compressedBase64, mimeType: 'image/jpeg' });
            };
            img.onerror = () => {
              resolve({ base64Data: event.target?.result as string, mimeType: imageFile.type || 'image/jpeg' });
            };
            img.src = event.target?.result as string;
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(imageFile);
        });
      };

      const { base64Data, mimeType } = await compressImage(file);

      const uploaded = await SpendTrackApi.uploadReceipt({
        name: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
        type: mimeType,
        base64Data,
      });

      setReceiptDriveFileId(uploaded.fileId);
      setReceiptFileName(uploaded.fileName);
      setReceiptViewLink(uploaded.webViewLink);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload receipt to Google Drive.');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const validateAndPrepare = () => {
    if (!itemName.trim()) {
      setFormError('Please enter an item name.');
      itemNameInputRef.current?.focus();
      return null;
    }

    if (isNaN(numPrice) || numPrice <= 0) {
      setFormError('Please enter a valid positive price.');
      priceInputRef.current?.focus();
      return null;
    }

    if (quantity && (isNaN(numQty!) || numQty! <= 0)) {
      setFormError('Quantity must be a positive number if provided.');
      quantityInputRef.current?.focus();
      return null;
    }

    if (usageStartDate && usageEndDate && usageEndDate < usageStartDate) {
      setFormError('Usage End Date cannot be earlier than Usage Start Date.');
      return null;
    }

    return {
      itemName: itemName.trim(),
      category,
      subcategory: subcategory.trim() || undefined,
      quantity: numQty,
      unit: unit || 'unit',
      totalPrice: numPrice,
      purchaseDate,
      usageStartDate: usageStartDate || undefined,
      usageEndDate: usageEndDate || undefined,
      durationDays,
      pricePerUnit,
      dailyCost,
      dailyQuantity,
      notes: notes.trim() || undefined,
      receiptDriveFileId: receiptDriveFileId || undefined,
      receiptFileName: receiptFileName || undefined,
      receiptViewLink: receiptViewLink || undefined,
    };
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    setSuccessNotice(null);

    const payload = validateAndPrepare();
    if (!payload) return;

    try {
      setIsSubmitting(true);
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndAddAnother = async () => {
    setFormError(null);
    setSuccessNotice(null);

    const payload = validateAndPrepare();
    if (!payload) return;

    try {
      setIsSubmitting(true);
      await onSave(payload);

      // Successfully saved -> Reset item fields while preserving category and date
      setItemName('');
      setTotalPrice('');
      setQuantity('');
      setNotes('');
      setSubcategory('');
      setReceiptDriveFileId('');
      setReceiptFileName('');
      setReceiptViewLink('');
      setFormError(null);
      setSuccessNotice(`Saved "${payload.itemName}" (₹${payload.totalPrice})! Ready for next expense.`);

      // Refocus Item Name input
      setTimeout(() => {
        itemNameInputRef.current?.focus();
      }, 50);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div
        id="add-expense-modal-dialog"
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/90 w-full sm:max-w-lg max-h-[90vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 select-none"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {editExpense ? 'Edit Expense' : 'Quick Add Expense'}
              </h3>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                1-Tap Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Synced automatically to Google Sheets & Drive
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in duration-150">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Quick Fill Chips from Saved Monthly Items (only when creating new expense) */}
          {!editExpense && activeMonthlyItems.length > 0 && (
            <div className="space-y-1.5 pb-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Saved Templates</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">1-Tap Fill</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {activeMonthlyItems.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => applyTemplate(item)}
                    id={`quick-fill-chip-${item.id}`}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer min-h-[38px] flex items-center ${
                      itemName.toLowerCase() === item.name.toLowerCase()
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold'
                        : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-200/80'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Item Name <span className="text-rose-500">*</span>
            </label>
            <input
              ref={itemNameInputRef}
              type="text"
              id="expense-item-name-input"
              required
              placeholder="e.g. Rice, Cooking Gas, WiFi, Milk, Petrol"
              value={itemName}
              onChange={(e) => handleItemNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  priceInputRef.current?.focus();
                }
              }}
              className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-900 min-h-[48px]"
            />
          </div>

          {/* Amount & Quantity & Unit in clean responsive row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">₹</span>
                <input
                  ref={priceInputRef}
                  type="number"
                  inputMode="decimal"
                  step="any"
                  id="expense-price-input"
                  required
                  placeholder="1200"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      quantityInputRef.current?.focus();
                    }
                  }}
                  className="w-full pl-8 pr-3 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-black text-slate-900 min-h-[48px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
              <input
                ref={quantityInputRef}
                type="number"
                inputMode="decimal"
                step="any"
                id="expense-quantity-input"
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-800 min-h-[48px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
              <select
                id="expense-unit-select"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-semibold text-slate-800 min-h-[48px]"
              >
                {DEFAULT_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Selectable Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Category <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {allCategoryChips.map((catName) => {
                const isSelected = category === catName;
                return (
                  <button
                    type="button"
                    key={catName}
                    onClick={() => {
                      setCategory(catName);
                      setUserSelectedCategory(true);
                      setSubcategory('');
                    }}
                    id={`category-chip-${catName.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer min-h-[44px] flex items-center gap-1.5 active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    <span>{catName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Calculations Preview Pill (if applicable) */}
          {(pricePerUnit !== undefined || durationDays !== undefined || inUseStatus.isInUse || numPrice > 0) && (
            <div
              id="expense-calculated-preview"
              className="p-3 bg-emerald-50/90 rounded-2xl border border-emerald-200/90 text-xs text-emerald-950 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Consumption Insights</span>
                </div>
                {inUseStatus.isInUse ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                    Currently in use
                  </span>
                ) : durationDays !== undefined ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                    {durationDays} days duration
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {pricePerUnit !== undefined && (
                  <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                    <span className="text-emerald-700 block text-[10px] font-semibold">Unit Rate</span>
                    <strong className="text-slate-900 font-bold text-xs sm:text-sm">
                      ₹{pricePerUnit}/{unit}
                    </strong>
                  </div>
                )}

                {dailyCost !== undefined ? (
                  <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                    <span className="text-emerald-700 block text-[10px] font-semibold">Daily Cost</span>
                    <strong className="text-slate-900 font-bold text-xs sm:text-sm">
                      ₹{dailyCost}/day
                    </strong>
                  </div>
                ) : inUseDailyCost !== undefined ? (
                  <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                    <span className="text-emerald-700 block text-[10px] font-semibold">Cost So Far</span>
                    <strong className="text-slate-900 font-bold text-xs sm:text-sm">
                      ₹{inUseDailyCost}/day
                    </strong>
                  </div>
                ) : null}

                {velocityStr ? (
                  <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                    <span className="text-emerald-700 block text-[10px] font-semibold">Velocity</span>
                    <strong className="text-slate-900 font-bold text-xs sm:text-sm">
                      {velocityStr}
                    </strong>
                  </div>
                ) : durationDays !== undefined ? (
                  <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                    <span className="text-emerald-700 block text-[10px] font-semibold">Lifespan</span>
                    <strong className="text-slate-900 font-bold text-xs sm:text-sm">
                      {durationDays} days
                    </strong>
                  </div>
                ) : inUseStatus.daysSoFar !== undefined ? (
                  <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                    <span className="text-emerald-700 block text-[10px] font-semibold">Elapsed Usage</span>
                    <strong className="text-slate-900 font-bold text-xs sm:text-sm">
                      {inUseStatus.daysSoFar} days
                    </strong>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Advanced Details Collapsible Toggle */}
          <div className="pt-1">
            <button
              type="button"
              id="toggle-advanced-details-btn"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full py-2.5 px-3.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100/90 hover:bg-slate-200/90 rounded-2xl flex items-center justify-between transition-colors cursor-pointer min-h-[44px]"
            >
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Advanced Details (Dates, Receipt Upload, Notes)</span>
              </span>
              {showAdvanced ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {showAdvanced && (
              <div className="space-y-4 pt-3.5 animate-in fade-in duration-200 border-t border-slate-100 mt-2">
                {/* Dates Card */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Purchase & Consumption Dates</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Purchase Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="expense-purchase-date"
                        required
                        value={purchaseDate}
                        onChange={(e) => {
                          setPurchaseDate(e.target.value);
                          if (!usageStartDate) setUsageStartDate(e.target.value);
                        }}
                        className="w-full px-2.5 py-2 text-xs border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[40px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Usage Start</label>
                      <input
                        type="date"
                        id="expense-usage-start"
                        value={usageStartDate}
                        onChange={(e) => setUsageStartDate(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[40px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Usage End (Finished)
                      </label>
                      <input
                        type="date"
                        id="expense-usage-end"
                        placeholder="Leave empty if in use"
                        value={usageEndDate}
                        onChange={(e) => setUsageEndDate(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[40px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Subcategory */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subcategory (Optional)</label>
                  {subcategoriesList.length > 0 ? (
                    <div className="space-y-1">
                      <input
                        type="text"
                        id="expense-subcategory-input"
                        list="subcategory-options"
                        placeholder="e.g. LPG Cylinder, Sona Masoori, Monthly Plan"
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
                      />
                      <datalist id="subcategory-options">
                        {subcategoriesList.map((sub) => (
                          <option key={sub} value={sub} />
                        ))}
                      </datalist>
                    </div>
                  ) : (
                    <input
                      type="text"
                      id="expense-subcategory-input"
                      placeholder="e.g. LPG Cylinder, Sona Masoori, Monthly Plan"
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
                    />
                  )}
                </div>

                {/* Receipt Upload to Google Drive */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Receipt Attachment (Google Drive)
                  </label>
                  <div className="p-3 border border-slate-200 rounded-2xl bg-slate-50/60 space-y-2">
                    {receiptDriveFileId ? (
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-200 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">{receiptFileName || 'Receipt'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {receiptViewLink && (
                            <a
                              href={receiptViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-700 hover:underline text-xs font-semibold"
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
                            className="text-slate-400 hover:text-rose-600 p-1"
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
                          onChange={handleReceiptFileChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingReceipt}
                          className="w-full py-2.5 px-3 border border-dashed border-slate-300 hover:border-emerald-500 bg-white rounded-xl text-xs font-semibold text-slate-700 hover:text-emerald-700 flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px]"
                        >
                          {isUploadingReceipt ? (
                            <span>Uploading receipt to Google Drive...</span>
                          ) : (
                            <>
                              <Camera className="w-4 h-4 text-slate-400" />
                              <span>Capture or Select Receipt Photo</span>
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

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                  <textarea
                    id="expense-notes-input"
                    rows={2}
                    placeholder="Brand details, store location, payment method..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Sticky Action Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-end gap-2 shrink-0 z-10">
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer min-h-[44px]"
            >
              Cancel
            </button>

            {!editExpense && (
              <button
                type="button"
                onClick={handleSaveAndAddAnother}
                disabled={isSubmitting}
                id="expense-save-and-add-another-btn"
                className="px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-all cursor-pointer disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Save & Add Another</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              id="expense-submit-button"
              className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 min-h-[44px] flex-1 sm:flex-none"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <span>{editExpense ? 'Update Expense' : 'Save Expense'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
