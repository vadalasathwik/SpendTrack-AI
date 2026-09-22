import { prisma } from "../db/prisma.js";

export interface ReceiptItemInput {
  name: string;
  quantity?: number;
  unit?: string;
  pricePerUnit?: number;
  lineAmount?: number;
  category?: string;
}

export interface SaveReceiptVaultInput {
  userId: string;
  merchant: string;
  invoiceNumber?: string | null;
  purchaseDate?: string | Date | null;
  subtotal?: number | null;
  discount?: number | null;
  taxAmount?: number | null;
  total?: number | null;
  paymentMethod?: string | null;
  currency?: string | null;
  receiptImage?: string | null;
  ocrText?: string | null;
  items: ReceiptItemInput[];
}

export async function saveReceiptVaultRecord(input: SaveReceiptVaultInput) {
  const {
    userId,
    merchant,
    invoiceNumber,
    purchaseDate,
    subtotal: rawSubtotal,
    discount: rawDiscount,
    taxAmount: rawTax,
    total: rawTotal,
    paymentMethod,
    currency,
    receiptImage,
    ocrText,
    items,
  } = input;

  const cleanInvoice = invoiceNumber && typeof invoiceNumber === "string" ? invoiceNumber.trim() : null;

  // Deduplication check: if invoiceNumber is present, check for existing receipt
  if (cleanInvoice) {
    const existing = await prisma.receipt.findFirst({
      where: {
        userId,
        invoiceNumber: cleanInvoice,
      },
      include: {
        items: true,
      },
    });

    if (existing) {
      return existing;
    }
  }

  const pDate = purchaseDate ? new Date(purchaseDate) : new Date();
  const validPurchaseDate = isNaN(pDate.getTime()) ? new Date() : pDate;

  // Process items
  const processedItems = items.map((it) => {
    const qty = Number(it.quantity) > 0 ? Number(it.quantity) : 1;
    const lineAmt = Number(it.lineAmount) >= 0 ? Number(it.lineAmount) : 0;
    const unitPrice =
      Number(it.pricePerUnit) > 0
        ? Number(it.pricePerUnit)
        : lineAmt > 0
        ? Math.round((lineAmt / qty) * 100) / 100
        : 0;

    return {
      name: it.name && it.name.trim() ? it.name.trim() : "Item",
      quantity: qty,
      unit: it.unit || "unit",
      pricePerUnit: unitPrice,
      lineAmount: lineAmt,
      category: it.category || "Groceries",
    };
  });

  const calculatedSubtotal = processedItems.reduce((sum, item) => sum + item.lineAmount, 0);
  const finalSubtotal = rawSubtotal !== null && rawSubtotal !== undefined && rawSubtotal >= 0 ? rawSubtotal : calculatedSubtotal;
  const finalTax = rawTax !== null && rawTax !== undefined && rawTax >= 0 ? rawTax : 0;
  const finalDiscount = rawDiscount !== null && rawDiscount !== undefined && rawDiscount >= 0 ? rawDiscount : 0;
  
  const finalTotal =
    rawTotal !== null && rawTotal !== undefined && rawTotal >= 0
      ? rawTotal
      : finalSubtotal - finalDiscount + finalTax;

  // Find or default user category for expenses
  let defaultCategory = await prisma.category.findFirst({
    where: { userId, name: "Groceries" },
  });

  if (!defaultCategory) {
    defaultCategory = await prisma.category.findFirst({
      where: { userId },
    });
  }

  // Create Receipt + ReceiptItems + Expenses in PostgreSQL
  const receipt = await prisma.receipt.create({
    data: {
      userId,
      merchant: merchant && merchant.trim() ? merchant.trim() : "Store Purchase",
      invoiceNumber: cleanInvoice,
      purchaseDate: validPurchaseDate,
      subtotal: finalSubtotal,
      discount: finalDiscount,
      taxAmount: finalTax,
      total: finalTotal,
      paymentMethod: paymentMethod || "UPI",
      currency: currency || "INR",
      receiptImage: receiptImage || null,
      ocrText: ocrText || null,
      items: {
        create: processedItems,
      },
    },
    include: {
      items: true,
    },
  });

  // Generate Expense records for each receipt item
  for (const item of receipt.items) {
    let categoryObj = await prisma.category.findFirst({
      where: {
        userId,
        name: { equals: item.category || "Groceries", mode: "insensitive" },
      },
    });

    if (!categoryObj) {
      categoryObj = defaultCategory;
    }

    if (categoryObj) {
      await prisma.expense.create({
        data: {
          title: item.name,
          amount: item.lineAmount,
          type: "EXPENSE",
          spentAt: validPurchaseDate,
          location: receipt.merchant,
          note: `Receipt [Inv: ${cleanInvoice || "N/A"}] - Qty ${item.quantity} @ ₹${item.pricePerUnit}`,
          categoryId: categoryObj.id,
          userId,
        },
      });
    }
  }

  return receipt;
}

export async function getUserReceipts(userId: string, searchQuery?: string) {
  const query = searchQuery ? searchQuery.trim().toLowerCase() : "";

  const receipts = await prisma.receipt.findMany({
    where: {
      userId,
      ...(query
        ? {
            OR: [
              { merchant: { contains: query, mode: "insensitive" } },
              { invoiceNumber: { contains: query, mode: "insensitive" } },
              { ocrText: { contains: query, mode: "insensitive" } },
              { items: { some: { name: { contains: query, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    include: {
      items: true,
    },
    orderBy: {
      purchaseDate: "desc",
    },
  });

  return receipts;
}

export async function getReceiptById(userId: string, receiptId: string) {
  const receipt = await prisma.receipt.findFirst({
    where: {
      id: receiptId,
      userId,
    },
    include: {
      items: true,
    },
  });

  return receipt;
}

export async function getMerchantIntelligence(userId: string, merchantName: string) {
  if (!merchantName) {
    return {
      merchant: "",
      totalVisits: 0,
      totalSpent: 0,
      averageBill: 0,
      lastPurchase: null,
    };
  }

  const receipts = await prisma.receipt.findMany({
    where: {
      userId,
      merchant: { equals: merchantName.trim(), mode: "insensitive" },
    },
    orderBy: {
      purchaseDate: "desc",
    },
  });

  const totalVisits = receipts.length;
  const totalSpent = receipts.reduce((sum, r) => sum + r.total, 0);
  const averageBill = totalVisits > 0 ? Math.round((totalSpent / totalVisits) * 100) / 100 : 0;
  const lastPurchase = receipts.length > 0 ? receipts[0].purchaseDate : null;

  return {
    merchant: merchantName.trim(),
    totalVisits,
    totalSpent,
    averageBill,
    lastPurchase,
  };
}

export async function deleteReceipt(userId: string, receiptId: string) {
  const existing = await prisma.receipt.findFirst({
    where: { id: receiptId, userId },
  });

  if (!existing) {
    throw new Error("Receipt not found");
  }

  await prisma.receipt.delete({
    where: { id: receiptId },
  });

  return { success: true };
}
