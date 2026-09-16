import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';

export interface CreateCategoryInput {
  name: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string;
  icon?: string;
}

async function getDbUserId(userId: string): Promise<string> {
  if (!userId) throw new Error('Category not found');
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: userId },
        { googleId: userId },
        { email: userId },
      ],
    },
  });
  if (user) return user.id;

  const newUser = await prisma.user.create({
    data: {
      id: userId,
      googleId: userId,
      email: `${userId}@example.com`,
      name: `User ${userId}`,
    },
  });
  return newUser.id;
}

/**
 * Fetch all categories for a given user.
 */
export async function getCategories(userId: string) {
  const dbUserId = await getDbUserId(userId);
  return prisma.category.findMany({
    where: {
      userId: dbUserId,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

/**
 * Create a new category for a user.
 */
export async function createCategory(userId: string, data: CreateCategoryInput) {
  const dbUserId = await getDbUserId(userId);
  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    throw new Error('Category name is required');
  }

  return prisma.category.create({
    data: {
      userId: dbUserId,
      name: data.name.trim(),
      color: data.color || '#6366F1',
      icon: data.icon || 'tag',
    },
  });
}

/**
 * Update an existing category for a user inside a Prisma transaction.
 */
export async function updateCategory(
  userId: string,
  categoryId: string,
  data: UpdateCategoryInput
) {
  const dbUserId = await getDbUserId(userId);
  return prisma.$transaction(async (tx) => {
    const existing = await tx.category.findFirst({
      where: {
        id: categoryId,
        userId: dbUserId,
      },
    });

    if (!existing) {
      throw new Error('Category not found');
    }

    const updateData: Prisma.CategoryUpdateInput = {};
    if (data.name !== undefined && data.name.trim()) {
      updateData.name = data.name.trim();
    }
    if (data.color !== undefined) {
      updateData.color = data.color;
    }
    if (data.icon !== undefined) {
      updateData.icon = data.icon;
    }

    return tx.category.update({
      where: { id: categoryId },
      data: updateData,
    });
  });
}

/**
 * Delete a category for a user inside a Prisma transaction.
 * Throws "Category not found" if category does not exist or belong to user.
 * Throws error if expenses exist for this category.
 */
export async function deleteCategory(userId: string, categoryId: string) {
  const dbUserId = await getDbUserId(userId);
  return prisma.$transaction(async (tx) => {
    const existing = await tx.category.findFirst({
      where: {
        id: categoryId,
        userId: dbUserId,
      },
    });

    if (!existing) {
      throw new Error('Category not found');
    }

    const expenseCount = await tx.expense.count({
      where: { categoryId },
    });

    if (expenseCount > 0) {
      throw new Error('Cannot delete category with existing expenses');
    }

    await tx.category.delete({
      where: { id: categoryId },
    });

    return { success: true };
  });
}
