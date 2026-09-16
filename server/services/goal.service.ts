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
}

export async function getGoals(userId: string): Promise<GoalWithForecast[]> {
  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();

  return goals.map((goal) => {
    const progressPercent = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);

    const targetDateObj = new Date(goal.targetDate);
    const monthsDiff = Math.max(1, (targetDateObj.getFullYear() - now.getFullYear()) * 12 + (targetDateObj.getMonth() - now.getMonth()));

    const requiredMonthlyContribution = Math.round((remainingAmount / monthsDiff) * 100) / 100;
    const isAheadOfSchedule = goal.monthlyContribution >= requiredMonthlyContribution;

    let estimatedMonthsNeeded = goal.monthlyContribution > 0 ? Math.ceil(remainingAmount / goal.monthlyContribution) : monthsDiff;
    const completionDateObj = new Date(now.getFullYear(), now.getMonth() + estimatedMonthsNeeded, 1);

    const estimatedCompletionMonth = completionDateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    return {
      ...goal,
      progressPercent,
      remainingAmount,
      estimatedCompletionMonth,
      requiredMonthlyContribution,
      isAheadOfSchedule,
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
      category: data.category || 'General',
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
