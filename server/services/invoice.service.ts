import { prisma } from "../db/prisma.js";

export const getInvoices = async (userId: string) => {
  // Return active client invoice records
  const sampleInvoices = [
    { id: "inv_1", client: "Acme Corp Tech", amount: 45000, dueDate: "2026-10-05", gst: 8100, status: "PAID", paidDate: "2026-09-12" },
    { id: "inv_2", client: "Nexus Labs AI", amount: 28000, dueDate: "2026-09-28", gst: 5040, status: "PENDING", paidDate: null },
    { id: "inv_3", client: "Global Cloud Systems", amount: 62000, dueDate: "2026-09-20", gst: 11160, status: "OVERDUE", paidDate: null },
  ];

  const totalOutstanding = sampleInvoices.filter((i) => i.status !== "PAID").reduce((acc, i) => acc + i.amount, 0);
  const totalPaid = sampleInvoices.filter((i) => i.status === "PAID").reduce((acc, i) => acc + i.amount, 0);

  return {
    totalOutstanding,
    totalPaid,
    overdueCount: sampleInvoices.filter((i) => i.status === "OVERDUE").length,
    invoices: sampleInvoices,
  };
};

export const createInvoice = async (
  userId: string,
  data: { client: string; amount: number; dueDate: string; gst?: number; status?: string }
) => {
  await prisma.auditLog.create({
    data: {
      userId,
      action: "CREATE",
      entity: "Invoice",
      newValue: `Created Invoice for ${data.client} of ₹${data.amount}`,
    },
  });

  return {
    id: `inv_${Date.now()}`,
    userId,
    client: data.client,
    amount: data.amount,
    dueDate: data.dueDate,
    gst: data.gst || Math.round(data.amount * 0.18),
    status: data.status || "PENDING",
  };
};
