import { prisma } from '../db/prisma.js';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function getDocuments(userId: string, category?: string, searchQuery?: string) {
  const whereClause: any = { userId };

  if (category && category !== 'ALL') {
    whereClause.category = category;
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim();
    whereClause.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { category: { contains: q, mode: 'insensitive' } },
      { tags: { contains: q, mode: 'insensitive' } },
      { ocrText: { contains: q, mode: 'insensitive' } },
    ];
  }

  const documents = await prisma.financialDocument.findMany({
    where: whereClause,
    orderBy: { uploadedAt: 'desc' },
  });

  const categoriesCount: Record<string, number> = {};
  documents.forEach((doc) => {
    categoriesCount[doc.category] = (categoriesCount[doc.category] || 0) + 1;
  });

  return {
    documents,
    totalCount: documents.length,
    categoriesCount,
  };
}

export async function addDocument(userId: string, data: {
  title: string;
  category: string;
  fileUrl: string;
  fileType?: string;
  ocrText?: string;
  tags?: string;
  summary?: string;
}) {
  let summary = data.summary || '';

  if (!summary && ai && (data.ocrText || data.title)) {
    try {
      const prompt = `Summarize this document in 1 sentence for a financial vault:
Title: ${data.title}
Category: ${data.category}
Extracted Text: ${data.ocrText || 'N/A'}`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      if (response?.text) {
        summary = response.text.trim();
      }
    } catch (e) {
      console.warn('Gemini doc summary fallback:', e);
    }
  }

  return prisma.financialDocument.create({
    data: {
      userId,
      title: data.title,
      category: data.category || 'OTHER',
      fileUrl: data.fileUrl,
      fileType: data.fileType || 'pdf',
      ocrText: data.ocrText || '',
      tags: data.tags || data.category,
      summary: summary || `${data.category} document uploaded to vault`,
    },
  });
}

export async function deleteDocument(userId: string, id: string) {
  return prisma.financialDocument.deleteMany({
    where: { id, userId },
  });
}
