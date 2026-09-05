import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ShoppingCart,
  TrendingUp,
  Tag,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  Info,
  X,
  Check,
  Zap,
  ArrowUpRight,
  Package,
  Minus,
  AlertTriangle,
} from 'lucide-react';
import { MonthlyItem, CategoryItem, Expense, ConsumptionLog } from '../types.js';
import { formatCurrency } from '../utils/calculations.js';
import { DEFAULT_UNITS, CATEGORY_COLORS } from '../data/defaults.js';
import { formatDisplayDate } from '../utils/dateRanges.js';

interface MonthlyItemsPageProps {
  monthlyItems: MonthlyItem[];
  categories: CategoryItem[];
  expenses: Expense[];
  consumptionLogs?: ConsumptionLog[];
  onSaveMonthlyItem: (item: Omit<MonthlyItem, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => Promise<void>;
  onDeleteMonthlyItem: (id: string) => Promise<void>;
  onToggleMonthlyItem: (item: MonthlyItem) => Promise<void>;
  onQuickAddPurchase: (item: MonthlyItem) => void;
  onOpenConsumeModal: (item: MonthlyItem) => void;
  onViewItemHistory: (itemName: string) => void;
}

export const MonthlyItemsPage: React.FC<MonthlyItemsPageProps> = ({
  monthlyItems,
  categories,
  expenses,
  consumptionLogs = [],
  onSaveMonthlyItem,
  onDeleteMonthlyItem,
  onToggleMonthlyItem,
  onQuickAddPurchase,
  onOpenConsumeModal,
  onViewItemHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MonthlyItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MonthlyItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [subcategory, setSubcategory] = useState('');
  const [typicalPrice, setTypicalPrice] = useState<string>('');
  const [typicalQuantity, setTypicalQuantity] = useState<string>('');
  const [unit, setUnit] = useState('kg');
  const [purchasedDate, setPurchasedDate] = useState('');
  const [startUsingDate, setStartUsingDate] = useState('');
  const [quantityPurchased, setQuantityPurchased] = useState<string>('');
  const [openingStock, setOpeningStock] = useState<string>('');
  const [remainingQuantity, setRemainingQuantity] = useState<string>('');
  const [minimumThreshold, setMinimumThreshold] = useState<string>('2');
  const [usageTrackingEnabled, setUsageTrackingEnabled] = useState(true);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setCategory('Groceries');
    setSubcategory('');
    setTypicalPrice('');
    setTypicalQuantity('1');
    setUnit('kg');
    setPurchasedDate(new Date().toISOString().split('T')[0]);
    setStartUsingDate(new Date().toISOString().split('T')[0]);
    setQuantityPurchased('10');
    setOpeningStock('10');
    setRemainingQuantity('10');
    setMinimumThreshold('2');
    setUsageTrackingEnabled(true);
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: MonthlyItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category || 'Groceries');
    setSubcategory(item.subcategory || '');
    setTypicalPrice(item.typicalPrice !== undefined ? String(item.typicalPrice) : '');
    setTypicalQuantity(item.typicalQuantity !== undefined ? String(item.typicalQuantity) : '');
    setUnit(item.unit || 'kg');
    setPurchasedDate(item.purchasedDate || '');
    setStartUsingDate(item.startUsingDate || '');
    setQuantityPurchased(item.quantityPurchased !== undefined ? String(item.quantityPurchased) : '');
    setOpeningStock(item.openingStock !== undefined ? String(item.openingStock) : '');
    setRemainingQuantity(item.remainingQuantity !== undefined ? String(item.remainingQuantity) : '');
    setMinimumThreshold(item.minimumThreshold !== undefined ? String(item.minimumThreshold) : '2');
    setUsageTrackingEnabled(item.usageTrackingEnabled ?? true);
    setNotes(item.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Item name is required.');
      return;
    }

    setIsSaving(true);
    try {
      const numPrice = typicalPrice ? parseFloat(typicalPrice) : undefined;
      const numQty = typicalQuantity ? parseFloat(typicalQuantity) : undefined;
      const numQtyPurchased = quantityPurchased ? parseFloat(quantityPurchased) : undefined;
      const numOpening = openingStock ? parseFloat(openingStock) : undefined;
      const numRemaining = remainingQuantity ? parseFloat(remainingQuantity) : (numOpening || numQtyPurchased);
      const numThreshold = minimumThreshold ? parseFloat(minimumThreshold) : undefined;

      await onSaveMonthlyItem(
        {
          name: name.trim(),
          category,
          subcategory: subcategory.trim() || undefined,
          typicalPrice: numPrice,
          typicalQuantity: numQty,
          unit,
          purchasedDate: purchasedDate || undefined,
          startUsingDate: startUsingDate || undefined,
          quantityPurchased: numQtyPurchased,
          openingStock: numOpening,
          remainingQuantity: numRemaining,
          minimumThreshold: numThreshold,
          usageTrackingEnabled,
          notes: notes.trim() || undefined,
          isEnabled: editingItem ? editingItem.isEnabled : true,
        },
        editingItem?.id
      );
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save monthly item.');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = monthlyItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subcategory && item.subcategory.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const getItemStats = (itemName: string) => {
    const matchingExpenses = expenses.filter(
      (e) => e.itemName.toLowerCase() === itemName.toLowerCase()
    );
    const count = matchingExpenses.length;
    const durations = matchingExpenses
      .filter((e) => e.durationDays !== undefined && e.durationDays > 0)
      .map((e) => e.durationDays!);
    const avgDuration =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : undefined;

    return { count, avgDuration };
  };

  const currentCategoryItem = categories.find((c) => c.name === category);
  const subcategoriesList = currentCategoryItem ? currentCategoryItem.subcategories : [];

  return (
    <div className="space-y-6 pb-12" id="monthly-items-page">
      {/* 1. Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Inventory & Consumables
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Monthly Consumable Items
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track household stock, usage dates, consumption velocity, and low-stock alerts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="add-monthly-item-btn"
              onClick={openAddModal}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Consumable</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              id="monthly-items-search-input"
              placeholder="Search consumable inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium text-slate-700"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Inventory Items Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const { count, avgDuration } = getItemStats(item.name);
            const remaining = item.remainingQuantity !== undefined
              ? item.remainingQuantity
              : item.openingStock !== undefined
              ? item.openingStock
              : item.quantityPurchased !== undefined
              ? item.quantityPurchased
              : 0;

            const opening = item.openingStock || item.quantityPurchased || (remaining > 0 ? remaining : 1);
            const minThreshold = item.minimumThreshold !== undefined ? item.minimumThreshold : 2;
            const isLowStock = remaining <= minThreshold;
            const percentageStock = Math.min(100, Math.max(0, Math.round((remaining / opening) * 100)));

            return (
              <div
                key={item.id}
                id={`monthly-item-card-${item.id}`}
                className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${
                  isLowStock ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-slate-200/80'
                }`}
              >
                <div>
                  {/* Card Top Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-2xs flex-shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#64748B' }}
                      >
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                            {item.name}
                          </h3>
                          {isLowStock && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-medium text-slate-500">
                            {item.category}
                          </span>
                          {item.subcategory && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-[11px] text-slate-400">{item.subcategory}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 cursor-pointer"
                        title="Edit Item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setItemToDelete(item)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Stock Remaining & Progress Bar */}
                  <div className="my-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Remaining Stock</span>
                        <span className={`font-black text-base sm:text-lg ${isLowStock ? 'text-amber-700' : 'text-slate-900'}`}>
                          {remaining} {item.unit}
                          <span className="text-xs font-normal text-slate-400 ml-1">/ {opening} {item.unit}</span>
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Min Threshold</span>
                        <span className="font-bold text-slate-700">
                          {minThreshold} {item.unit}
                        </span>
                      </div>
                    </div>

                    {/* Stock Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentageStock}%` }}
                      />
                    </div>

                    {/* Purchase & Start Using Dates */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Purchased Date</span>
                        <strong className="text-slate-800 font-semibold">{item.purchasedDate ? formatDisplayDate(item.purchasedDate) : '—'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Start Using Date</span>
                        <strong className="text-emerald-700 font-semibold">{item.startUsingDate ? formatDisplayDate(item.startUsingDate) : '—'}</strong>
                      </div>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-slate-500 italic mb-3 line-clamp-2">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                {/* Action Buttons: Consume & Log Purchase */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onOpenConsumeModal(item)}
                    id={`btn-consume-${item.id}`}
                    className="px-3.5 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Consume Qty</span>
                  </button>

                  <button
                    onClick={() => onQuickAddPurchase(item)}
                    id={`btn-log-purchase-${item.id}`}
                    className="px-3.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Purchase</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 text-slate-400">
          <ShoppingCart className="w-10 h-10 mx-auto mb-3 stroke-1 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">No Consumables Found</h3>
          <p className="text-xs mt-1 text-slate-400 max-w-sm mx-auto">
            Add consumable items like Cooking Gas, Rice, Oil, and Milk to track opening stock, remaining quantity, and consumption rates.
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Consumable Item</span>
          </button>
        </div>
      )}

      {/* Add / Edit Monthly Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingItem ? 'Edit Consumable Item' : 'Add Consumable Item'}
                </h3>
                <p className="text-xs text-slate-500">
                  Track purchasing vs usage dates and remaining stock
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cooking Gas, Sona Masoori Rice, Milk"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setSubcategory('');
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800"
                  >
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subcategory</label>
                  <input
                    type="text"
                    placeholder="e.g. 14.2kg LPG"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800"
                  />
                </div>
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Purchased Date</label>
                  <input
                    type="date"
                    value={purchasedDate}
                    onChange={(e) => setPurchasedDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Start Using Date</label>
                  <input
                    type="date"
                    value={startUsingDate}
                    onChange={(e) => setStartUsingDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Inventory Quantities Row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Opening Stock</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="25"
                    value={openingStock}
                    onChange={(e) => {
                      setOpeningStock(e.target.value);
                      if (!remainingQuantity) setRemainingQuantity(e.target.value);
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Remaining Stock</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="23.5"
                    value={remainingQuantity}
                    onChange={(e) => setRemainingQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="3"
                    value={minimumThreshold}
                    onChange={(e) => setMinimumThreshold(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Typical Price (₹)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="1200"
                    value={typicalPrice}
                    onChange={(e) => setTypicalPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Typical Qty</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="1"
                    value={typicalQuantity}
                    onChange={(e) => setTypicalQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {DEFAULT_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Preferred brand, store location..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Remove Consumable Item?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove <strong className="text-slate-900">{itemToDelete.name}</strong> from your regular catalog?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDeleteMonthlyItem(itemToDelete.id);
                  setItemToDelete(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
