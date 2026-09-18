import { prisma } from "../db/prisma.js";

export type InboxPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type InboxItemType = 'EMI' | 'SIP' | 'RD' | 'FD' | 'RECURRING' | 'REMINDER' | 'GOAL';

export interface InboxItem {
  id: string;
  originalId: string;
  type: InboxItemType;
  title: string;
  amount?: number;
  dueDate: string;
  daysRemaining: number;
  priority: InboxPriority;
  aiExplanation: string;
  completed: boolean;
  category?: string;
}

export async function getInboxItems(userId: string): Promise<InboxItem[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const items: InboxItem[] = [];

  // 1. EMIs
  const emis = await prisma.emiItem.findMany({ where: { userId } });
  for (const emi of emis) {
    const due = new Date(today.getFullYear(), today.getMonth(), emi.dueDay);
    if (due < today) {
      due.setMonth(due.getMonth() + 1);
    }
    const daysDiff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    let priority: InboxPriority = 'LOW';
    if (daysDiff < 0) priority = 'CRITICAL';
    else if (daysDiff === 0) priority = 'HIGH';
    else if (daysDiff <= 2) priority = 'MEDIUM';

    if (daysDiff <= 30) {
      items.push({
        id: `inbox_emi_${emi.id}`,
        originalId: emi.id,
        type: 'EMI',
        title: `${emi.title} EMI`,
        amount: emi.amount,
        dueDate: due.toISOString(),
        daysRemaining: daysDiff,
        priority,
        aiExplanation: `Monthly loan payment for ${emi.bank || 'Bank'} of ₹${emi.amount.toLocaleString('en-IN')}. Due ${daysDiff === 0 ? 'today' : 'in ' + daysDiff + ' days'}.`,
        completed: false,
        category: 'Loans & EMI',
      });
    }
  }

  // 2. SIPs (Investments)
  const investments = await prisma.investmentItem.findMany({ where: { userId, isActive: true } });
  for (const inv of investments) {
    const due = new Date(inv.nextDate);
    const daysDiff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));

    let priority: InboxPriority = 'LOW';
    if (daysDiff < 0) priority = 'CRITICAL';
    else if (daysDiff === 0) priority = 'HIGH';
    else if (daysDiff <= 2) priority = 'MEDIUM';

    if (daysDiff <= 30) {
      items.push({
        id: `inbox_sip_${inv.id}`,
        originalId: inv.id,
        type: 'SIP',
        title: `${inv.title} (${inv.type})`,
        amount: inv.amount,
        dueDate: due.toISOString(),
        daysRemaining: daysDiff,
        priority,
        aiExplanation: `Auto-invest SIP payment via ${inv.provider || 'Provider'} of ₹${inv.amount.toLocaleString('en-IN')}.`,
        completed: false,
        category: 'Investments',
      });
    }
  }

  // 3. RDs & FDs (Savings)
  const savings = await prisma.savingItem.findMany({ where: { userId } });
  for (const sav of savings) {
    if (sav.maturityDate) {
      const due = new Date(sav.maturityDate);
      const daysDiff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
      
      let priority: InboxPriority = 'LOW';
      if (daysDiff < 0) priority = 'CRITICAL';
      else if (daysDiff === 0) priority = 'HIGH';
      else if (daysDiff <= 2) priority = 'MEDIUM';

      if (daysDiff <= 30) {
        items.push({
          id: `inbox_sav_${sav.id}`,
          originalId: sav.id,
          type: sav.type === 'FD' ? 'FD' : 'RD',
          title: `${sav.title} Maturity`,
          amount: sav.targetAmount,
          dueDate: due.toISOString(),
          daysRemaining: daysDiff,
          priority,
          aiExplanation: `${sav.type} savings plan matures with target value ₹${sav.targetAmount.toLocaleString('en-IN')}.`,
          completed: false,
          category: 'Savings',
        });
      }
    }
  }

  // 4. Recurring Expenses
  const recurrings = await prisma.recurringExpense.findMany({ 
    where: { userId, isActive: true },
    include: { category: true }
  });
  for (const rec of recurrings) {
    const due = new Date(rec.nextRun);
    const daysDiff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));

    let priority: InboxPriority = 'LOW';
    if (daysDiff < 0) priority = 'CRITICAL';
    else if (daysDiff === 0) priority = 'HIGH';
    else if (daysDiff <= 2) priority = 'MEDIUM';

    if (daysDiff <= 30) {
      items.push({
        id: `inbox_rec_${rec.id}`,
        originalId: rec.id,
        type: 'RECURRING',
        title: rec.title,
        amount: rec.amount,
        dueDate: due.toISOString(),
        daysRemaining: daysDiff,
        priority,
        aiExplanation: `Recurring payment for ${rec.title} of ₹${rec.amount.toLocaleString('en-IN')}.`,
        completed: false,
        category: rec.category?.name || 'Bills',
      });
    }
  }

  // 5. Custom Reminders
  const reminders = await prisma.reminder.findMany({ 
    where: { userId, completed: false } 
  });
  for (const rem of reminders) {
    const due = new Date(rem.dueDate);
    const daysDiff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));

    let priority: InboxPriority = 'LOW';
    if (daysDiff < 0 || rem.priority === 'HIGH') priority = 'CRITICAL';
    else if (daysDiff === 0) priority = 'HIGH';
    else if (daysDiff <= 2) priority = 'MEDIUM';

    items.push({
      id: `inbox_rem_${rem.id}`,
      originalId: rem.id,
      type: 'REMINDER',
      title: rem.title,
      dueDate: due.toISOString(),
      daysRemaining: daysDiff,
      priority,
      aiExplanation: rem.description || `Reminder set for ${rem.title}.`,
      completed: rem.completed,
      category: 'Reminder',
    });
  }

  // Sort by priority rank then due date
  const priorityRank: Record<InboxPriority, number> = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4
  };

  items.sort((a, b) => {
    if (priorityRank[a.priority] !== priorityRank[b.priority]) {
      return priorityRank[a.priority] - priorityRank[b.priority];
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return items;
}

export async function completeInboxItem(userId: string, itemId: string, itemType: InboxItemType) {
  if (itemType === 'REMINDER') {
    return prisma.reminder.updateMany({
      where: { id: itemId, userId },
      data: { completed: true }
    });
  } else if (itemType === 'RECURRING') {
    const existing = await prisma.recurringExpense.findFirst({ where: { id: itemId, userId } });
    if (existing) {
      const nextDate = new Date(existing.nextRun);
      nextDate.setMonth(nextDate.getMonth() + 1);
      return prisma.recurringExpense.update({
        where: { id: itemId },
        data: { nextRun: nextDate }
      });
    }
  } else if (itemType === 'SIP') {
    const existing = await prisma.investmentItem.findFirst({ where: { id: itemId, userId } });
    if (existing) {
      const nextDate = new Date(existing.nextDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      return prisma.investmentItem.update({
        where: { id: itemId },
        data: { nextDate }
      });
    }
  }
  return { success: true };
}

export async function snoozeInboxItem(userId: string, itemId: string, itemType: InboxItemType, days: number = 3) {
  if (itemType === 'REMINDER') {
    const existing = await prisma.reminder.findFirst({ where: { id: itemId, userId } });
    if (existing) {
      const newDue = new Date(existing.dueDate);
      newDue.setDate(newDue.getDate() + days);
      return prisma.reminder.update({
        where: { id: itemId },
        data: { dueDate: newDue }
      });
    }
  } else if (itemType === 'RECURRING') {
    const existing = await prisma.recurringExpense.findFirst({ where: { id: itemId, userId } });
    if (existing) {
      const newDue = new Date(existing.nextRun);
      newDue.setDate(newDue.getDate() + days);
      return prisma.recurringExpense.update({
        where: { id: itemId },
        data: { nextRun: newDue }
      });
    }
  }
  return { success: true };
}
