import { prisma } from "../db/prisma.js";

export async function getAutomationTriggers(userId: string) {
  const [emis, investments, insurance, bankAccounts, budgets, goals] =
    await Promise.all([
      prisma.emiItem.findMany({ where: { userId } }),
      prisma.investmentItem.findMany({ where: { userId } }),
      prisma.insurancePolicy.findMany({ where: { userId } }),
      prisma.bankAccount.findMany({ where: { userId } }),
      prisma.monthlyBudget.findMany({ where: { userId } }),
      prisma.goal.findMany({ where: { userId } }),
    ]);

  const alerts: Array<{
    id: string;
    title: string;
    message: string;
    severity: "CRITICAL" | "WARNING" | "INFO";
    triggerType:
      | "EMI_DUE"
      | "SIP_DUE"
      | "SALARY_CREDIT"
      | "INSURANCE_RENEWAL"
      | "PROPERTY_TAX"
      | "GOLD_TARGET"
      | "BUDGET_EXCEEDED"
      | "CREDIT_UTILIZATION_HIGH";
    triggerDate: string;
    actionRequired?: string;
  }> = [];

  const todayStr = new Date().toISOString().split("T")[0];

  // 1. EMI Due Tomorrow Triggers
  emis.forEach((emi) => {
    alerts.push({
      id: `auto_emi_${emi.id}`,
      title: `EMI Autodebit Reminder: ${emi.title}`,
      message: `₹${emi.amount.toLocaleString(
        "en-IN"
      )} autodebit scheduled from ${emi.bank || "primary bank"} in 24 hours.`,
      severity: "WARNING",
      triggerType: "EMI_DUE",
      triggerDate: todayStr,
      actionRequired: "Ensure minimum bank account balance",
    });
  });

  // 2. SIP Triggers
  investments.forEach((inv) => {
    alerts.push({
      id: `auto_sip_${inv.id}`,
      title: `SIP Investment Autopay: ${inv.title}`,
      message: `Monthly ${inv.type} SIP of ₹${inv.amount.toLocaleString(
        "en-IN"
      )} executing in 2 days.`,
      severity: "INFO",
      triggerType: "SIP_DUE",
      triggerDate: todayStr,
    });
  });

  // 3. Insurance Renewal Triggers
  insurance.forEach((pol) => {
    alerts.push({
      id: `auto_ins_${pol.id}`,
      title: `Insurance Policy Renewal: ${pol.title}`,
      message: `Premium of ₹${pol.premiumAmount.toLocaleString(
        "en-IN"
      )} due on ${new Date(pol.renewalDate).toISOString().split("T")[0]}.`,
      severity: "CRITICAL",
      triggerType: "INSURANCE_RENEWAL",
      triggerDate: pol.renewalDate.toISOString().split("T")[0],
      actionRequired: "Renew before grace period expiry",
    });
  });

  // 4. Credit Utilization High Triggers
  bankAccounts
    .filter((b) => b.type === "CREDIT_CARD")
    .forEach((card) => {
      const used = Math.abs(card.currentBalance);
      const available = Math.max(0, card.availableBalance);
      const limit = used + available || 300000;
      const utilPct = limit > 0 ? (used / limit) * 100 : 0;

      if (utilPct > 30) {
        alerts.push({
          id: `auto_credit_${card.id}`,
          title: `Credit Utilization Warning: ${card.name}`,
          message: `Card utilization is currently ${utilPct.toFixed(
            1
          )}% (₹${used.toLocaleString(
            "en-IN"
          )} used of ₹${limit.toLocaleString(
            "en-IN"
          )}). Keep <30% for high credit score.`,
          severity: "WARNING",
          triggerType: "CREDIT_UTILIZATION_HIGH",
          triggerDate: todayStr,
          actionRequired: "Pay statement balance early",
        });
      }
    });

  // 5. Gold & Goal Targets Reached
  goals.forEach((g) => {
    if (g.currentAmount >= g.targetAmount && g.targetAmount > 0) {
      alerts.push({
        id: `auto_goal_${g.id}`,
        title: `Goal Milestone Reached: ${g.title}! 🎉`,
        message: `Congratulations! You have successfully accumulated ₹${g.targetAmount.toLocaleString(
          "en-IN"
        )} for ${g.title}.`,
        severity: "INFO",
        triggerType: "GOLD_TARGET",
        triggerDate: todayStr,
      });
    }
  });

  return {
    totalActiveTriggers: alerts.length,
    criticalCount: alerts.filter((a) => a.severity === "CRITICAL").length,
    alerts,
  };
}
