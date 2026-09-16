import { prisma } from "../db/prisma.js";

export async function getNotes(userId: string) {
  return prisma.financialNote.findMany({
    where: { userId },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });
}

export async function saveNote(userId: string, content: string, title?: string, tags?: string, pinned?: boolean) {
  const existingNote = await prisma.financialNote.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (existingNote) {
    return prisma.financialNote.update({
      where: { id: existingNote.id },
      data: {
        content,
        ...(title ? { title: title.trim() } : {}),
        ...(tags !== undefined ? { tags: tags.trim() } : {}),
        ...(pinned !== undefined ? { pinned } : {}),
      },
    });
  } else {
    return prisma.financialNote.create({
      data: {
        userId,
        title: title ? title.trim() : "Financial Diary",
        content,
        tags: tags ? tags.trim() : "",
        pinned: pinned || false,
      },
    });
  }
}

export async function createNote(userId: string, data: { title?: string; content: string; tags?: string; pinned?: boolean }) {
  return prisma.financialNote.create({
    data: {
      userId,
      title: data.title ? data.title.trim() : "Untitled Note",
      content: data.content || "",
      tags: data.tags ? data.tags.trim() : "",
      pinned: data.pinned || false,
    },
  });
}

export async function updateNote(userId: string, id: string, data: { title?: string; content?: string; tags?: string; pinned?: boolean }) {
  const existing = await prisma.financialNote.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error("Note not found");
  }

  return prisma.financialNote.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
      ...(data.tags !== undefined ? { tags: data.tags.trim() } : {}),
      ...(data.pinned !== undefined ? { pinned: data.pinned } : {}),
    },
  });
}

export async function deleteNote(userId: string, id: string) {
  const existing = await prisma.financialNote.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error("Note not found");
  }

  return prisma.financialNote.delete({
    where: { id },
  });
}
