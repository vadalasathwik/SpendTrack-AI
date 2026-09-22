import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  ArrowLeft,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  ShoppingBag,
  Utensils,
  Fuel,
  Tv,
  Plane,
  FileText,
  HeartPulse,
  Package,
  Edit2,
  Trash2,
  Loader2,
  X,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpendTrackApi } from '../services/api.js';
import { formatCurrency } from '../utils/calculations.js';
import { BudgetModal } from '../components/BudgetModal.js';
import { BudgetSkeleton } from '../components/SkeletonLoader.js';
import { EmptyState } from '../components/ui/EmptyState.js';

export interface CategoryBudget {
  id: string;
  category: string;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  percentage: number;
  month: number;
  year: number;
}

export interface SmartAlert {
  id: string;
  type: 'WARNING' | 'DANGER' | 'SUCCESS' | 'INSIGHT';
  title: string;
  message: string;
  category?: string;
}

interface BudgetPageProps {
  onBack?: () => void;
}

export const BudgetPage: React.FC<BudgetPageProps> = ({ onBack }) => {
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<CategoryBudget | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const data = await SpendTrackApi.getBudgetInsights();
      setInsights(data);
    } catch (err) {
      console.error('Failed to load budget insights:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleSaveBudget = async (data: { category: string; monthlyLimit: number }) => {
    if (editingBudget?.id) {
      await SpendTrackApi.updateCategoryBudget(editingBudget.id, {
        monthlyLimit: data.monthlyLimit,
        category: data.category,
      });
    } else {
      await SpendTrackApi.saveCategoryBudget(data);
    }
    setEditingBudget(null);
    await fetchInsights();
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Are you sure you want to remove this category budget?')) return;
    try {
      await SpendTrackApi.deleteCategoryBudget(id);
      await fetchInsights();
    } catch (err) {
      console.error('Failed to delete budget:', err);
    }
  };

  const activeAlerts = useMemo(() => {
    if (!insights?.smartAlerts) return [];
    return insights.smartAlerts.filter((a: SmartAlert) => !dismissedAlerts.includes(a.id));
  }, [insights, dismissedAlerts]);

  const getCategoryIcon = (catName: string) => {
    const c = catName.toLowerCase();
    if (c.includes('food') || c.includes('din')) return Utensils;
    if (c.includes('groc')) return ShoppingBag;
    if (c.includes('fuel') || c.includes('gas')) return Fuel;
    if (c.includes('shop')) return Package;
    if (c.includes('entert') || c.includes('movie')) return Tv;
    if (c.includes('trav') || c.includes('trip')) return Plane;
    if (c.includes('bill') || c.includes('util')) return FileText;
    if (c.includes('health') || c.includes('med')) return HeartPulse;
    return PieChartIcon;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'from-red-500 to-rose-600 text-red-400 bg-red-500';
    if (percentage >= 80) return 'from-amber-500 to-orange-500 text-amber-400 bg-amber-500';
    return 'from-emerald-400 to-teal-500 text-emerald-400 bg-emerald-500';
  };

  return (
    <div className="w-full max-w-[430px] mx-auto min-h-screen bg-slate-950 text-white pb-28 px-4 pt-4 font-sans select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Budget Intelligence
            </h1>
            <p className="text-xs text-slate-400">Limits, AI alerts & safe spend</p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingBudget(null);
            setIsModalOpen(true);
          }}
          className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Budget
        </button>
      </div>

      {isLoading ? (
        <BudgetSkeleton />
      ) : (
        <div className="space-y-5">
          {/* Hero Ring Card */}
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-900/60 border border-slate-800 rounded-[28px] p-5 shadow-2xl backdrop-blur-xl overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Monthly Budget</p>
                <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
                  {formatCurrency(insights?.totalBudget || 0)}
                </h2>
              </div>

              {/* Circular Progress Gauge */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={
                      insights?.percentageUsed >= 100
                        ? 'text-red-500'
                        : insights?.percentageUsed >= 80
                        ? 'text-amber-500'
                        : 'text-emerald-400'
                    }
                    strokeDasharray={`${Math.min(100, insights?.percentageUsed || 0)}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[11px] font-black text-white font-mono">
                  {insights?.percentageUsed || 0}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
              <div>
                <p className="text-[10px] text-slate-400 font-medium">Spent so far</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5">{formatCurrency(insights?.totalSpent || 0)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium">Remaining</p>
                <p className={`text-sm font-bold mt-0.5 ${insights?.remaining < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {formatCurrency(insights?.remaining || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* AI Smart Alerts Section */}
          {activeAlerts.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 px-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">AI Smart Alerts</h3>
              </div>

              <AnimatePresence>
                {activeAlerts.map((alert: SmartAlert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`relative p-3.5 rounded-2xl border backdrop-blur-xl flex items-start gap-3 shadow-lg ${
                      alert.type === 'DANGER'
                        ? 'bg-red-500/10 border-red-500/20 text-red-300'
                        : alert.type === 'WARNING'
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                        : alert.type === 'INSIGHT'
                        ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {alert.type === 'DANGER' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
                    {alert.type === 'WARNING' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
                    {alert.type === 'INSIGHT' && <TrendingDown className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />}
                    {alert.type === 'SUCCESS' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}

                    <div className="flex-1 pr-6">
                      <p className="text-xs font-bold">{alert.title}</p>
                      <p className="text-[11px] opacity-90 mt-0.5 leading-snug">{alert.message}</p>
                    </div>

                    <button
                      onClick={() => setDismissedAlerts((prev) => [...prev, alert.id])}
                      className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Category Budgets List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Category Limits</h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {insights?.categoryBreakdown?.length || 0} configured
              </span>
            </div>

            {!insights?.categoryBreakdown || insights.categoryBreakdown.length === 0 ? (
              <EmptyState
                icon={PieChartIcon}
                title="No category budgets created yet"
                description="Set target spending limits for dining, shopping, groceries, and entertainment to avoid overspending."
                actionLabel="Set First Limit"
                onAction={() => setIsModalOpen(true)}
              />
            ) : (
              <div className="space-y-3">
                {insights.categoryBreakdown.map((b: CategoryBudget) => {
                  const Icon = getCategoryIcon(b.category);
                  const colorClass = getProgressColor(b.percentage);

                  return (
                    <motion.div
                      key={b.id}
                      whileHover={{ scale: 1.01 }}
                      className="bg-slate-900/70 border border-slate-800/80 rounded-[24px] p-4 shadow-xl backdrop-blur-xl relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-200">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-slate-100">{b.category}</h4>
                            <p className="text-[11px] text-slate-400 font-mono">
                              Limit: {formatCurrency(b.monthlyLimit)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingBudget(b);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBudget(b.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden mb-2 border border-slate-800/50">
                        <div
                          className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-500 rounded-full`}
                          style={{ width: `${Math.min(100, b.percentage)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">
                          Spent: <strong className="text-slate-200 font-mono">{formatCurrency(b.spent)}</strong>
                        </span>
                        <span className={b.remaining < 0 ? 'text-red-400 font-bold' : 'text-slate-400'}>
                          {b.remaining < 0 ? 'Over by ' : 'Left: '}
                          <strong className="font-mono">{formatCurrency(Math.abs(b.remaining))}</strong>
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Budget Add/Edit Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBudget}
        initialData={editingBudget}
      />
    </div>
  );
};
