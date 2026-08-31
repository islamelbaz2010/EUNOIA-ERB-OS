import { db } from "@/lib/db";

export function calculateInvoiceTotals(
  items: Array<{
    quantity: number;
    unitPrice: number;
  }>,
  options: {
    discount?: number;
    vatEnabled?: boolean;
    vatRate?: number;
  }
): {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  vatEnabled: boolean;
  vatRate: number;
  vatAmount: number;
  total: number;
} {
  const discount = options.discount ?? 0;
  const vatEnabled = options.vatEnabled ?? false;
  const vatRate = options.vatRate ?? 0;

  // Sum line items for subtotal
  const subtotal = items.reduce((sum, item) => {
    return sum + item.quantity * item.unitPrice;
  }, 0);

  // Apply discount
  const taxableAmount = Math.max(0, subtotal - discount);

  // Calculate VAT on (subtotal - discount) if enabled
  const vatAmount = vatEnabled ? (taxableAmount * vatRate) / 100 : 0;

  // Total = subtotal - discount + vatAmount
  const total = taxableAmount + vatAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    vatEnabled,
    vatRate,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export async function generateInvoiceNumber(
  companyId: string
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `INV-${year}-${month}`;

  // Find the last invoice for this company in this month
  const lastInvoice = await db.invoice.findFirst({
    where: {
      companyId,
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invoiceNumber: "desc",
    },
  });

  let sequentialNumber = 1;

  if (lastInvoice) {
    // Extract the sequential number from the last invoice
    const parts = lastInvoice.invoiceNumber.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      sequentialNumber = lastSeq + 1;
    }
  }

  const invoiceNumber = `${prefix}-${String(sequentialNumber).padStart(4, "0")}`;

  // Ensure uniqueness
  const existing = await db.invoice.findUnique({
    where: { invoiceNumber },
  });

  if (existing) {
    // If somehow duplicate, increment and try again
    return generateInvoiceNumber(companyId);
  }

  return invoiceNumber;
}

export function calculatePaymentSchedule(
  totalAmount: number,
  installments: number,
  startDate: Date,
  paymentTerms: number
): Array<{
  installmentNumber: number;
  amount: number;
  dueDate: Date;
}> {
  if (installments <= 0) {
    return [];
  }

  const schedule: Array<{
    installmentNumber: number;
    amount: number;
    dueDate: Date;
  }> = [];

  const baseAmount = Math.floor((totalAmount / installments) * 100) / 100;
  const remainder =
    Math.round((totalAmount - baseAmount * installments) * 100) / 100;

  for (let i = 0; i < installments; i++) {
    const installmentAmount =
      i === installments - 1
        ? Math.round((baseAmount + remainder) * 100) / 100
        : baseAmount;

    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + paymentTerms * (i + 1));

    schedule.push({
      installmentNumber: i + 1,
      amount: installmentAmount,
      dueDate,
    });
  }

  return schedule;
}

export async function updateInvoicePaymentStatus(
  invoiceId: string
): Promise<void> {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      payments: true,
    },
  });

  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found`);
  }

  // Sum all payments
  const totalPaid: number = invoice.payments.reduce<number>(
    (sum, payment) => sum + Number(payment.amount),
    0
  );

  const invoiceTotal = Number(invoice.total);
  const now = new Date();

  let newStatus: "DRAFT" | "SENT" | "VIEWED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";

  if (totalPaid >= invoiceTotal) {
    newStatus = "PAID";
  } else if (totalPaid > 0) {
    newStatus = "PARTIALLY_PAID";
  } else if (invoice.dueDate < now && invoice.status !== "DRAFT") {
    newStatus = "OVERDUE";
  } else {
    // Keep current status if it's more specific than SENT
    if (
      invoice.status === "DRAFT" ||
      invoice.status === "SENT" ||
      invoice.status === "VIEWED"
    ) {
      newStatus = invoice.status;
    } else {
      newStatus = "SENT";
    }
  }

  await db.invoice.update({
    where: { id: invoiceId },
    data: { status: newStatus },
  });

  // Update payment installments if payment schedule exists
  if (invoice.payments.length > 0) {
    const paymentSchedule = await db.paymentSchedule.findUnique({
      where: { invoiceId },
      include: { installmentList: true },
    });

    if (paymentSchedule) {
      let remainingPaid = totalPaid;

      for (const installment of paymentSchedule.installmentList) {
        const installmentAmount = Number(installment.amount);

        if (remainingPaid >= installmentAmount) {
          await db.paymentInstallment.update({
            where: { id: installment.id },
            data: {
              status: "PAID",
              paidAmount: installmentAmount,
              paidDate: now,
            },
          });
          remainingPaid -= installmentAmount;
        } else if (remainingPaid > 0) {
          await db.paymentInstallment.update({
            where: { id: installment.id },
            data: {
              status: "PAID",
              paidAmount: remainingPaid,
              paidDate: now,
            },
          });
          remainingPaid = 0;
        } else {
          // Check if overdue
          if (installment.dueDate < now && installment.status !== "PAID") {
            await db.paymentInstallment.update({
              where: { id: installment.id },
              data: { status: "OVERDUE" },
            });
          }
        }
      }

      // Update payment schedule status
      const allPaid = paymentSchedule.installmentList.every(
        (i) => Number(i.paidAmount) >= Number(i.amount)
      );
      const anyOverdue = paymentSchedule.installmentList.some(
        (i) => i.dueDate < now && Number(i.paidAmount) < Number(i.amount)
      );

      let scheduleStatus: "PENDING" | "PARTIALLY_PAID" | "COMPLETED" | "DEFAULTED";
      if (allPaid) {
        scheduleStatus = "COMPLETED";
      } else if (anyOverdue) {
        scheduleStatus = "DEFAULTED";
      } else if (totalPaid > 0) {
        scheduleStatus = "PARTIALLY_PAID";
      } else {
        scheduleStatus = "PENDING";
      }

      await db.paymentSchedule.update({
        where: { id: paymentSchedule.id },
        data: { status: scheduleStatus },
      });
    }
  }
}
