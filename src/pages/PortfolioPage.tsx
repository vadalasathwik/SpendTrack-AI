import React, { useState, useEffect } from 'react';
import { LineChart, Plus, TrendingUp, ShieldAlert, Sparkles, PieChart, Layers, Eye, Bell, Globe, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard.js';
import { PortfolioCard } from '../components/ui/PortfolioCard.js';
import { PerformanceChart } from '../components/ui/PerformanceChart.js';
import { SpendTrackApi } from '../services/api.js';

export const PortfolioPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [marketData, setMarketData] = useState<any>(null);
  const [watchlistData, setWatchlistData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Holding Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [assetType, setAssetType] = useState('MUTUAL_FUNDS');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [sector, setSector] = useState('Technology');
  const [cagr, setCagr] = useState('12');

  // Watchlist Modal state
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [watchSymbol, setWatchSymbol] = useState('');
  const [watchName, setWatchName] = useState('');
  const [watchType, setWatchType] = useState('STOCK');
  const [targetBuy, setTargetBuy] = useState('');
  const [currentVal, setCurrentVal] = useState('');
  const [conviction, setConviction] = useState('90');

  const loadData = async () => {
    setLoading(true);
    try {
      const [summary, market, watch] = await Promise.all([
        SpendTrackApi.getPortfolioSummary(),
        SpendTrackApi.getMarket().catch(() => null),
        SpendTrackApi.getWatchlist().catch(() => null),
      ]);
      setData(summary);
      setMarketData(market);
      setWatchlistData(watch);
    } catch (e) {
      console.warn('Failed to load portfolio, market, or watchlist:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !quantity || !buyPrice) return;

    try {
      await SpendTrackApi.addPortfolioHolding({
        name,
        symbol: symbol || name.substring(0, 5).toUpperCase(),
        assetType,
        quantity: Number(quantity),
        buyPrice: Number(buyPrice),
        currentPrice: currentPrice ? Number(currentPrice) : Number(buyPrice),
        sector,
        cagr: Number(cagr),
      });

      setName('');
      setSymbol('');
      setQuantity('');
      setBuyPrice('');
      setCurrentPrice('');
      setShowAddModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to add portfolio holding:', err);
    }
  };

  const handleAddWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!watchSymbol || !watchName || !targetBuy) return;

    try {
      await SpendTrackApi.addToWatchlist({
        symbol: watchSymbol,
        name: watchName,
        assetType: watchType,
        targetBuyPrice: Number(targetBuy),
        currentPrice: currentVal ? Number(currentVal) : Number(targetBuy) * 1.05,
        convictionScore: Number(conviction),
      });

      setWatchSymbol('');
      setWatchName('');
      setTargetBuy('');
      setCurrentVal('');
      setShowWatchlistModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to add watchlist item:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await SpendTrackApi.deletePortfolioHolding(id);
      loadData();
    } catch (e) {
      console.error('Failed to delete holding:', e);
    }
  };

  return (
    <div className="space-y-6 pb-28 max-w-[1440px] mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-200/80 dark:border-slate-800 soft-shadow">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>SpendTrack AI Market Intelligence & Watchlist v4.8.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <LineChart className="w-7 h-7 text-emerald-400" /> Portfolio & Real-World Market Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            NIFTY, BANKNIFTY, Gold, USD/INR Telemetry, AI Conviction Scores & Target Watchlist
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={() => setShowWatchlistModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-indigo-500/20"
          >
            <Eye className="w-4 h-4" /> Add Watchlist Target
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Add Holding
          </button>
        </div>
      </div>

      {/* PHASE 3: MARKET INTELLIGENCE DASHBOARD EXECUTIVE CARDS */}
      {marketData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-black text-white">Real-Time Market Ticker & Macro Indicators</h2>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Sentiment: {marketData.marketSentiment}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {marketData.indices?.map((quote: any) => {
              const isUp = quote.change >= 0;
              return (
                <GlassCard key={quote.symbol} className="p-3.5 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block truncate">{quote.symbol}</span>
                  <div className="text-base font-black text-white font-mono">₹{quote.price.toLocaleString('en-IN')}</div>
                  <div className={`text-[10px] font-bold flex items-center gap-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    <span>{isUp ? '+' : ''}{quote.changePercent}%</span>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          {/* AI Market Outlook Banner */}
          <GlassCard className="p-5 border-l-4 border-l-indigo-500 space-y-2">
            <span className="text-xs font-black uppercase text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Market Outlook & Gold/Equity Trend</span>
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {marketData.equityOutlook || marketData.goldTrend}
            </p>
          </GlassCard>
        </div>
      )}

      {/* PHASE 3: INVESTMENT WATCHLIST */}
      {watchlistData && (
        <div className="bg-slate-900 border border-slate-800 rounded-[28px] p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-black text-white">Investment Watchlist & AI Conviction Targets</h2>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              {watchlistData.triggeredAlertsCount} Alerts Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {watchlistData.watchlist?.map((item: any) => {
              const isTargetReached = item.currentPrice <= item.targetBuyPrice;
              return (
                <div key={item.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                        {item.assetType}
                      </span>
                      <h4 className="text-sm font-extrabold text-white mt-1">{item.name}</h4>
                      <span className="text-[10px] font-mono text-slate-400 block">{item.symbol}</span>
                    </div>
                    <span className="text-xs font-black text-purple-400 px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                      {item.convictionScore}% Conviction
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Current Price</span>
                      <span className="font-bold text-white font-mono">₹{item.currentPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Target Buy Price</span>
                      <span className="font-bold text-emerald-400 font-mono">₹{item.targetBuyPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {isTargetReached && (
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Target Price Reached! Good buying window.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PORTFOLIO SUMMARY KPIS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Current Portfolio</span>
          <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
            ₹{data?.totalCurrentValue?.toLocaleString('en-IN') || 0}
          </p>
        </GlassCard>

        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Invested Amount</span>
          <p className="text-xl font-bold text-slate-400 font-mono">
            ₹{data?.totalInvested?.toLocaleString('en-IN') || 0}
          </p>
        </GlassCard>

        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Profit / Loss</span>
          <p className={`text-xl font-black font-mono ${(data?.totalProfitLoss || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {(data?.totalProfitLoss || 0) >= 0 ? '+' : ''}₹{data?.totalProfitLoss?.toLocaleString('en-IN') || 0}
          </p>
        </GlassCard>

        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Average CAGR / XIRR</span>
          <p className="text-xl font-black text-indigo-400 font-mono">
            {data?.averageCagr?.toFixed(1) || 14.2}%
          </p>
        </GlassCard>
      </div>

      {/* Holdings List */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" /> Holdings ({data?.holdings?.length || 0})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.holdings?.map((holding: any) => (
            <PortfolioCard key={holding.id} holding={holding} onDelete={handleDelete} />
          ))}
        </div>
      </div>

      {/* Add Holding Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[28px] p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-white mb-4">Add Portfolio Holding</h3>
            <form onSubmit={handleAddHolding} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parag Parikh Flexi Cap Fund"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Asset Type</label>
                  <select
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="MUTUAL_FUNDS">Mutual Funds</option>
                    <option value="STOCKS">Stocks</option>
                    <option value="ETFS">ETFs</option>
                    <option value="GOLD">Digital Gold / SGB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Symbol</label>
                  <input
                    type="text"
                    placeholder="PPFCF"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Units / Quantity</label>
                  <input
                    type="number"
                    required
                    placeholder="150"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Avg Buy Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="65.4"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-extrabold cursor-pointer">Save Holding</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Watchlist Modal */}
      {showWatchlistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[28px] p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-white mb-4">Add Watchlist Target</h3>
            <form onSubmit={handleAddWatchlist} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Ticker Symbol</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RELIANCE"
                  value={watchSymbol}
                  onChange={(e) => setWatchSymbol(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Company / Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reliance Industries Ltd"
                  value={watchName}
                  onChange={(e) => setWatchName(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Target Buy Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="2850"
                    value={targetBuy}
                    onChange={(e) => setTargetBuy(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">AI Conviction Score %</label>
                  <input
                    type="number"
                    placeholder="90"
                    value={conviction}
                    onChange={(e) => setConviction(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowWatchlistModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-500 text-white font-extrabold cursor-pointer">Save Target</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
