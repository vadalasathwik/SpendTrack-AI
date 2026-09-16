import React, { useState } from 'react';
import {
  Tag,
  Wallet,
  ShoppingBag,
  Car,
  Home,
  Utensils,
  Coffee,
  Film,
  Gift,
  Briefcase,
  Heart,
  Zap,
  Book,
  Phone,
  Plane,
  PiggyBank,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  FolderTree,
} from 'lucide-react';
import { CategoryItem } from '../types.js';

interface CategoriesPageProps {
  categories: CategoryItem[];
  onCreateCategory: (data: { name: string; color: string; icon: string }) => Promise<void>;
  onUpdateCategory: (id: string, data: { name: string; color: string; icon: string }) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export const ICON_OPTIONS = [
  { name: 'tag', label: 'Tag', icon: Tag },
  { name: 'wallet', label: 'Wallet', icon: Wallet },
  { name: 'shopping-bag', label: 'Shopping', icon: ShoppingBag },
  { name: 'car', label: 'Travel/Vehicle', icon: Car },
  { name: 'home', label: 'Housing', icon: Home },
  { name: 'utensils', label: 'Food/Dining', icon: Utensils },
  { name: 'coffee', label: 'Coffee/Snacks', icon: Coffee },
  { name: 'film', label: 'Entertainment', icon: Film },
  { name: 'gift', label: 'Gifts', icon: Gift },
  { name: 'briefcase', label: 'Work/Business', icon: Briefcase },
  { name: 'heart', label: 'Health/Medical', icon: Heart },
  { name: 'zap', label: 'Utilities', icon: Zap },
  { name: 'book', label: 'Education', icon: Book },
  { name: 'phone', label: 'Bills/Tech', icon: Phone },
  { name: 'plane', label: 'Vacation', icon: Plane },
  { name: 'piggy-bank', label: 'Savings', icon: PiggyBank },
];

export const PRESET_COLORS = [
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#14B8A6', // Teal
  '#64748B', // Slate
];

export function getCategoryIconComponent(iconName?: string) {
  const found = ICON_OPTIONS.find((i) => i.name === iconName?.toLowerCase());
  return found ? found.icon : Tag;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Add Form state
  const [addName, setAddName] = useState('');
  const [addColor, setAddColor] = useState('#6366F1');
  const [addIcon, setAddIcon] = useState('tag');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit Form state
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#6366F1');
  const [editIcon, setEditIcon] = useState('tag');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // General error banner state
  const [pageError, setPageError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddModal = () => {
    setAddName('');
    setAddColor('#6366F1');
    setAddIcon('tag');
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditColor(cat.color || '#6366F1');
    setEditIcon(cat.icon || 'tag');
    setEditError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) {
      setAddError('Category name is required.');
      return;
    }
    setAddError(null);
    setIsSubmittingAdd(true);
    try {
      await onCreateCategory({
        name: addName.trim(),
        color: addColor,
        icon: addIcon,
      });
      setIsAddModalOpen(false);
    } catch (err: any) {
      setAddError(err.message || 'Failed to create category');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!editName.trim()) {
      setEditError('Category name is required.');
      return;
    }
    const catId = editingCategory.id || editingCategory.name;
    setEditError(null);
    setIsSubmittingEdit(true);
    try {
      await onUpdateCategory(catId, {
        name: editName.trim(),
        color: editColor,
        icon: editIcon,
      });
      setEditingCategory(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update category');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    const catId = cat.id || cat.name;
    const confirmDelete = window.confirm(`Are you sure you want to delete category "${cat.name}"?`);
    if (!confirmDelete) return;

    setDeletingId(catId);
    setPageError(null);
    try {
      await onDeleteCategory(catId);
    } catch (err: any) {
      console.error('Delete category error:', err);
      setPageError(err.message || `Failed to delete category "${cat.name}".`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-[1440px] mx-auto" id="categories-page-container">
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[18px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/60">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Category Management</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Organize expenses into custom categories with visual color tags & icons (PostgreSQL + Prisma)
            </p>
          </div>
        </div>

        <button
          id="add-category-btn"
          onClick={openAddModal}
          className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-[14px] shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Page Error Notification Banner */}
      {pageError && (
        <div className="p-4 rounded-[16px] bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{pageError}</span>
          </div>
          <button
            onClick={() => setPageError(null)}
            className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg text-rose-600 dark:text-rose-400 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Category List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const IconComp = getCategoryIconComponent(cat.icon);
          const catId = cat.id || cat.name;
          const isDeleting = deletingId === catId;

          return (
            <div
              key={catId}
              id={`category-card-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="bg-white dark:bg-slate-900 p-4 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 shadow-xs text-white"
                    style={{ backgroundColor: cat.color || '#6366F1' }}
                  >
                    <IconComp className="w-5.5 h-5.5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                      {cat.name}
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block truncate">
                      Icon: {cat.icon || 'tag'}
                    </span>
                  </div>
                </div>

                <div className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: cat.color }} />
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-2">
                <button
                  id={`edit-category-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => openEditModal(cat)}
                  className="px-2.5 py-1.5 rounded-[10px] text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Edit Category"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  id={`delete-category-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => handleDelete(cat)}
                  disabled={isDeleting}
                  className="px-2.5 py-1.5 rounded-[10px] text-xs font-bold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Delete Category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {categories.length === 0 && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[24px] border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <FolderTree className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="font-extrabold text-base text-slate-700 dark:text-slate-300">No Categories Found</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
            Click "Add New Category" above to create your first budget category.
          </p>
        </div>
      )}

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsAddModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Create New Category</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {addError && (
                <div className="p-3 rounded-[12px] bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800">
                  {addError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="add-category-name-input"
                  placeholder="e.g., Groceries, Fuel, Utilities"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category Color
                </label>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setAddColor(color)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer border ${
                        addColor === color ? 'ring-2 ring-emerald-500 scale-110 border-white' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    id="add-category-color-picker"
                    value={addColor}
                    onChange={(e) => setAddColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-white dark:bg-slate-800"
                    title="Custom Color"
                  />
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Icon
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1.5 border border-slate-200 dark:border-slate-800 rounded-[14px] bg-slate-50/50 dark:bg-slate-800/40">
                  {ICON_OPTIONS.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = addIcon === item.name;
                    return (
                      <button
                        type="button"
                        key={item.name}
                        onClick={() => setAddIcon(item.name)}
                        className={`p-2 rounded-[10px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-bold'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-[9px] truncate max-w-full">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[12px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  id="add-category-submit-btn"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-[12px] shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingAdd ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setEditingCategory(null)}
            aria-hidden="true"
          />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Edit Category</h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {editError && (
                <div className="p-3 rounded-[12px] bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800">
                  {editError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="edit-category-name-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category Color
                </label>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setEditColor(color)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer border ${
                        editColor === color ? 'ring-2 ring-emerald-500 scale-110 border-white' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    id="edit-category-color-picker"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-white dark:bg-slate-800"
                    title="Custom Color"
                  />
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Icon
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1.5 border border-slate-200 dark:border-slate-800 rounded-[14px] bg-slate-50/50 dark:bg-slate-800/40">
                  {ICON_OPTIONS.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = editIcon === item.name;
                    return (
                      <button
                        type="button"
                        key={item.name}
                        onClick={() => setEditIcon(item.name)}
                        className={`p-2 rounded-[10px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-bold'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-[9px] truncate max-w-full">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[12px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  id="edit-category-submit-btn"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-[12px] shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingEdit ? 'Saving...' : 'Update Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
