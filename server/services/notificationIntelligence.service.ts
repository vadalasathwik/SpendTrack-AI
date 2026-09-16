import { prisma } from '../db/prisma.js';
import { getCfoCashflow } from './cfoCashflow.service.js';

export interface SmartNotificationAlert {
  id: string;
  type: 'EMI_DUE' | 'SIP_DUE' | 'RD_MATURITY' | 'FD_MATURITY' | 'BUDGET_WARNING' | 'EMERGENCY_LOW';
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  dueDate?: string;
  createdAt: string;
}

export async function getSmartNotifications(userId: string): Promise<SmartNotificationAlert[]> {
  const alerts: SmartNotificationAlert[] = [];
  const now = new Date();
  const currentDay = now.getDate();
  const nowISO = now.toISOString();

  // 1. EMI due tomorrow
  const emis = await prisma.emiItem.findMany({ where: { userId } });
  for (const emi of emis) {
    const dayDiff = emi.dueDay - currentDay;
    if (dayDiff === 1) {
      alerts.push({
        id: `cfo-emi-${emi.id}`,
        type: 'EMI_DUE',
        title: `EMI Due Tomorrow: ${emi.title}`,
        message: `${emi.title} EMI of ₹${emi.amount.toLocaleString('en-IN')} with ${emi.bank} is due tomorrow (${emi.dueDay}th).`,
        severity: 'WARNING',
        createdAt: nowISO,
      });
    }
  }

  // 2. SIP due in 2 days
  const investments = await prisma.investmentItem.findMany({ where: { userId, isActive: true } });
  for (const inv of investments) {
    const nextDate = new Date(inv.nextDate);
    const diffTime = nextDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays <= 2) {
      alerts.push({
        id: `cfo-sip-${inv.id}`,
        type: 'SIP_DUE',
        title: `SIP Investment Coming Up: ${inv.title}`,
        message: `${inv.title} (${inv.provider}) SIP of ₹${inv.amount.toLocaleString('en-IN')} is scheduled in ${diffDays} day(s).`,
        severity: 'INFO',
        createdAt: nowISO,
      });
    }
  }

  // 3. RD & FD Maturity checks
  const savings = await prisma.savingItem.findMany({ where: { userId } });
  for (const s of savings) {
    if (s.maturityDate) {
      const matDate = new Date(s.maturityDate);
      const diffTime = matDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 30) {
        alerts.push({
          id: `cfo-saving-${s.id}`,
          type: s.type === 'FD' ? 'FD_MATURITY' : 'RD_MATURITY',
          title: `${s.type} Maturing Soon: ${s.title}`,
          message: `${s.title} of target value ₹${s.targetAmount.toLocaleString('en-IN')} will mature on ${matDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`,
          severity: 'INFO',
          dueDate: matDate.toISOString().split('T')[0],
          createdAt: nowISO,
        });
      }
    }
  }

  // 4. Budget & Emergency Cushion checks
  const cashflow = await getCfoCashflow(userId);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const budget = await prisma.monthlyBudget.findUnique({
    where: {
      month_year_userId: {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        userId,
      },
    },
  });

  if (budget && cashflow.spent > budget.budget * 0.8) {
    alerts.push({
      id: `cfo-budget-warning-${now.getMonth()}`,
      type: 'BUDGET_WARNING',
      title: 'Monthly Budget Threshold Exceeded',
      message: `You have spent ₹${cashflow.spent.toLocaleString('en-IN')} (${Math.round((cashflow.spent / budget.budget) * 100)}% of monthly budget ₹${budget.budget.toLocaleString('en-IN')}).`,
      severity: cashflow.spent > budget.budget ? 'CRITICAL' : 'WARNING',
      createdAt: nowISO,
    });
  }

  const burn = cashflow.monthlyBurnRate || 1;
  const emergencyMonths = cashflow.emergencyFund / burn;
  if (emergencyMonths < 3) {
    alerts.push({
      id: `cfo-emergency-low`,
      type: 'EMERGENCY_LOW',
      title: 'Emergency Cushion Below 3 Months',
      message: `Your emergency savings cover only ${Math.round(emergencyMonths * 10) / 10} months of expenses. Recommended baseline is at least 3–6 months.`,
      severity: 'WARNING',
      createdAt: nowISO,
    });
  }

  return alerts;
}
