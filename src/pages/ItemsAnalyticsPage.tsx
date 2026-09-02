import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Package,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Info,
  Calendar,
  Plus,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { Expense, ItemAnalyticsSummary } from '../types';
import {
  generateItemAnalytics,
  generateConsumptionInsights,
  formatCurrency,
  formatConsumptionVelocity,
} from '../utils/calculations';
import { formatDisplayDate } from '../utils/dateRanges';
import { CATEGORY_COLORS } from '../data/defaults';

interface ItemsAnalyticsPageProps {
  expenses: Expense[];
  selectedItemName?: string | null;
  onSelectItem: (itemName: string) => void;
  onQuickAddExpense?: (itemName: string, category: string, unit: string) => void;
}

export const ItemsAnalyticsPage: React.FC<ItemsAnalyticsPageProps> = ({
  expenses,
  selectedItemName,
  onSelectItem,
  onQuickAddExpense,
}) => {
  const allItemSummaries = generateItemAnalytics(expenses);
  const allInsights = generateConsumptionInsights(expenses);

  const [activeItemKey, setActiveItemKey] = useState<string>(
    selectedItemName || (allItemSummaries.length > 0 ? allItemSummaries[0].itemName : '')
  );

  const activeItem =
    allItemSummaries.find((s) => s.itemName.toLowerCase() === activeItemKey.toLowerCase()) ||
    allItemSummaries[0];

  useEffect(() => {
    if (selectedItemName) {
      setActiveItemKey(selectedItemName);
    }
  }, [selectedItemName]);

  // Historical price chart data for selected item
  const itemHistoryAsc = activeItem
    ? [...activeItem.history].sort((a, b) => (a.purchaseDate || '').localeCompare(b.purchaseDate || ''))
    : [];

  const priceHistoryChartData = itemHistoryAsc.map((h) => ({
    date: h.purchaseDate,
    displayDate: formatDisplayDate(h.purchaseDate),
    totalPrice: h.totalPrice,
    unitPrice: h.pricePerUnit || (h.quantity ? Number((h.totalPrice / h.quantity).toFixed(2)) : h.totalPrice),
    quantity: h.quantity || 0,
    duration: h.durationDays || 0,
  }));

  // Filter insights for active item
  const itemInsights = allInsights.filter(
    (ins) => ins.itemName.toLowerCase() === activeItem?.itemName.toLowerCase()
  );

  const velocityStr = activeItem
    ? formatConsumptionVelocity(
        activeItem.totalQuantity,
        activeItem.unit,
        activeItem.averageDurationDays * activeItem.purchaseCount
      )
    : null;

  return (
    <div className="space-y-6 pb-12" id="items-analytics-container">
      {/* 1. Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Item Intelligence & Consumption
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Price Shifts & Lifespan Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track price inflation shifts, daily cost burn, and exact days items lasted
            </p>
          </div>

          {/* Item Selector dropdown */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <select
              id="analytics-item-select"
              value={activeItem?.itemName || ''}
              onChange={(e) => {
                setActiveItemKey(e.target.value);
                onSelectItem(e.target.value);
              }}
              className="px-3.5 py-2 text-xs sm:text-sm font-bold border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 shadow-2xs"
            >
              {allItemSummaries.map((it) => (
                <option key={it.itemName} value={it.itemName}>
                  {it.itemName} ({it.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Horizontal Scroll Pills */}
        {allItemSummaries.length > 0 && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 overflow-x-auto pb-1 scrollbar-thin">
            {allItemSummaries.map((it) => {
              const isSelected = activeItem?.itemName.toLowerCase() === it.itemName.toLowerCase();
              return (
                <button
                  key={it.itemName}
                  id={`item-pill-${it.itemName}`}
                  onClick={() => {
                    setActiveItemKey(it.itemName);
                    onSelectItem(it.itemName);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-200/80 hover:border-emerald-200'
                  }`}
                >
                  <span>{it.itemName}</span>
                  <span className={`text-[10px] ml-1.5 ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                    ({it.purchaseCount}x)
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {activeItem ? (
        <>
          {/* 2. Active Item Key Metric Hero Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Latest Price */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Latest Price</span>
              <div className="my-2">
                <div className="text-2xl font-black text-slate-900">
                  {formatCurrency(activeItem.latestPrice)}
                </div>
                {activeItem.purchaseCount <= 1 ? (
                  <div className="text-xs font-medium text-slate-400 mt-1">
                    Not enough history yet
                  </div>
                ) : activeItem.priceChange !== undefined && activeItem.priceChange !== 0 ? (
                  <div
                    className={`text-xs font-bold flex items-center gap-1 mt-1 ${
                      activeItem.priceChange > 0
                        ? 'text-rose-600'
                        : activeItem.priceChange < 0
                        ? 'text-emerald-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {activeItem.priceChange > 0 ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : activeItem.priceChange < 0 ? (
                      <TrendingDown className="w-3.5 h-3.5" />
                    ) : null}
                    <span>
                      {activeItem.priceChange > 0 ? '+' : ''}
                      {formatCurrency(activeItem.priceChange)} ({activeItem.percentagePriceChange && activeItem.percentagePriceChange > 0 ? '+' : ''}
                      {activeItem.percentagePriceChange}%) vs previous
                    </span>
                  </div>
                ) : (
                  <div className="text-xs font-medium text-slate-500 mt-1">
                    No price change vs previous
                  </div>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                Latest purchase: {formatDisplayDate(activeItem.latestPurchaseDate)}
              </div>
            </div>

            {/* Average Duration / Lifespan */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lifespan / Duration</span>
              <div className="my-2">
                <div className="text-2xl font-black text-slate-900">
                  {activeItem.averageDurationDays > 0 ? `~${activeItem.averageDurationDays} days` : 'In use'}
                </div>
                {itemHistoryAsc.length > 0 && itemHistoryAsc[itemHistoryAsc.length - 1].durationDays ? (
                  <div className="text-xs text-emerald-700 font-bold mt-1">
                    Last batch lasted {itemHistoryAsc[itemHistoryAsc.length - 1].durationDays} days
                  </div>
                ) : null}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                Based on recorded start & end dates
              </div>
            </div>

            {/* Daily Cost Run Rate */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Daily Run Rate</span>
              <div className="my-2">
                <div className="text-2xl font-black text-emerald-600">
                  {activeItem.averageDailyCost > 0 ? `₹${activeItem.averageDailyCost}/day` : '—'}
                </div>
                {velocityStr && (
                  <div className="text-xs text-slate-600 font-semibold mt-1">
                    Burn velocity: {velocityStr}
                  </div>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                ~{formatCurrency(activeItem.averageDailyCost * 30.42)}/month equivalent
              </div>
            </div>

            {/* Total Cumulative Volume */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Volume</span>
              <div className="my-2">
                <div className="text-2xl font-black text-slate-900">
                  {formatCurrency(activeItem.totalSpent)}
                </div>
                <div className="text-xs text-slate-600 font-semibold mt-1">
                  {activeItem.purchaseCount} purchases ({activeItem.totalQuantity} {activeItem.unit})
                </div>
              </div>
              {onQuickAddExpense && (
                <button
                  onClick={() =>
                    onQuickAddExpense(activeItem.itemName, activeItem.category, activeItem.unit)
                  }
                  className="w-full py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log New {activeItem.itemName}</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Price History Chart & Human-Readable Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Price Shift Chart */}
            <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    Price History for "{activeItem.itemName}"
                  </h3>
                  <p className="text-xs text-slate-400">Track inflation and vendor pricing trends</p>
                </div>
              </div>

              {priceHistoryChartData.length > 1 ? (
                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={priceHistoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis
                        dataKey="displayDate"
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={{ stroke: '#E2E8F0' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `₹${val}`}
                      />
                      <Tooltip
                        formatter={(val: any, name: string) => [
                          `${formatCurrency(Number(val))}`,
                          name === 'unitPrice' ? 'Unit Price' : 'Total Price',
                        ]}
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                          border: 'none',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="unitPrice"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#10B981' }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <Info className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">
                    Only 1 purchase recorded for "{activeItem.itemName}" ({formatCurrency(activeItem.latestPrice)}).
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Log subsequent purchases to visualize dynamic price shifts and inflation trends!
                  </p>
                </div>
              )}
            </div>

            {/* Item Insights Card */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Item Insights</span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-3">
                  Behavior & Velocity
                </h3>

                {itemInsights.length > 0 ? (
                  <div className="space-y-3">
                    {itemInsights.map((ins) => (
                      <div
                        key={ins.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{ins.title}</span>
                          {ins.metric && (
                            <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {ins.metric}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600">{ins.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-500 leading-relaxed">
                    No anomalies or shifts detected for this item. Consumption velocity and price remain consistent with historical baseline.
                  </div>
                )}
              </div>

              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-100 text-xs text-emerald-950 mt-4">
                <strong>Next Expected Refill:</strong> Based on the {activeItem.averageDurationDays || 30}-day average, you typically replenish {activeItem.itemName} once every {activeItem.averageDurationDays || 30} days.
              </div>
            </div>
          </div>

          {/* 4. Complete Purchase History Table for Item */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-3">
              Purchase History ({activeItem.history.length} Batches)
            </h3>

            <div className="divide-y divide-slate-100">
              {activeItem.history.map((h, idx) => (
                <div
                  key={h.id || idx}
                  className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/60 rounded-xl px-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                      #{activeItem.history.length - idx}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {formatDisplayDate(h.purchaseDate)}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {h.quantity !== undefined ? `${h.quantity} ${h.unit || 'unit'}` : '1 unit'}
                        {h.pricePerUnit !== undefined && ` • ₹${h.pricePerUnit}/${h.unit}`}
                        {h.durationDays !== undefined && (
                          <span className="text-emerald-700 font-bold ml-1">
                            • Lasted {h.durationDays} days (~₹{h.dailyCost}/day)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-xs sm:text-sm text-slate-900">
                      {formatCurrency(h.totalPrice)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 text-slate-400">
          <Package className="w-10 h-10 mx-auto mb-3 stroke-1 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">No Tracked Items</h3>
          <p className="text-xs mt-1 text-slate-400 max-w-sm mx-auto">
            Log expenses with item names to automatically generate price trend analytics and consumption velocity calculations.
          </p>
        </div>
      )}
    </div>
  );
};
