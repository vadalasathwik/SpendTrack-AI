import React, { useState } from 'react';
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
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Expense, DateRange } from '../types';
import { comparePeriods, formatCurrency, generateItemAnalytics } from '../utils/calculations';
import { getPreviousPeriod, formatDisplayDate } from '../utils/dateRanges';
import { CATEGORY_COLORS } from '../data/defaults';

interface AnalyticsPageProps {
  expenses: Expense[];
  currentDateRange: DateRange;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ expenses, currentDateRange }) => {
  const previousRange = getPreviousPeriod({
    startDate: currentDateRange.startDate,
    endDate: currentDateRange.endDate,
  });

  const comparison = comparePeriods(
    expenses,
    { startDate: currentDateRange.startDate, endDate: currentDateRange.endDate },
    previousRange
  );

  // Category comparison chart data
  const categoryChartData = comparison.categoryChanges.map((cat) => ({
    category: cat.category,
    'Current Period': cat.currentAmount,
    'Previous Period': cat.previousAmount,
    diff: cat.difference,
  }));

  // Item Price Inflation list
  const itemSummary = generateItemAnalytics(expenses);
  const itemsWithPriceChanges = itemSummary.filter((it) => it.previousPrice !== undefined);

  return (
    <div className="space-y-6 pb-12" id="analytics-page-container">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
          Period-over-Period Analysis
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
          Comparative Spending Intelligence
        </h2>
        <p className="text-xs text-slate-500">
          Comparing <strong className="text-slate-700">{formatDisplayDate(currentDateRange.startDate)} → {formatDisplayDate(currentDateRange.endDate)}</strong> against previous equivalent period (<span className="text-slate-600">{formatDisplayDate(previousRange.startDate)} → {formatDisplayDate(previousRange.endDate)}</span>).
        </p>
      </div>

      {/* Comparison Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Difference */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Spending Change
          </span>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {formatCurrency(Math.abs(comparison.difference))}
              {comparison.difference > 0 ? (
                <span className="inline-flex items-center text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +{comparison.percentageChange}%
                </span>
              ) : comparison.difference < 0 ? (
                <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  {comparison.percentageChange}%
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  0%
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {comparison.difference > 0
                ? 'Expenditures increased compared to last period'
                : comparison.difference < 0
                ? 'Congratulations! You spent less than last period'
                : 'Exact same spending as previous period'}
            </p>
          </div>
          <div className="text-xs text-slate-400 pt-2 border-t border-slate-100 flex justify-between">
            <span>Current: {formatCurrency(comparison.currentPeriod.totalSpending)}</span>
            <span>Prev: {formatCurrency(comparison.previousPeriod.totalSpending)}</span>
          </div>
        </div>

        {/* Daily Run-Rate Comparison */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Daily Burn Rate
          </span>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(comparison.currentPeriod.dailyAverage)}
              <span className="text-xs font-normal text-slate-500">/day</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Previous period was {formatCurrency(comparison.previousPeriod.dailyAverage)}/day
            </p>
          </div>
          <div className="text-xs text-slate-400 pt-2 border-t border-slate-100 flex justify-between">
            <span>Diff: {formatCurrency(comparison.currentPeriod.dailyAverage - comparison.previousPeriod.dailyAverage)}/day</span>
          </div>
        </div>

        {/* Transaction Count */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Purchase Frequency
          </span>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {comparison.currentPeriod.expenseCount} purchases
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Previous period had {comparison.previousPeriod.expenseCount} purchases
            </p>
          </div>
          <div className="text-xs text-slate-400 pt-2 border-t border-slate-100 flex justify-between">
            <span>Diff: {comparison.currentPeriod.expenseCount - comparison.previousPeriod.expenseCount} transactions</span>
          </div>
        </div>
      </div>

      {/* Category Shift Comparison Bar Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900">Category Spending Comparison</h3>
            <p className="text-xs text-slate-400">Current vs Previous Period by category</p>
          </div>
        </div>

        {categoryChartData.length > 0 ? (
          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="category"
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
                  formatter={(val: any) => [`${formatCurrency(Number(val))}`, '']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  formatter={(val) => <span className="text-xs text-slate-600 font-medium">{val}</span>}
                />
                <Bar dataKey="Current Period" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Previous Period" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
            No category data available to compare for this period.
          </div>
        )}
      </div>

      {/* Item Price Movement / Inflation Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1">
          Item Price Shifts & Inflation Tracker
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Compares the most recent purchase price against the previous purchase price for items bought multiple times
        </p>

        {itemsWithPriceChanges.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {itemsWithPriceChanges.map((item) => (
              <div key={item.itemName} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#64748B' }}
                  >
                    {item.itemName.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{item.itemName}</span>
                    <span className="text-[11px] text-slate-400 block">{item.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Previous</span>
                    <span className="font-medium text-slate-600">
                      {formatCurrency(item.previousPrice || 0)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Latest</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(item.latestPrice)}
                    </span>
                  </div>

                  <div className="w-28 text-right">
                    {item.priceChange !== undefined && item.priceChange > 0 ? (
                      <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-[11px]">
                        <TrendingUp className="w-3 h-3" />
                        +{formatCurrency(item.priceChange)} (+{item.percentagePriceChange}%)
                      </span>
                    ) : item.priceChange !== undefined && item.priceChange < 0 ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px]">
                        <TrendingDown className="w-3 h-3" />
                        {formatCurrency(item.priceChange)} ({item.percentagePriceChange}%)
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px] font-medium">No Change</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            Add at least two purchases for the same item name to see automated price increase/decrease comparisons.
          </div>
        )}
      </div>
    </div>
  );
};
