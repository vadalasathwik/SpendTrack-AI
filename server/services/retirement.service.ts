import { prisma } from "../db/prisma.js";
import { getCashFlowCurrent } from "./cashflow.service.js";

export const getRetirementPlan = async (
  userId: string,
  params: { currentAge?: number; retirementAge?: number; monthlyExpense?: number; inflationRate?: number; expectedReturn?: number } = {}
) => {
  const cashflow = await getCashFlowCurrent(userId);

  const currentAge = params.currentAge || 30;
  const retirementAge = params.retirementAge || 55;
  const yearsToRetire = Math.max(1, retirementAge - currentAge);
  const monthlyExpense = params.monthlyExpense || cashflow.expenses || 50000;
  const inflationRate = params.inflationRate || 6.0;
  const expectedReturn = params.expectedReturn || 12.0;

  // Inflation-adjusted future monthly expense at retirement
  const futureMonthlyExpense = monthlyExpense * Math.pow(1 + inflationRate / 100, yearsToRetire);
  const futureAnnualExpense = futureMonthlyExpense * 12;

  // FIRE Targets
  const requiredCorpus = Math.round(futureAnnualExpense * 25); // 4% rule
  const leanFire = Math.round(requiredCorpus * 0.75);
  const fatFire = Math.round(requiredCorpus * 1.5);
  const coastFire = Math.round(requiredCorpus / Math.pow(1 + expectedReturn / 100, yearsToRetire));

  // Current liquid & portfolio assets
  const portfolio = await prisma.portfolioHolding.findMany({ where: { userId } });
  const currentAssets = portfolio.reduce((sum, p) => sum + (p.currentValue || p.invested), 0) + (cashflow.freeCash * 6);

  const shortfall = Math.max(0, requiredCorpus - currentAssets);
  const retirementReadiness = Math.min(100, Math.round((currentAssets / (requiredCorpus || 1)) * 100));

  // Required monthly investment to bridge shortfall
  const monthlyRate = expectedReturn / 100 / 12;
  const totalMonths = yearsToRetire * 12;
  const requiredMonthlyInvestment = Math.round(
    (shortfall * monthlyRate) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
  );

  return {
    currentAge,
    retirementAge,
    yearsToRetire,
    expectedRetirementYear: new Date().getFullYear() + yearsToRetire,
    monthlyExpense,
    futureMonthlyExpense: Math.round(futureMonthlyExpense),
    fireTargets: {
      requiredCorpus,
      leanFire,
      fatFire,
      coastFire,
    },
    currentAssets: Math.round(currentAssets),
    shortfall,
    retirementReadiness,
    requiredMonthlyInvestment,
    recommendation: retirementReadiness > 30
      ? `On track for FIRE. Maintain current monthly SIP of ₹${cashflow.investments.toLocaleString("en-IN")}.`
      : `Increase monthly SIP to ₹${requiredMonthlyInvestment.toLocaleString("en-IN")} to achieve full financial independence by age ${retirementAge}.`,
  };
};
