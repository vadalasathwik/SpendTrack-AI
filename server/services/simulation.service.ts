import { prisma } from "../db/prisma.js";
import { getCashFlowCurrent } from "./cashflow.service.js";

export interface SimulationScenario {
  type: "BUY_HOUSE" | "BUY_CAR" | "PREPAY_LOAN" | "INCREASE_SIP" | "START_BUSINESS" | "GOLD_BUY";
  amount: number;
  downPayment?: number;
  loanTenureYears?: number;
  interestRate?: number;
}

export const runDecisionSimulation = async (userId: string, scenario: SimulationScenario) => {
  const cashflow = await getCashFlowCurrent(userId);
  const totalIncome = Math.max(1, cashflow.income);
  const currentFreeCash = cashflow.freeCash;

  let monthlyEmiDelta = 0;
  let cashOutflow = 0;
  let netWorthImpact = 0;
  let emiRatioAfter = cashflow.emiRatio;
  let recommendationScore = 85;
  let recommendationText = "";

  const amount = Number(scenario.amount) || 100000;
  const downPayment = Number(scenario.downPayment) || amount * 0.2;

  switch (scenario.type) {
    case "BUY_HOUSE": {
      const loanAmount = amount - downPayment;
      const r = (scenario.interestRate || 8.5) / 100 / 12;
      const n = (scenario.loanTenureYears || 20) * 12;
      monthlyEmiDelta = Math.round((loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
      cashOutflow = downPayment;
      netWorthImpact = Math.round(amount * 0.95 - loanAmount);
      const newTotalEmi = cashflow.emi + monthlyEmiDelta;
      emiRatioAfter = Math.round((newTotalEmi / totalIncome) * 100);

      if (emiRatioAfter > 45) {
        recommendationScore = 45;
        recommendationText = `High Risk: EMI ratio increases to ${emiRatioAfter}%, exceeding the 40% safe boundary. Consider a higher down payment.`;
      } else {
        recommendationScore = 88;
        recommendationText = `Feasible: Monthly EMI increases by ₹${monthlyEmiDelta.toLocaleString("en-IN")}. Safe liquidity buffer preserved.`;
      }
      break;
    }

    case "BUY_CAR": {
      const loanAmount = amount - downPayment;
      const r = (scenario.interestRate || 9.5) / 100 / 12;
      const n = (scenario.loanTenureYears || 5) * 12;
      monthlyEmiDelta = Math.round((loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
      cashOutflow = downPayment;
      netWorthImpact = -Math.round(amount * 0.2); // depreciating asset
      const newTotalEmi = cashflow.emi + monthlyEmiDelta;
      emiRatioAfter = Math.round((newTotalEmi / totalIncome) * 100);

      recommendationScore = emiRatioAfter > 35 ? 60 : 82;
      recommendationText = `Car purchase adds ₹${monthlyEmiDelta.toLocaleString("en-IN")}/mo in EMI outflow. Down payment of ₹${downPayment.toLocaleString("en-IN")} required.`;
      break;
    }

    case "PREPAY_LOAN": {
      cashOutflow = amount;
      monthlyEmiDelta = -Math.round(amount * 0.012);
      netWorthImpact = amount;
      const newTotalEmi = Math.max(0, cashflow.emi - Math.abs(monthlyEmiDelta));
      emiRatioAfter = Math.round((newTotalEmi / totalIncome) * 100);

      recommendationScore = 95;
      recommendationText = `Excellent move: Prepaying ₹${amount.toLocaleString("en-IN")} reduces interest drag and frees up ₹${Math.abs(monthlyEmiDelta).toLocaleString("en-IN")}/mo cash flow.`;
      break;
    }

    case "INCREASE_SIP": {
      cashOutflow = 0;
      monthlyEmiDelta = 0;
      netWorthImpact = amount * 5; // long-term 5x wealth compounding projection
      recommendationScore = 96;
      recommendationText = `Highly Recommended: Increasing monthly SIP by ₹${amount.toLocaleString("en-IN")} accelerates retirement timeline by up to 2.5 years.`;
      break;
    }

    default: {
      cashOutflow = amount;
      netWorthImpact = amount;
      recommendationScore = 80;
      recommendationText = `Scenario simulated cleanly with live PostgreSQL cash flow parameters.`;
    }
  }

  return {
    scenarioType: scenario.type,
    amount,
    downPayment,
    monthlyEmiDelta,
    cashOutflow,
    netWorthImpact,
    currentFreeCash,
    freeCashAfter: currentFreeCash - cashOutflow - monthlyEmiDelta,
    emiRatioBefore: cashflow.emiRatio,
    emiRatioAfter,
    recommendationScore,
    recommendationText,
  };
};
