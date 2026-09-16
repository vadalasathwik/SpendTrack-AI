import { prisma } from "../db/prisma.js";

export interface UpcomingItem {
  id: string;
  title: string;
  type: "EMI" | "SIP" | "RD" | "FD" | "REMINDER" | "RECURRING";
  amount?: number;
  dueDate: string;
  daysLeft: number;
}

export async function getUpcoming(userId: string): Promise<UpcomingItem[]> {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const [emis, investments, savings, reminders, recurring] = await Promise.all([
    prisma.emiItem.findMany({ where: { userId } }),
    prisma.investmentItem.findMany({ where: { userId, isActive: true } }),
    prisma.savingItem.findMany({ where: { userId } }),
    prisma.reminder.findMany({ where: { userId, completed: false } }),
    prisma.recurringExpense.findMany({ where: { userId, isActive: true } }),
  ]);

  const results: UpcomingItem[] = [];

  // 1. EMIs
  for (const emi of emis) {
    let dueObj = new Date(currentYear, currentMonth, emi.dueDay);
    if (dueObj < now && emi.dueDay < currentDay) {
      dueObj = new Date(currentYear, currentMonth + 1, emi.dueDay);
    }
    const diffTime = dueObj.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 3600 * 24));
    if (daysLeft >= -2 && daysLeft <= 7) {
      results.push({
        id: `emi-${emi.id}`,
        title: `${emi.title} (${emi.bank})`,
        type: "EMI",
        amount: emi.amount,
        dueDate: dueObj.toISOString().split("T")[0],
        daysLeft,
      });
    }
  }

  // 2. Investments (SIPs)
  for (const inv of investments) {
    const dueObj = new Date(inv.nextDate);
    const diffTime = dueObj.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 3600 * 24));
    if (daysLeft >= -2 && daysLeft <= 7) {
      results.push({
        id: `inv-${inv.id}`,
        title: `${inv.title} (${inv.provider})`,
        type: "SIP",
        amount: inv.amount,
        dueDate: dueObj.toISOString().split("T")[0],
        daysLeft,
      });
    }
  }

  // 3. Savings (RD / FD maturity)
  for (const sav of savings) {
    if (sav.maturityDate) {
      const dueObj = new Date(sav.maturityDate);
      const diffTime = dueObj.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 3600 * 24));
      if (daysLeft >= -2 && daysLeft <= 7) {
        results.push({
          id: `sav-${sav.id}`,
          title: `Maturity: ${sav.title}`,
          type: sav.type === "FD" ? "FD" : "RD",
          amount: sav.targetAmount,
          dueDate: dueObj.toISOString().split("T")[0],
          daysLeft,
        });
      }
    }
  }

  // 4. Reminders
  for (const rem of reminders) {
    const dueObj = new Date(rem.dueDate);
    const diffTime = dueObj.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 3600 * 24));
    if (daysLeft >= -2 && daysLeft <= 7) {
      results.push({
        id: `rem-${rem.id}`,
        title: rem.title,
        type: "REMINDER",
        dueDate: dueObj.toISOString().split("T")[0],
        daysLeft,
      });
    }
  }

  // 5. Recurring Expenses
  for (const rec of recurring) {
    const dueObj = new Date(rec.nextRun);
    const diffTime = dueObj.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 3600 * 24));
    if (daysLeft >= -2 && daysLeft <= 7) {
      results.push({
        id: `rec-${rec.id}`,
        title: rec.title,
        type: "RECURRING",
        amount: rec.amount,
        dueDate: dueObj.toISOString().split("T")[0],
        daysLeft,
      });
    }
  }

  // Sort by nearest due date (ascending daysLeft)
  results.sort((a, b) => a.daysLeft - b.daysLeft);

  return results;
}
