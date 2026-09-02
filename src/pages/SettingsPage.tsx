import React, { useState } from 'react';
import {
  FolderOpen,
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Info,
  LogOut,
  RefreshCw,
  HardDrive,
  Calendar,
} from 'lucide-react';
import { CategoryItem } from '../types';
import { formatCurrency } from '../utils/calculations';

interface SettingsPageProps {
  categories: CategoryItem[];
  onSaveCategories: (categories: CategoryItem[]) => Promise<void>;
  onExportCsv: () => void;
  onImportCsv: (file: File) => void;
  onSignOut: () => void;
  userEmail?: string;
  workspaceStatus?: { spreadsheetId: string; driveFolders: any } | null;
  onRefreshWorkspace: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  categories,
  onSaveCategories,
  onExportCsv,
  onImportCsv,
  onSignOut,
  userEmail,
  workspaceStatus,
  onRefreshWorkspace,
}) => {
  const [categoryList, setCategoryList] = useState<CategoryItem[]>(categories);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#10B981');
  const [isSavingCat, setIsSavingCat] = useState(false);

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    const exists = categoryList.some((c) => c.name.toLowerCase() === newCatName.trim().toLowerCase());
    if (exists) return;

    const updated = [
      ...categoryList,
      {
        name: newCatName.trim(),
        color: newCatColor,
        subcategories: [],
      },
    ];

    setCategoryList(updated);
    setNewCatName('');
    setIsSavingCat(true);
    try {
      await onSaveCategories(updated);
    } finally {
      setIsSavingCat(false);
    }
  };

  const handleDeleteCategory = async (name: string) => {
    const updated = categoryList.filter((c) => c.name !== name);
    setCategoryList(updated);
    setIsSavingCat(true);
    try {
      await onSaveCategories(updated);
    } finally {
      setIsSavingCat(false);
    }
  };

  return (
    <div className="space-y-6 pb-12" id="settings-page-container">
      {/* Google Workspace Integration Status */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Connected Infrastructure
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">Google Workspace Integrations</h2>
            <p className="text-xs text-slate-500">
              Live bi-directional sync with your Google account ({userEmail || 'Active user'})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshWorkspace}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Verify Sync</span>
            </button>
            <button
              onClick={onSignOut}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Google Sheets Card */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Google Sheets</span>
            </div>
            <p className="text-[11px] text-emerald-800">
              Primary database for Expenses, Categories, and Recurring Bills.
            </p>
            {workspaceStatus?.spreadsheetId ? (
              <a
                href={`https://docs.google.com/spreadsheets/d/${workspaceStatus.spreadsheetId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline text-[11px] pt-1"
              >
                <span>Open "SpendTrack" Spreadsheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-[11px] text-emerald-700 font-medium">Synced and connected</span>
            )}
          </div>

          {/* Google Drive Card */}
          <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-bold">
              <HardDrive className="w-4 h-4 text-blue-600" />
              <span>Google Drive</span>
            </div>
            <p className="text-[11px] text-blue-800">
              Dedicated <code>SpendTrack/Receipts/</code> directory for receipt images & exports.
            </p>
            <span className="text-[11px] text-blue-700 font-medium">Secure private storage active</span>
          </div>

          {/* Google Calendar Card */}
          <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-purple-900 font-bold">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>Google Calendar</span>
            </div>
            <p className="text-[11px] text-purple-800">
              Automated pop-up reminders and recurring bill events synced with Primary Calendar.
            </p>
            <span className="text-[11px] text-purple-700 font-medium">Sync enabled</span>
          </div>
        </div>
      </div>

      {/* Categories & Subcategories Management */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Custom Categories</h3>
          <p className="text-xs text-slate-500">Add or manage categories and visual color tags</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="New Category Name"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <input
            type="color"
            value={newCatColor}
            onChange={(e) => setNewCatColor(e.target.value)}
            className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
            title="Choose Color"
          />
          <button
            onClick={handleAddCategory}
            disabled={!newCatName.trim() || isSavingCat}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
          {categoryList.map((cat) => (
            <div
              key={cat.name}
              className="p-2.5 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="font-semibold text-xs text-slate-800">{cat.name}</span>
                {cat.subcategories.length > 0 && (
                  <span className="text-[10px] text-slate-400">({cat.subcategories.length} sub)</span>
                )}
              </div>

              <button
                onClick={() => handleDeleteCategory(cat.name)}
                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                title="Delete Category"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CSV Data Export & Import */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Data Portability (CSV Export / Import)</h3>
          <p className="text-xs text-slate-500">Download complete offline backups or restore expense records</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onExportCsv}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Expenses as CSV</span>
          </button>

          <label className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-2 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Import Expenses from CSV</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportCsv(file);
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
};
