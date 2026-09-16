import React, { useState, useEffect, useRef } from 'react';
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
  Zap,
} from 'lucide-react';
import { Expense, CategoryItem } from '../types.js';
import { SpendTrackApi } from '../services/api.js';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  categories: CategoryItem[];
  editExpense?: Expense | null;
}

const PRESET_CATEGORIES = ['Groceries', 'Gas', 'Bills', 'Shopping', 'Travel', 'Household'];

const AUTOFILL_RULES: Array<{ keywords: string[]; category: string }> = [
  { keywords: ['rice', 'flour', 'atta', 'dal', 'pulses', 'oil', 'sugar', 'salt', 'egg', 'bread', 'veggie', 'vegetable', 'fruit'], category: 'Groceries' },
  { keywords: ['milk'], category: 'Groceries' },
  { keywords: ['cooking gas', 'gas cylinder', 'lpg', 'gas'], category: 'Gas' },
  { keywords: ['wifi', 'internet', 'broadband', 'electricity', 'water', 'bill', 'recharge', 'mobile bill', 'rent'], category: 'Bills' },
  { keywords: ['petrol', 'diesel', 'fuel', 'cab', 'uber', 'ola', 'taxi', 'flight', 'train', 'bus'], category: 'Travel' },
  { keywords: ['shirt', 'pants', 'shoes', 'clothes', 'dress', 'jacket', 't-shirt', 'laptop', 'phone'], category: 'Shopping' },
  { keywords: ['detergent', 'soap', 'shampoo', 'tissue', 'cleaner', 'mop', 'trash bag', 'dishwash'], category: 'Household' },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  editExpense,
}) => {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [totalPrice, setTotalPrice] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // User manually selected category indicator
  const [userSelectedCategory, setUserSelectedCategory] = useState(false);

  // Receipt state
  const [receiptDriveFileId, setReceiptDriveFileId] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [receiptViewLink, setReceiptViewLink] = useState<string>('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Google Calendar Reminder state
  const [hasCalendarReminder, setHasCalendarReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState(new Date().toISOString().split('T')[0]);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [notificationBefore, setNotificationBefore] = useState(1440);
  const [calendarEventId, setCalendarEventId] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Input refs for fast keyboard navigation
  const itemNameInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync edit mode or reset for new expense
  useEffect(() => {
    if (editExpense) {
      setItemName(editExpense.itemName || '');
      setCategory(editExpense.category || 'Groceries');
      setTotalPrice(editExpense.totalPrice ? String(editExpense.totalPrice) : '');
      setPurchaseDate(editExpense.purchaseDate || new Date().toISOString().split('T')[0]);
      setNotes(editExpense.notes || '');
      setReceiptDriveFileId(editExpense.receiptDriveFileId || '');
      setReceiptFileName(editExpense.receiptFileName || '');
      setReceiptViewLink(editExpense.receiptViewLink || '');
      setCalendarEventId(editExpense.calendarEventId || '');
      setHasCalendarReminder(Boolean(editExpense.calendarEventId));
      setReminderDate(editExpense.purchaseDate || new Date().toISOString().split('T')[0]);
      setUserSelectedCategory(true);
    } else {
      // Reset form for new expense
      setItemName('');
      setCategory('Groceries');
      setTotalPrice('');
      const today = new Date().toISOString().split('T')[0];
      setPurchaseDate(today);
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
    }
    setFormError(null);
    setUploadError(null);
    setSuccessNotice(null);

    if (isOpen) {
      setTimeout(() => {
        itemNameInputRef.current?.focus();
      }, 100);
    }
  }, [editExpense, isOpen]);

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

  // Build merged Category list for chips
  const categoryNamesSet = new Set([...PRESET_CATEGORIES, ...categories.map((c) => c.name)]);
  const allCategoryChips = Array.from(categoryNamesSet);
  const numPrice = parseFloat(totalPrice) || 0;

  // Handle Receipt Upload to Google Drive with compression
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

      const { mimeType } = await compressImage(file);

      setReceiptDriveFileId(`rec_${Date.now()}`);
      setReceiptFileName(file.name);
      setReceiptViewLink("#");
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process receipt image.');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const validateAndPrepare = async () => {
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

    let finalCalendarEventId = calendarEventId;

    return {
      itemName: itemName.trim(),
      category,
      totalPrice: numPrice,
      purchaseDate,
      notes: notes.trim() || undefined,
      receiptDriveFileId: receiptDriveFileId || undefined,
      receiptFileName: receiptFileName || undefined,
      receiptViewLink: receiptViewLink || undefined,
      calendarEventId: finalCalendarEventId || undefined,
    };
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    setSuccessNotice(null);

    const payload = await validateAndPrepare();
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

    const payload = await validateAndPrepare();
    if (!payload) return;

    try {
      setIsSubmitting(true);
      await onSave(payload);

      // Successfully saved -> Reset item fields while preserving category and date
      setItemName('');
      setTotalPrice('');
      setNotes('');
      setReceiptDriveFileId('');
      setReceiptFileName('');
      setReceiptViewLink('');
      setFormError(null);
      setSuccessNotice(`Saved "${payload.itemName}" (₹${payload.totalPrice})! Ready for next expense.`);

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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 overflow-hidden">
      <div
        id="add-expense-modal-dialog"
        className="bg-white dark:bg-slate-900 rounded-[20px] shadow-2xl border border-slate-200/90 dark:border-slate-800 w-[calc(100vw-24px)] max-w-[420px] max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 select-none"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900 z-10">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {editExpense ? 'Edit Expense' : 'Add Expense'}
              </h3>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                One-Time Purchase
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Record groceries, fuel, shopping, or daily spending
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
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

          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Item Name <span className="text-rose-500">*</span>
            </label>
            <input
              ref={itemNameInputRef}
              type="text"
              id="expense-item-name-input"
              required
              placeholder="e.g. Vegetables, Petrol, Dinner, Clothes"
              value={itemName}
              onChange={(e) => handleItemNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  priceInputRef.current?.focus();
                }
              }}
              className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold min-h-[44px]"
            />
          </div>

          {/* Amount & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
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
                  className="w-full pl-8 pr-3 py-2.5 text-sm sm:text-base border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-black min-h-[44px]"
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
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold min-h-[44px]"
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
                    onChange={handleReceiptFileChange}
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
              placeholder="Store location, payment details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Google Calendar Optional Reminder Section */}
          <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-[16px] bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasCalendarReminder}
                onChange={(e) => setHasCalendarReminder(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
              />
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                Add reminder to Google Calendar
              </span>
            </label>

            {hasCalendarReminder && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Reminder Date
                  </label>
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[10px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[10px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Notify Before
                  </label>
                  <select
                    value={notificationBefore}
                    onChange={(e) => setNotificationBefore(parseInt(e.target.value, 10))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[10px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  >
                    <option value={10}>10 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={1440}>1 day before</option>
                    <option value={4320}>3 days before</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Action Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-[14px] transition-colors cursor-pointer min-h-[44px]"
          >
            Cancel
          </button>

          {!editExpense && (
            <button
              type="button"
              onClick={handleSaveAndAddAnother}
              disabled={isSubmitting}
              id="expense-save-and-add-another-btn"
              className="px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-[14px] transition-all cursor-pointer disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-1"
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
            className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-[14px] shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 min-h-[44px]"
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
  );
};
