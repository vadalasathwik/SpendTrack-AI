import { SpendTrackApi } from './api.js';
import { Expense, RecurringExpense, CategoryItem } from '../types.js';
import { formatCurrency } from '../utils/calculations.js';

export interface LocalAiContext {
  expenses: Expense[];
  recurringExpenses: RecurringExpense[];
  categories?: CategoryItem[];
  incomes?: any[];
  onRefreshData?: () => void;
}

export interface LocalAiResponse {
  message: string;
  actionExecuted?: boolean;
  dataUpdated?: boolean;
}

/**
 * Parses user input locally, executes database actions via SpendTrackApi,
 * and formats an intelligent financial copilot response using actual application data.
 */
export async function parseAndExecuteLocalAiIntent(
  userQuery: string,
  context: LocalAiContext
): Promise<LocalAiResponse> {
  const text = userQuery.trim();
  const lower = text.toLowerCase();

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  // Filter current month expenses
  const monthExpenses = context.expenses.filter((e) => {
    if (!e.purchaseDate) return false;
    const d = new Date(e.purchaseDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const activeExpenses = monthExpenses.length > 0 ? monthExpenses : context.expenses;
  const currentMonthSpent = activeExpenses.reduce((sum, e) => sum + e.totalPrice, 0);

  // Calculate actual total category budgets
  const categoryBudgetsTotal = (context.categories || []).reduce((sum, c) => sum + (c.allocatedBudget || 0), 0);
  const totalBudget = categoryBudgetsTotal > 0 ? categoryBudgetsTotal : 40000;
  const remainingBudget = totalBudget - currentMonthSpent;

  // -------------------------------------------------------------------
  // INTENT 1: Record Expense (e.g. "I spent ₹240 at Swiggy", "Spent 500 on Uber")
  // -------------------------------------------------------------------
  if (
    lower.startsWith('i spent') ||
    lower.startsWith('spent') ||
    lower.startsWith('paid') ||
    lower.includes('spent ₹') ||
    lower.includes('spent rs') ||
    lower.includes('paid ₹') ||
    lower.includes('paid rs')
  ) {
    const amountMatch = text.match(/(?:₹|rs\.?|INR)?\s*([\d,]+(?:\.\d+)?)/i);
    const amountStr = amountMatch ? amountMatch[1].replace(/,/g, '') : null;
    const amount = amountStr ? parseFloat(amountStr) : 0;

    if (!amount || isNaN(amount)) {
      return {
        message: '⚠️ I detected an expense request, but couldn\'t identify the amount. Please specify like: *"I spent ₹240 at Swiggy"*',
      };
    }

    let merchant = 'General Purchase';
    if (lower.includes('at ')) {
      merchant = text.split(/at /i)[1]?.split(/for|on|under/i)[0]?.trim() || merchant;
    } else if (lower.includes('on ')) {
      merchant = text.split(/on /i)[1]?.split(/at|for|under/i)[0]?.trim() || merchant;
    } else if (lower.includes('for ')) {
      merchant = text.split(/for /i)[1]?.split(/at|on|under/i)[0]?.trim() || merchant;
    }

    merchant = merchant.replace(/^(the|a|an)\s+/i, '').trim();
    if (merchant.length > 30) merchant = merchant.substring(0, 30);
    merchant = merchant.charAt(0).toUpperCase() + merchant.slice(1);

    let category = 'Shopping & Retail';
    if (/swiggy|zomato|starbucks|food|restaurant|dine|cafe|pizza|burger/i.test(lower)) {
      category = 'Food & Dining';
    } else if (/uber|ola|rapido|petrol|fuel|cab|auto|flight|train|metro/i.test(lower)) {
      category = 'Transportation';
    } else if (/electricity|water|wifi|broadband|recharge|bill|mobile|rent/i.test(lower)) {
      category = 'Bills & Utilities';
    } else if (/movie|netflix|prime|spotify|game|concert|ticket/i.test(lower)) {
      category = 'Entertainment';
    } else if (/medicine|doctor|pharmacy|hospital|lab/i.test(lower)) {
      category = 'Health & Medical';
    }

    try {
      await SpendTrackApi.createExpense({
        itemName: merchant,
        merchant,
        totalPrice: amount,
        category,
        purchaseDate: new Date().toISOString().split('T')[0],
        source: 'AI Copilot',
      });

      if (context.onRefreshData) {
        context.onRefreshData();
      }

      const totalUpdatedSpent = currentMonthSpent + amount;

      return {
        message: `✅ **Expense Recorded to PostgreSQL**\n\n` +
          `• **Merchant/Item**: ${merchant}\n` +
          `• **Amount**: ${formatCurrency(amount)}\n` +
          `• **Category**: ${category}\n` +
          `• **Date**: Today (${new Date().toLocaleDateString('en-IN')})\n\n` +
          `📊 *Total monthly spending updated to ${formatCurrency(totalUpdatedSpent)}.*`,
        actionExecuted: true,
        dataUpdated: true,
      };
    } catch (err: any) {
      return {
        message: `❌ Failed to save expense: ${err.message || 'Database connection error'}`,
      };
    }
  }

  // -------------------------------------------------------------------
  // INTENT 2: Add Income (e.g. "Add ₹5000 salary", "Got ₹50000 income")
  // -------------------------------------------------------------------
  if (
    (lower.startsWith('add') && (lower.includes('salary') || lower.includes('income') || lower.includes('bonus') || lower.includes('dividend') || lower.includes('freelance'))) ||
    lower.includes('got salary') ||
    lower.includes('received salary') ||
    lower.includes('credited salary')
  ) {
    const amountMatch = text.match(/(?:₹|rs\.?|INR)?\s*([\d,]+(?:\.\d+)?)/i);
    const amountStr = amountMatch ? amountMatch[1].replace(/,/g, '') : null;
    const amount = amountStr ? parseFloat(amountStr) : 0;

    if (!amount || isNaN(amount)) {
      return {
        message: '⚠️ Please specify an income amount, for example: *"Add ₹5000 salary"*',
      };
    }

    let sourceName = 'Salary';
    if (lower.includes('freelance')) sourceName = 'Freelance';
    else if (lower.includes('dividend')) sourceName = 'Dividends';
    else if (lower.includes('bonus')) sourceName = 'Bonus';
    else if (lower.includes('rental')) sourceName = 'Rental Income';

    try {
      await SpendTrackApi.createIncome({
        title: sourceName,
        amount,
      });

      if (context.onRefreshData) {
        context.onRefreshData();
      }

      return {
        message: `💰 **Income Credited to PostgreSQL**\n\n` +
          `• **Source**: ${sourceName}\n` +
          `• **Amount Added**: ${formatCurrency(amount)}\n` +
          `• **Date**: ${new Date().toLocaleDateString('en-IN')}\n\n` +
          `📈 *Your cash flow buffer has been updated.*`,
        actionExecuted: true,
        dataUpdated: true,
      };
    } catch (err: any) {
      return {
        message: `❌ Failed to save income record: ${err.message || 'Database error'}`,
      };
    }
  }

  // -------------------------------------------------------------------
  // PROMPT 1: How much did I spend this month?
  // -------------------------------------------------------------------
  if (
    lower.includes('how much did i spend this month') ||
    lower.includes('how much spent') ||
    lower.includes('this month spending') ||
    lower.includes('this month\'s spending') ||
    lower.includes('monthly spending') ||
    lower.includes('how much did i spend')
  ) {
    if (activeExpenses.length === 0) {
      return {
        message: `📊 **Monthly Spending Summary (${monthName})**\n\nYou haven't recorded any expenses for ${monthName} yet. Use **+ Add Expense** or ask me to record one!`,
        actionExecuted: true,
      };
    }

    const catTotals: Record<string, number> = {};
    activeExpenses.forEach((e) => {
      catTotals[e.category] = (catTotals[e.category] || 0) + e.totalPrice;
    });

    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const categoryBreakdown = sortedCats
      .map(([cat, val]) => `• **${cat}**: ${formatCurrency(val)}`)
      .join('\n');

    return {
      message: `📊 **Monthly Spending Summary (${monthName})**\n\n` +
        `• **Total Spent**: ${formatCurrency(currentMonthSpent)}\n` +
        `• **Total Transactions**: ${activeExpenses.length} items recorded\n\n` +
        `**Category Breakdown:**\n${categoryBreakdown}`,
      actionExecuted: true,
    };
  }

  // -------------------------------------------------------------------
  // PROMPT 2: Where am I spending the most?
  // -------------------------------------------------------------------
  if (
    lower.includes('where am i spending the most') ||
    lower.includes('spending the most') ||
    lower.includes('most spending') ||
    lower.includes('top category') ||
    lower.includes('highest spending') ||
    lower.includes('where do i spend')
  ) {
    if (activeExpenses.length === 0) {
      return {
        message: `📊 **Highest Spending Breakdown**\n\nNo transactions have been recorded yet for ${monthName}.`,
        actionExecuted: true,
      };
    }

    const catTotals: Record<string, number> = {};
    activeExpenses.forEach((e) => {
      catTotals[e.category] = (catTotals[e.category] || 0) + e.totalPrice;
    });

    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const [topCat, topVal] = sortedCats[0];
    const topPct = Math.round((topVal / currentMonthSpent) * 100);

    const breakdownStr = sortedCats
      .map(([cat, val]) => `• **${cat}**: ${formatCurrency(val)} (${Math.round((val / currentMonthSpent) * 100)}%)`)
      .join('\n');

    return {
      message: `🏷️ **Highest Spending Categories (${monthName})**\n\n` +
        `Your top spending category is **${topCat}** at **${formatCurrency(topVal)}** (${topPct}% of your total spending).\n\n` +
        `**All Categories:**\n${breakdownStr}`,
      actionExecuted: true,
    };
  }

  // -------------------------------------------------------------------
  // PROMPT 3: How much budget do I have left?
  // -------------------------------------------------------------------
  if (
    lower.includes('how much budget do i have left') ||
    lower.includes('budget left') ||
    lower.includes('remaining budget') ||
    lower.includes('budget remaining') ||
    lower.includes('how much budget')
  ) {
    const pctRemaining = Math.max(0, Math.round((remainingBudget / totalBudget) * 100));

    return {
      message: `💰 **Remaining Budget Status (${monthName})**\n\n` +
        `• **Monthly Allocated Budget**: ${formatCurrency(totalBudget)}\n` +
        `• **Spent So Far**: ${formatCurrency(currentMonthSpent)}\n` +
        `• **Remaining Budget**: **${formatCurrency(remainingBudget)}** (${pctRemaining}% remaining)\n\n` +
        (remainingBudget >= 0
          ? `🟢 You are within your budget limit!`
          : `🔴 Caution: You have exceeded your monthly allocated budget by ${formatCurrency(Math.abs(remainingBudget))}.`),
      actionExecuted: true,
    };
  }

  // -------------------------------------------------------------------
  // PROMPT 4: What bills are coming next?
  // -------------------------------------------------------------------
  if (
    lower.includes('what bills are coming next') ||
    lower.includes('upcoming bills') ||
    lower.includes('bills next') ||
    lower.includes('bills coming') ||
    lower.includes('next bill') ||
    lower.includes('next emi') ||
    lower.includes('upcoming emi')
  ) {
    if (context.recurringExpenses.length > 0) {
      const getDueVal = (r: any) => {
        const val = r.dueDay || r.dueDate;
        return typeof val === 'number' ? val : (parseInt(String(val), 10) || 31);
      };
      const sortedBills = [...context.recurringExpenses].sort((a, b) => getDueVal(a) - getDueVal(b));
      const totalOutflow = sortedBills.reduce((sum, r) => sum + r.amount, 0);

      const billListStr = sortedBills
        .map((r) => {
          const title = r.name || r.title || 'Recurring Bill';
          const dueText = r.dueDay ? `Day ${r.dueDay} of month` : (r.dueDate ? `Due ${r.dueDate}` : 'Monthly');
          const catName = typeof r.category === 'object' ? (r.category as any)?.name : (r.category || 'Bills');
          return `• **${title}**: ${formatCurrency(r.amount)} (${dueText}) [${catName}]`;
        })
        .join('\n');

      return {
        message: `📅 **Upcoming Bills & Recurring Commitments**\n\n` +
          `${billListStr}\n\n` +
          `• **Total Monthly Outflow**: ${formatCurrency(totalOutflow)}`,
        actionExecuted: true,
      };
    } else {
      return {
        message: `📅 **Upcoming Bills & Commitments**\n\nYou currently have zero recurring bills or EMIs recorded in PostgreSQL! You can add recurring commitments in the Planner tab.`,
        actionExecuted: true,
      };
    }
  }

  // -------------------------------------------------------------------
  // PROMPT 5: Show my recent expenses.
  // -------------------------------------------------------------------
  if (
    lower.includes('show my recent expenses') ||
    lower.includes('recent expenses') ||
    lower.includes('recent transactions') ||
    lower.includes('latest expenses') ||
    lower.includes('last expenses')
  ) {
    if (context.expenses.length === 0) {
      return {
        message: `🧾 **Recent Transactions**\n\nNo expense transactions found in database. Record your first expense to track spending!`,
        actionExecuted: true,
      };
    }

    const sortedExpenses = [...context.expenses].sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
    const recent = sortedExpenses.slice(0, 5);

    const listStr = recent
      .map((e, idx) => `${idx + 1}. **${e.merchant || e.itemName}** — ${formatCurrency(e.totalPrice)} (${e.category}, ${e.purchaseDate})`)
      .join('\n');

    return {
      message: `🧾 **Recent Transactions**\n\nHere are your ${recent.length} most recent expenses:\n\n${listStr}`,
      actionExecuted: true,
    };
  }

  // -------------------------------------------------------------------
  // PROMPT 6: Can I afford this expense?
  // -------------------------------------------------------------------
  if (
    lower.includes('can i afford') ||
    lower.includes('afford this expense') ||
    lower.includes('affordability') ||
    lower.includes('can i buy')
  ) {
    const amountMatch = text.match(/(?:₹|rs\.?|INR)?\s*([\d,]+(?:\.\d+)?)/i);
    const amountStr = amountMatch ? amountMatch[1].replace(/,/g, '') : null;
    const amount = amountStr ? parseFloat(amountStr) : 0;

    if (!amount || isNaN(amount)) {
      return {
        message: `🛍️ **Affordability Analysis**\n\n` +
          `Please specify an amount to check, for example:\n` +
          `• *"Can I afford ₹5,000?"*\n` +
          `• *"Can I afford ₹12,000 for a smartphone?"*\n\n` +
          `• **Current Remaining Monthly Budget**: ${formatCurrency(remainingBudget)}`,
      };
    }

    const remainingAfter = remainingBudget - amount;

    if (amount <= remainingBudget) {
      return {
        message: `✅ **Affordability Verdict: YES**\n\n` +
          `You can afford this expense of **${formatCurrency(amount)}**!\n\n` +
          `• **Current Remaining Budget**: ${formatCurrency(remainingBudget)}\n` +
          `• **Remaining After Purchase**: **${formatCurrency(remainingAfter)}**\n\n` +
          `🟢 This purchase stays within your allocated budget for ${monthName}.`,
        actionExecuted: true,
      };
    } else {
      const deficit = amount - remainingBudget;
      return {
        message: `⚠️ **Affordability Verdict: CAUTION**\n\n` +
          `An expense of **${formatCurrency(amount)}** exceeds your remaining budget of **${formatCurrency(remainingBudget)}** by **${formatCurrency(deficit)}**.\n\n` +
          `• **Current Remaining Budget**: ${formatCurrency(remainingBudget)}\n` +
          `• **Budget Deficit if Purchased**: -${formatCurrency(deficit)}\n\n` +
          `🔴 Purchasing this will overspend your budget for ${monthName}. Consider postponing or adjusting other categories.`,
        actionExecuted: true,
      };
    }
  }

  // -------------------------------------------------------------------
  // FALLBACK: General Unsupported / Helpful Query Response
  // -------------------------------------------------------------------
  return {
    message: `🤖 **SpendTrack AI Financial Copilot**\n\n` +
      `I couldn't find a direct match for that specific question, but I can answer questions about your real financial data!\n\n` +
      `Try asking one of these questions:\n` +
      `• *How much did I spend this month?*\n` +
      `• *Where am I spending the most?*\n` +
      `• *How much budget do I have left?*\n` +
      `• *What bills are coming next?*\n` +
      `• *Show my recent expenses.*\n` +
      `• *Can I afford ₹5,000?*`,
  };
}
