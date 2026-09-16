import React, { useEffect, useState } from 'react';
import {
  Vault,
  Plus,
  Trash2,
  TrendingUp,
  PieChart,
  Shield,
  CreditCard,
  Building,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { SpendTrackApi } from '../services/api.js';
import { NetWorthSummary, AssetItem, LiabilityItem } from '../types.js';

const ASSET_CATEGORIES = [
  'Cash',
  'Bank',
  'Gold',
  'Stocks',
  'Mutual Funds',
  'FD',
  'RD',
  'Land',
  'House',
  'Other',
];

const LIABILITY_CATEGORIES = [
  'Home Loan',
  'Car Loan',
  'Personal Loan',
  'Credit Card',
  'Other',
];

export const NetWorthPage: React.FC = () => {
  const [netWorthData, setNetWorthData] = useState<NetWorthSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // New Asset Modal state
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState(ASSET_CATEGORIES[0]);
  const [assetAmount, setAssetAmount] = useState('');

  // New Liability Modal state
  const [isAddLiabilityOpen, setIsAddLiabilityOpen] = useState(false);
  const [liabilityName, setLiabilityName] = useState('');
  const [liabilityCategory, setLiabilityCategory] = useState(LIABILITY_CATEGORIES[0]);
  const [liabilityAmount, setLiabilityAmount] = useState('');

  const loadData = async () => {
    try {
      const data = await SpendTrackApi.getNetWorth();
      setNetWorthData(data);
    } catch (err) {
      console.error('Failed to load Net Worth data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName || !assetAmount || isNaN(Number(assetAmount))) return;
    try {
      await SpendTrackApi.createAsset({
        name: assetName,
        category: assetCategory,
        amount: Number(assetAmount),
      });
      setAssetName('');
      setAssetAmount('');
      setIsAddAssetOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add asset');
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('Are you sure you want to remove this asset?')) return;
    try {
      await SpendTrackApi.deleteAsset(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete asset');
    }
  };

  const handleAddLiability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liabilityName || !liabilityAmount || isNaN(Number(liabilityAmount))) return;
    try {
      await SpendTrackApi.createLiability({
        name: liabilityName,
        category: liabilityCategory,
        amount: Number(liabilityAmount),
      });
      setLiabilityName('');
      setLiabilityAmount('');
      setIsAddLiabilityOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add liability');
    }
  };

  const handleDeleteLiability = async (id: string) => {
    if (!confirm('Are you sure you want to remove this liability?')) return;
    try {
      await SpendTrackApi.deleteLiability(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete liability');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Calculating Total Net Worth...</p>
      </div>
    );
  }

  const totalAssets = netWorthData?.totalAssets ?? 0;
  const totalLiabilities = netWorthData?.totalLiabilities ?? 0;
  const netWorth = netWorthData?.netWorth ?? 0;
  const assetsList = netWorthData?.assetsList ?? [];
  const liabilitiesList = netWorthData?.liabilitiesList ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-[28px] border border-emerald-800/40 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
            <Vault className="w-3.5 h-3.5" />
            <span>Wealth Tracker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Net Worth Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Total Assets minus Liabilities calculated live from PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddAssetOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Asset</span>
          </button>
          <button
            onClick={() => setIsAddLiabilityOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Liability</span>
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-[24px] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total Net Worth</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-black text-white tracking-tight">
              ₹{netWorth.toLocaleString('en-IN')}
            </h2>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Net Wealth Position</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-[24px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total Assets</span>
            <span className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Coins className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-black text-white tracking-tight">
              ₹{totalAssets.toLocaleString('en-IN')}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Cash, Bank, Investments & Property</p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-[24px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total Liabilities</span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <CreditCard className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-black text-rose-400 tracking-tight">
              ₹{totalLiabilities.toLocaleString('en-IN')}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Outstanding Loans & Liabilities</p>
          </div>
        </div>
      </div>

      {/* Assets & Liabilities Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets List */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-[24px] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-teal-400" />
              <h3 className="font-extrabold text-lg text-white">Assets Catalog</h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-400">
              {assetsList.length} Items
            </span>
          </div>

          <div className="space-y-3">
            {assetsList.map((asset) => (
              <div
                key={asset.id}
                className="p-4 rounded-[16px] bg-slate-800/40 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white">{asset.name}</h4>
                    {asset.isAuto && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        Auto
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{asset.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-sm text-emerald-400">
                    +₹{asset.amount.toLocaleString('en-IN')}
                  </span>
                  {!asset.isAuto && (
                    <button
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Liabilities List */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-[24px] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-rose-400" />
              <h3 className="font-extrabold text-lg text-white">Liabilities Catalog</h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400">
              {liabilitiesList.length} Items
            </span>
          </div>

          <div className="space-y-3">
            {liabilitiesList.map((liab) => (
              <div
                key={liab.id}
                className="p-4 rounded-[16px] bg-slate-800/40 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white">{liab.name}</h4>
                    {liab.isAuto && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        Auto
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{liab.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-sm text-rose-400">
                    -₹{liab.amount.toLocaleString('en-IN')}
                  </span>
                  {!liab.isAuto && (
                    <button
                      onClick={() => handleDeleteLiability(liab.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Asset Modal */}
      {isAddAssetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[24px] p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-white mb-4">Add Custom Asset</h3>
            <form onSubmit={handleAddAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gold Coins, Savings Account, Land"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Category</label>
                <select
                  value={assetCategory}
                  onChange={(e) => setAssetCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {ASSET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Valuation Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 150000"
                  value={assetAmount}
                  onChange={(e) => setAssetAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddAssetOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Liability Modal */}
      {isAddLiabilityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[24px] p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-white mb-4">Add Custom Liability</h3>
            <form onSubmit={handleAddLiability} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Liability Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Credit Card Balance, Personal Loan"
                  value={liabilityName}
                  onChange={(e) => setLiabilityName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Category</label>
                <select
                  value={liabilityCategory}
                  onChange={(e) => setLiabilityCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {LIABILITY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Outstanding Balance (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 45000"
                  value={liabilityAmount}
                  onChange={(e) => setLiabilityAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddLiabilityOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-500 text-white font-extrabold text-xs"
                >
                  Save Liability
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
