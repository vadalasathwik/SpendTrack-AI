import { prisma } from "../db/prisma.js";
import { Priority } from "@prisma/client";

export interface CreateReminderData {
  title: string;
  description?: string;
  dueDate: string | Date;
  priority?: Priority;
}

export interface UpdateReminderData {
  title?: string;
  description?: string;
  dueDate?: string | Date;
  priority?: Priority;
  completed?: boolean;
}

export async function getReminders(userId: string) {
  return prisma.reminder.findMany({
    where: { userId },
    orderBy: { dueDate: "asc" },
  });
}

export async function createReminder(userId: string, data: CreateReminderData) {
  if (!data.title || !data.title.trim()) {
    throw new Error("Reminder title is required");
  }
  if (!data.dueDate) {
    throw new Error("Due date is required");
  }

  return prisma.reminder.create({
    data: {
      userId,
      title: data.title.trim(),
      description: data.description ? data.description.trim() : null,
      dueDate: new Date(data.dueDate),
      priority: data.priority || "MEDIUM",
      completed: false,
    },
  });
}

export async function updateReminder(userId: string, id: string, data: UpdateReminderData) {
  const existing = await prisma.reminder.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error("Reminder not found");
  }

  return prisma.reminder.update({
    where: { id },
    data: {
      ...(data.title ? { title: data.title.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description ? data.description.trim() : null } : {}),
      ...(data.dueDate ? { dueDate: new Date(data.dueDate) } : {}),
      ...(data.priority ? { priority: data.priority } : {}),
      ...(data.completed !== undefined ? { completed: data.completed } : {}),
    },
  });
}

export async function deleteReminder(userId: string, id: string) {
  const existing = await prisma.reminder.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error("Reminder not found");
  }

  return prisma.reminder.delete({
    where: { id },
  });
}
