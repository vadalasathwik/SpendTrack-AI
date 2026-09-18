import { prisma } from '../db/prisma.js';

export interface GoalWithForecast {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  monthlyContribution: number;
  category?: string | null;
  createdAt: Date;
  progressPercent: number;
  remainingAmount: number;
  estimatedCompletionMonth: string;
  requiredMonthlyContribution: number;
  isAheadOfSchedule: boolean;
  delayMonths: number;
  extraContributionNeeded: number;
  aiConfidenceScore: number;
  completionProbability: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  aiInsight: string;
}

export async function getGoals(userId: string): Promise<GoalWithForecast[]> {
  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch User Financial Context for probabilistic goal forecasting
  const incomes = await prisma.income.findMany({ where: { userId } });
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  const emis = await prisma.emiItem.findMany({ where: { userId } });
  const totalEmi = emis.reduce((sum, e) => sum + e.amount, 0);

  const now = new Date();

  return goals.map((goal) => {
    const progressPercent = goal.targetAmount > 0 
      ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) 
      : 0;
    
    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);

    const targetDateObj = new Date(goal.targetDate);
    const monthsDiff = Math.max(1, (targetDateObj.getFullYear() - now.getFullYear()) * 12 + (targetDateObj.getMonth() - now.getMonth()));

    const requiredMonthlyContribution = Math.round((remainingAmount / monthsDiff) * 100) / 100;
    const isAheadOfSchedule = goal.monthlyContribution >= requiredMonthlyContribution;

    let estimatedMonthsNeeded = goal.monthlyContribution > 0 
      ? Math.ceil(remainingAmount / goal.monthlyContribution) 
      : monthsDiff + 12;

    const completionDateObj = new Date(now.getFullYear(), now.getMonth() + estimatedMonthsNeeded, 1);
    const estimatedCompletionMonth = completionDateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const delayMonths = estimatedMonthsNeeded - monthsDiff;
    const extraContributionNeeded = Math.max(0, requiredMonthlyContribution - goal.monthlyContribution);

    // AI Confidence & Probability calculation based on income capacity
    let aiConfidenceScore = 75;
    if (goal.monthlyContribution >= requiredMonthlyContribution) aiConfidenceScore += 15;
    else aiConfidenceScore -= Math.min(30, delayMonths * 3);

    if (totalIncome > 0 && requiredMonthlyContribution > totalIncome * 0.4) {
      aiConfidenceScore -= 20;
    }

    aiConfidenceScore = Math.max(15, Math.min(98, aiConfidenceScore));

    let completionProbability: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' = 'HIGH';
    if (aiConfidenceScore < 45) completionProbability = 'LOW';
    else if (aiConfidenceScore < 65) completionProbability = 'MEDIUM';
    else if (aiConfidenceScore >= 85) completionProbability = 'VERY_HIGH';

    const goalCategoryName = goal.category || goal.title || 'Goal';
    let aiInsight = `Your ${goal.title} goal is likely to complete by ${estimatedCompletionMonth}.`;

    if (extraContributionNeeded > 0) {
      aiInsight += ` Increasing your contribution by ₹${Math.round(extraContributionNeeded).toLocaleString('en-IN')}/month will reduce the timeline by ${Math.max(1, Math.abs(delayMonths))} months.`;
    } else {
      aiInsight += ` You are ahead of schedule by ${Math.abs(delayMonths)} months!`;
    }

    return {
      ...goal,
      progressPercent,
      remainingAmount,
      estimatedCompletionMonth,
      requiredMonthlyContribution,
      isAheadOfSchedule,
      delayMonths,
      extraContributionNeeded,
      aiConfidenceScore,
      completionProbability,
      aiInsight,
    };
  });
}

export async function createGoal(
  userId: string,
  data: {
    title: string;
    targetAmount: number;
    currentAmount?: number;
    targetDate: string | Date;
    monthlyContribution?: number;
    category?: string;
  }
) {
  return prisma.goal.create({
    data: {
      userId,
      title: data.title,
      targetAmount: Number(data.targetAmount),
      currentAmount: Number(data.currentAmount || 0),
      targetDate: new Date(data.targetDate),
      monthlyContribution: Number(data.monthlyContribution || 0),
      category: data.category || 'House',
    },
  });
}

export async function updateGoal(
  userId: string,
  id: string,
  data: Partial<{
    title: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string | Date;
    monthlyContribution: number;
    category: string;
  }>
) {
  const existing = await prisma.goal.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Goal not found');

  const updatePayload: any = {};
  if (data.title !== undefined) updatePayload.title = data.title;
  if (data.targetAmount !== undefined) updatePayload.targetAmount = Number(data.targetAmount);
  if (data.currentAmount !== undefined) updatePayload.currentAmount = Number(data.currentAmount);
  if (data.targetDate !== undefined) updatePayload.targetDate = new Date(data.targetDate);
  if (data.monthlyContribution !== undefined) updatePayload.monthlyContribution = Number(data.monthlyContribution);
  if (data.category !== undefined) updatePayload.category = data.category;

  return prisma.goal.update({
    where: { id },
    data: updatePayload,
  });
}

export async function deleteGoal(userId: string, id: string) {
  const existing = await prisma.goal.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Goal not found');

  return prisma.goal.delete({ where: { id } });
}
