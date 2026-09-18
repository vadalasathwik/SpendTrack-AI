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
  Car,
  Home,
  FileText,
  Key,
  ShieldCheck,
  Fuel,
  Wrench,
  Percent,
} from 'lucide-react';
import { SpendTrackApi } from '../services/api.js';
import { GlassCard } from '../components/ui/GlassCard.js';

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
  const [netWorthData, setNetWorthData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [selectedRange, setSelectedRange] = useState<string>('6M');
  const [loading, setLoading] = useState(true);

  // Property & Vehicle State
  const [propertyData, setPropertyData] = useState<any>(null);
  const [vehicleData, setVehicleData] = useState<any>(null);

  // Modals state
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState(ASSET_CATEGORIES[0]);
  const [assetAmount, setAssetAmount] = useState('');

  const [isAddLiabilityOpen, setIsAddLiabilityOpen] = useState(false);
  const [liabilityName, setLiabilityName] = useState('');
  const [liabilityCategory, setLiabilityCategory] = useState(LIABILITY_CATEGORIES[0]);
  const [liabilityAmount, setLiabilityAmount] = useState('');

  // Add Property state
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [propTitle, setPropTitle] = useState('');
  const [propType, setPropType] = useState('RESIDENTIAL');
  const [propPurchase, setPropPurchase] = useState('');
  const [propMarket, setPropMarket] = useState('');
  const [propLoan, setPropLoan] = useState('');
  const [propRental, setPropRental] = useState('');

  // Add Vehicle state
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [vehName, setVehName] = useState('');
  const [vehType, setVehType] = useState('CAR');
  const [vehPrice, setVehPrice] = useState('');
  const [vehResale, setVehResale] = useState('');
  const [vehFuel, setVehFuel] = useState('');
  const [vehInsurance, setVehInsurance] = useState('');

  const loadData = async (range: string = selectedRange) => {
    try {
      const [data, hist, props, vehs] = await Promise.all([
        SpendTrackApi.getNetWorth(),
        SpendTrackApi.getNetWorthHistory(range).catch(() => null),
        SpendTrackApi.getProperty().catch(() => null),
        SpendTrackApi.getVehicles().catch(() => null),
      ]);
      setNetWorthData(data);
      setHistoryData(hist);
      setPropertyData(props);
      setVehicleData(vehs);
    } catch (err) {
      console.error('Failed to load Net Worth data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedRange);
  }, [selectedRange]);

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

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propTitle || !propMarket) return;
    try {
      await SpendTrackApi.createProperty({
        title: propTitle,
        propertyType: propType,
        purchaseValue: Number(propPurchase || propMarket),
        currentMarketValue: Number(propMarket),
        loanLinked: Number(propLoan || 0),
        rentalIncome: Number(propRental || 0),
      });
      setIsAddPropertyOpen(false);
      setPropTitle('');
      setPropPurchase('');
      setPropMarket('');
      setPropLoan('');
      setPropRental('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add property');
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehName || !vehPrice) return;
    try {
      await SpendTrackApi.createVehicle({
        name: vehName,
        vehicleType: vehType,
        purchasePrice: Number(vehPrice),
        resaleValue: Number(vehResale || Number(vehPrice) * 0.75),
        fuelCost: Number(vehFuel || 0),
        insurance: Number(vehInsurance || 0),
      });
      setIsAddVehicleOpen(false);
      setVehName('');
      setVehPrice('');
      setVehResale('');
      setVehFuel('');
      setVehInsurance('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add vehicle');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Calculating Net Worth Intelligence...</p>
      </div>
    );
  }

  const totalAssets = netWorthData?.totalAssets ?? 0;
  const totalLiabilities = netWorthData?.totalLiabilities ?? 0;
  const netWorth = netWorthData?.netWorth ?? 0;
  const liabilityRatioPct = netWorthData?.liabilityRatioPct ?? 0;
  const monthlyGrowthPct = netWorthData?.monthlyGrowthPct ?? 3.8;
  const assetsList = netWorthData?.assetsList ?? [];
  const liabilitiesList = netWorthData?.liabilitiesList ?? [];
  const aiInsight = netWorthData?.aiInsight || `Net worth position is ₹${netWorth.toLocaleString('en-IN')}.`;

  return (
    <div className="space-y-8 pb-28 max-w-[1440px] mx-auto animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-200/80 dark:border-slate-800 soft-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
            <Vault className="w-3.5 h-3.5 text-emerald-400" />
            <span>Enterprise Wealth OS v4.7.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-emerald-500" />
            <span>Net Worth & Asset Portfolio</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Real-time balance sheet integrating Properties, Vehicles, Investments, Bank Balances, and Liabilities.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={() => setIsAddAssetOpen(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Asset</span>
          </button>
          <button
            onClick={() => setIsAddLiabilityOpen(true)}
            className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Liability</span>
          </button>
        </div>
      </div>

      {/* TOP SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <GlassCard className="p-6">
          <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">Total Net Worth</span>
          <div className="text-3xl font-black text-white font-mono mt-1">
            ₹{netWorth.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-400">
            <ArrowUpRight className="w-4 h-4" />
            <span>+{monthlyGrowthPct}% this month</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Assets</span>
          <div className="text-3xl font-black text-white font-mono mt-1">
            ₹{totalAssets.toLocaleString('en-IN')}
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-2">
            Includes {assetsList.length} assets & property assets
          </p>
        </GlassCard>

        <GlassCard className="p-6">
          <span className="text-xs font-extrabold text-rose-400 uppercase tracking-wider">Total Liabilities</span>
          <div className="text-3xl font-black text-white font-mono mt-1">
            ₹{totalLiabilities.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-slate-400">
            <span>Debt Ratio: {liabilityRatioPct}%</span>
          </div>
        </GlassCard>
      </div>

      {/* PHASE 1: PROPERTY PORTFOLIO INTELLIGENCE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Property Portfolio Intelligence</h2>
          </div>
          <button
            onClick={() => setIsAddPropertyOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Property</span>
          </button>
        </div>

        {propertyData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
              <span className="text-xs font-bold text-indigo-300">Total Property Wealth</span>
              <div className="text-xl font-black text-white font-mono">₹{propertyData.totalPropertyWealth?.toLocaleString('en-IN')}</div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <span className="text-xs font-bold text-emerald-300">Equity Owned</span>
              <div className="text-xl font-black text-white font-mono">₹{propertyData.totalEquityOwned?.toLocaleString('en-IN')}</div>
            </div>
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1">
              <span className="text-xs font-bold text-purple-300">Monthly Rental Yield</span>
              <div className="text-xl font-black text-white font-mono">{propertyData.overallRentalYield}% <span className="text-xs text-slate-400">(₹{propertyData.totalMonthlyRental?.toLocaleString('en-IN')}/mo)</span></div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <span className="text-xs font-bold text-amber-300">Avg Appreciation</span>
              <div className="text-xl font-black text-white font-mono">+{propertyData.averageAppreciationRate}% / yr</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {propertyData?.properties?.map((prop: any) => {
            const equity = prop.currentMarketValue - prop.loanLinked;
            const equityPct = prop.currentMarketValue > 0 ? Math.round((equity / prop.currentMarketValue) * 100) : 100;
            return (
              <GlassCard key={prop.id} className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-1">
                      <Building className="w-3 h-3" />
                      <span>{prop.propertyType}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-white">{prop.title}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-400 block">Market Value</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">₹{prop.currentMarketValue.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/60 text-xs border border-slate-800">
                  <div>
                    <span className="text-slate-400 block">Purchase</span>
                    <span className="font-bold text-white">₹{prop.purchaseValue.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Loan Linked</span>
                    <span className="font-bold text-rose-400">₹{prop.loanLinked.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Rental Income</span>
                    <span className="font-bold text-emerald-400">₹{prop.rentalIncome.toLocaleString('en-IN')}/mo</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-300">Equity Progress ({equityPct}%)</span>
                    <span className="text-emerald-400">₹{equity.toLocaleString('en-IN')} Equity</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full" style={{ width: `${equityPct}%` }} />
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* PHASE 1: VEHICLE ASSET MANAGER */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Vehicle Asset Manager</h2>
          </div>
          <button
            onClick={() => setIsAddVehicleOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Vehicle</span>
          </button>
        </div>

        {vehicleData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1">
              <span className="text-xs font-bold text-blue-300">Total Purchase Value</span>
              <div className="text-xl font-black text-white font-mono">₹{vehicleData.totalPurchaseValue?.toLocaleString('en-IN')}</div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <span className="text-xs font-bold text-emerald-300">Current Resale Value</span>
              <div className="text-xl font-black text-white font-mono">₹{vehicleData.totalResaleValue?.toLocaleString('en-IN')}</div>
            </div>
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
              <span className="text-xs font-bold text-rose-300">Total Depreciation</span>
              <div className="text-xl font-black text-white font-mono">₹{vehicleData.totalDepreciation?.toLocaleString('en-IN')}</div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <span className="text-xs font-bold text-amber-300">AI Best Resale Window</span>
              <div className="text-xl font-black text-white font-mono">Year {vehicleData.bestResaleYear}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicleData?.vehicles?.map((veh: any) => {
            const annualCost = (veh.fuelCost * 12) + (veh.emi * 12) + veh.insurance + veh.serviceHistoryCost;
            return (
              <GlassCard key={veh.id} className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-1">
                      <Car className="w-3 h-3" />
                      <span>{veh.vehicleType}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-white">{veh.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-400 block">Est. Resale</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">₹{veh.resaleValue.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/60 text-xs border border-slate-800">
                  <div>
                    <span className="text-slate-400 block">Purchase ({veh.purchaseYear})</span>
                    <span className="font-bold text-white">₹{veh.purchasePrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Annual Insurance</span>
                    <span className="font-bold text-blue-400">₹{veh.insurance.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Monthly Fuel</span>
                    <span className="font-bold text-amber-400">₹{veh.fuelCost.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400">Annual Cost of Ownership:</span>
                  <span className="font-black text-rose-400 font-mono">₹{annualCost.toLocaleString('en-IN')}/yr</span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* ASSET & LIABILITY LISTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-400" />
              <span>Assets breakdown</span>
            </h3>
            <span className="text-xs font-bold text-emerald-400">₹{totalAssets.toLocaleString('en-IN')}</span>
          </div>

          <div className="space-y-2.5">
            {assetsList.map((asset: any) => (
              <div key={asset.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">{asset.name}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{asset.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-emerald-400 font-mono">₹{asset.amount.toLocaleString('en-IN')}</span>
                  <button onClick={() => handleDeleteAsset(asset.id)} className="text-slate-500 hover:text-rose-400 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-rose-400" />
              <span>Liabilities Breakdown</span>
            </h3>
            <span className="text-xs font-bold text-rose-400">₹{totalLiabilities.toLocaleString('en-IN')}</span>
          </div>

          <div className="space-y-2.5">
            {liabilitiesList.map((liab: any) => (
              <div key={liab.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">{liab.name}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{liab.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-rose-400 font-mono">₹{liab.amount.toLocaleString('en-IN')}</span>
                  <button onClick={() => handleDeleteLiability(liab.id)} className="text-slate-500 hover:text-rose-400 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Add Property Modal */}
      {isAddPropertyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[24px] p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-white mb-4">Add Real Estate Property</h3>
            <form onSubmit={handleCreateProperty} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Property Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prestige Heights 2BHK"
                  value={propTitle}
                  onChange={(e) => setPropTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Type</label>
                  <select
                    value={propType}
                    onChange={(e) => setPropType(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="RESIDENTIAL">Residential House</option>
                    <option value="APARTMENT">Apartment</option>
                    <option value="LAND">Land Plot</option>
                    <option value="COMMERCIAL">Commercial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Current Value (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="7500000"
                    value={propMarket}
                    onChange={(e) => setPropMarket(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    placeholder="6000000"
                    value={propPurchase}
                    onChange={(e) => setPropPurchase(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Loan Linked (₹)</label>
                  <input
                    type="number"
                    placeholder="3000000"
                    value={propLoan}
                    onChange={(e) => setPropLoan(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Monthly Rental Income (₹)</label>
                <input
                  type="number"
                  placeholder="25000"
                  value={propRental}
                  onChange={(e) => setPropRental(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsAddPropertyOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-500 text-white font-extrabold cursor-pointer">Save Property</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[24px] p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-white mb-4">Add Vehicle Asset</h3>
            <form onSubmit={handleCreateVehicle} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Vehicle Model / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Honda City i-VTEC"
                  value={vehName}
                  onChange={(e) => setVehName(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Vehicle Type</label>
                  <select
                    value={vehType}
                    onChange={(e) => setVehType(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="CAR">Car</option>
                    <option value="BIKE">Bike</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="1200000"
                    value={vehPrice}
                    onChange={(e) => setVehPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Resale Value (₹)</label>
                  <input
                    type="number"
                    placeholder="850000"
                    value={vehResale}
                    onChange={(e) => setVehResale(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Monthly Fuel (₹)</label>
                  <input
                    type="number"
                    placeholder="5000"
                    value={vehFuel}
                    onChange={(e) => setVehFuel(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Annual Insurance (₹)</label>
                <input
                  type="number"
                  placeholder="25000"
                  value={vehInsurance}
                  onChange={(e) => setVehInsurance(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsAddVehicleOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-blue-500 text-white font-extrabold cursor-pointer">Save Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  placeholder="e.g. HDFC Fixed Deposit"
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
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs cursor-pointer"
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
                  className="px-4 py-2 rounded-xl bg-rose-500 text-white font-extrabold text-xs cursor-pointer"
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
