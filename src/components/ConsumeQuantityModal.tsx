import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Calendar, AlertCircle, Sparkles, Minus, Plus } from 'lucide-react';
import { MonthlyItem } from '../types.js';
import { formatDisplayDate } from '../utils/dateRanges.js';

interface ConsumeQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyItems: MonthlyItem[];
  initialItem?: MonthlyItem | null;
  onSaveConsumption: (payload: {
    itemId: string;
    itemName: string;
    consumedQuantity: number;
    unit: string;
    consumedDate: string;
    notes?: string;
  }) => Promise<void>;
}

export const ConsumeQuantityModal: React.FC<ConsumeQuantityModalProps> = ({
  isOpen,
  onClose,
  monthlyItems,
  initialItem,
  onSaveConsumption,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [consumedQuantity, setConsumedQuantity] = useState<string>('');
  const [consumedDate, setConsumedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialItem) {
      setSelectedItemId(initialItem.id);
    } else if (monthlyItems.length > 0 && !selectedItemId) {
      setSelectedItemId(monthlyItems[0].id);
    }
    setFormError(null);
  }, [initialItem, monthlyItems, isOpen]);

  if (!isOpen) return null;

  const activeItem = monthlyItems.find((m) => m.id === selectedItemId) || initialItem || (monthlyItems[0] || null);

  const currentRemaining = activeItem
    ? activeItem.remainingQuantity !== undefined
      ? activeItem.remainingQuantity
      : activeItem.openingStock !== undefined
      ? activeItem.openingStock
      : activeItem.quantityPurchased !== undefined
      ? activeItem.quantityPurchased
      : 0
    : 0;

  const numConsumed = parseFloat(consumedQuantity) || 0;
  const newRemaining = Math.max(0, Number((currentRemaining - numConsumed).toFixed(2)));

  const handleQuickQty = (qty: number) => {
    setConsumedQuantity(String(qty));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!activeItem) {
      setFormError('Please select a household item to consume.');
      return;
    }

    if (isNaN(numConsumed) || numConsumed <= 0) {
      setFormError('Please enter a valid positive consumed quantity.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSaveConsumption({
        itemId: activeItem.id,
        itemName: activeItem.name,
        consumedQuantity: numConsumed,
        unit: activeItem.unit || 'unit',
        consumedDate,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to record consumption.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="consume-quantity-modal-dialog"
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <span>Consume Quantity</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Record usage from your household inventory without overwriting purchase history
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Select Item */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Household Item <span className="text-rose-500">*</span>
            </label>
            <select
              id="consume-item-select"
              value={selectedItemId}
              onChange={(e) => {
                setSelectedItemId(e.target.value);
                setConsumedQuantity('');
              }}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-bold text-slate-900"
            >
              {monthlyItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (Stock: {item.remainingQuantity !== undefined ? item.remainingQuantity : (item.openingStock || item.quantityPurchased || 0)} {item.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Quick Chips */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Consumed Quantity ({activeItem?.unit || 'unit'}) <span className="text-rose-500">*</span>
              </label>
              {activeItem && (
                <span className="text-[11px] text-slate-500 font-medium">
                  Current Stock: <strong className="text-emerald-700">{currentRemaining} {activeItem.unit}</strong>
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="number"
                step="any"
                id="consume-quantity-input"
                required
                placeholder="e.g. 1.5"
                value={consumedQuantity}
                onChange={(e) => setConsumedQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-black text-slate-900"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold uppercase">
                {activeItem?.unit || 'unit'}
              </span>
            </div>

            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
              {[0.5, 1, 1.5, 2, 5].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleQuickQty(q)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 transition-colors cursor-pointer whitespace-nowrap"
                >
                  +{q} {activeItem?.unit || 'unit'}
                </button>
              ))}
            </div>
          </div>

          {/* Date of Consumption */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Date Consumed</label>
            <div className="relative">
              <input
                type="date"
                id="consume-date-input"
                required
                value={consumedDate}
                onChange={(e) => setConsumedDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Live Inventory Preview Card */}
          {activeItem && numConsumed > 0 && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Remaining Stock Preview</span>
                </span>
                <span className="text-emerald-800 font-black text-sm">
                  {newRemaining} {activeItem.unit}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-normal">
                After deducting {numConsumed} {activeItem.unit}, remaining quantity will update from {currentRemaining} to <strong>{newRemaining} {activeItem.unit}</strong>.
              </p>
            </div>
          )}

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes (Optional)</label>
            <input
              type="text"
              id="consume-notes-input"
              placeholder="e.g. Daily cooking, guests over"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              id="submit-consumption-btn"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? 'Recording...' : 'Record Consumption'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
