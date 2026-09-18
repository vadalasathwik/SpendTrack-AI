import { prisma } from '../db/prisma.js';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function getFamilyWorkspace(userId: string) {
  const members = await prisma.familyMember.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });

  // Ensure default Self record exists
  if (members.length === 0) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const defaultSelf = await prisma.familyMember.create({
      data: {
        userId,
        name: user?.name || 'Primary Account',
        relation: 'Self',
        role: 'OWNER',
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      },
    });
    members.push(defaultSelf);
  }

  // Aggregate total household financial figures
  const [assets, liabilities, goals, insurance] = await Promise.all([
    prisma.assetItem.findMany({ where: { userId } }),
    prisma.liabilityItem.findMany({ where: { userId } }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.insurancePolicy.findMany({ where: { userId } }),
  ]);

  const totalHouseholdAssets = assets.reduce((sum, a) => sum + a.amount, 0);
  const totalHouseholdLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);
  const totalHouseholdNetWorth = totalHouseholdAssets - totalHouseholdLiabilities;
  const activeGoalsCount = goals.length;
  const totalInsurancePolicies = insurance.length;

  let aiFamilyAdvice = 'Family workspace configured with role-based viewing permissions.';

  if (ai && members.length > 0) {
    try {
      const prompt = `Provide a 2-sentence household financial planning advice for a family of ${members.length} members with Net Worth ₹${totalHouseholdNetWorth} and ${totalInsurancePolicies} active insurance policies.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      if (response?.text) {
        aiFamilyAdvice = response.text.trim();
      }
    } catch (e) {
      console.warn('Gemini family advice fallback:', e);
    }
  }

  return {
    members,
    totalHouseholdAssets,
    totalHouseholdLiabilities,
    totalHouseholdNetWorth,
    activeGoalsCount,
    totalInsurancePolicies,
    aiFamilyAdvice,
  };
}

export async function addFamilyMember(userId: string, data: {
  name: string;
  relation: string;
  role?: string;
  avatar?: string;
}) {
  return prisma.familyMember.create({
    data: {
      userId,
      name: data.name,
      relation: data.relation || 'Dependent',
      role: data.role || 'VIEWER',
      avatar: data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.name)}`,
    },
  });
}

export async function deleteFamilyMember(userId: string, id: string) {
  return prisma.familyMember.deleteMany({
    where: { id, userId },
  });
}
