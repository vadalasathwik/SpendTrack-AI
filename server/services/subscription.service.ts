import { prisma } from "../db/prisma.js";

export interface SubscriptionItem {
  id: string;
  merchant: string;
  monthlyAmount: number;
  annualAmount: number;
  renewalDate: string;
  daysToRenewal: number;
  isActive: boolean;
  autoPay: boolean;
  aiSuggestion: string;
  category: string;
}

const RECURRING_KEYWORDS = [
  "netflix", "spotify", "chatgpt", "openai", "electricity", "airtel",
  "jio", "internet", "insurance", "aws", "icloud", "disney", "prime",
  "youtube", "hotstar", "swiggy one", "zomato gold", "gym", "apple", "google"
];

export async function getSubscriptions(userId: string): Promise<SubscriptionItem[]> {
  const subscriptions: SubscriptionItem[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. Fetch from RecurringExpense table
  const recurrings = await prisma.recurringExpense.findMany({
    where: { userId },
    include: { category: true }
  });

  const processedMerchants = new Set<string>();

  for (const rec of recurrings) {
    const titleLower = rec.title.toLowerCase();
    processedMerchants.add(titleLower);

    const due = new Date(rec.nextRun);
    const daysDiff = Math.max(0, Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24)));
    const annual = rec.amount * 12;

    let aiSuggestion = `Annual spending is ₹${annual.toLocaleString('en-IN')}.`;
    if (annual > 5000) {
      aiSuggestion += ` Consider switching to an annual plan or shared tier to save approx ₹${Math.round(annual * 0.25).toLocaleString('en-IN')}/year.`;
    } else {
      aiSuggestion += ` Active regular subscription. Auto-pay recommendation enabled.`;
    }

    subscriptions.push({
      id: rec.id,
      merchant: rec.title,
      monthlyAmount: rec.amount,
      annualAmount: annual,
      renewalDate: due.toISOString(),
      daysToRenewal: daysDiff,
      isActive: rec.isActive,
      autoPay: true,
      aiSuggestion,
      category: rec.category?.name || "Subscription",
    });
  }

  // 2. Auto-detect from Expense transactions by matching keywords
  const expenses = await prisma.expense.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { spentAt: "desc" },
    take: 200,
  });

  const merchantGroupMap = new Map<string, { title: string; amount: number; lastDate: Date; count: number; category: string }>();

  for (const exp of expenses) {
    const titleLower = exp.title.toLowerCase();
    for (const kw of RECURRING_KEYWORDS) {
      if (titleLower.includes(kw) && !processedMerchants.has(titleLower)) {
        const existing = merchantGroupMap.get(kw);
        if (!existing) {
          merchantGroupMap.set(kw, {
            title: exp.title,
            amount: exp.amount,
            lastDate: new Date(exp.spentAt),
            count: 1,
            category: exp.category?.name || "Utilities & Subscriptions"
          });
        } else {
          existing.count += 1;
          if (new Date(exp.spentAt) > existing.lastDate) {
            existing.lastDate = new Date(exp.spentAt);
            existing.amount = exp.amount;
          }
        }
        break;
      }
    }
  }

  for (const [kw, data] of merchantGroupMap.entries()) {
    // Predict next renewal date (30 days from last transaction)
    const nextRenewal = new Date(data.lastDate);
    nextRenewal.setDate(nextRenewal.getDate() + 30);
    const daysDiff = Math.max(0, Math.ceil((nextRenewal.getTime() - today.getTime()) / (1000 * 3600 * 24)));
    const annual = data.amount * 12;

    subscriptions.push({
      id: `detected_${kw}`,
      merchant: data.title,
      monthlyAmount: data.amount,
      annualAmount: annual,
      renewalDate: nextRenewal.toISOString(),
      daysToRenewal: daysDiff,
      isActive: true,
      autoPay: false,
      aiSuggestion: `Detected recurring merchant pattern (${data.count} recent charges). Annualized cost is ₹${annual.toLocaleString('en-IN')}.`,
      category: data.category
    });
  }

  return subscriptions;
}
