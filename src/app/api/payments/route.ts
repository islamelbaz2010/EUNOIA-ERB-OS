import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(["CASH", "BANK_TRANSFER", "CHECK", "CREDIT_CARD", "ONLINE", "OTHER"]),
  paymentDate: z.string().datetime().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  installmentId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const invoiceId = searchParams.get("invoiceId") || undefined;
    const method = searchParams.get("method") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const where: any = {};
    if (invoiceId) where.invoiceId = invoiceId;
    if (method) where.method = method;
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          invoice: { select: { id: true, invoiceNumber: true, total: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      db.payment.count({ where }),
    ]);

    return NextResponse.json({
      payments,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("GET /api/payments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createPaymentSchema.parse(body);

    const invoice = await db.invoice.findUnique({
      where: { id: validatedData.invoiceId },
      include: { paymentSchedule: { include: { installmentList: true } } },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "CANCELLED") {
      return NextResponse.json({ error: "Cannot record payment for cancelled invoice" }, { status: 400 });
    }

    const payment = await db.payment.create({
      data: {
        invoiceId: validatedData.invoiceId,
        amount: validatedData.amount,
        method: validatedData.method,
        paymentDate: validatedData.paymentDate ? new Date(validatedData.paymentDate) : new Date(),
        reference: validatedData.reference,
        notes: validatedData.notes,
        installmentId: validatedData.installmentId,
        recordedById: (session.user as any).id,
      },
    });

    const totalPaidResult = await db.payment.aggregate({
      where: { invoiceId: validatedData.invoiceId },
      _sum: { amount: true },
    });
    const totalPaid = Number(totalPaidResult._sum.amount || 0);
    const invoiceTotal = Number(invoice.total);

    let newStatus: string;
    if (totalPaid >= invoiceTotal) {
      newStatus = "PAID";
    } else if (totalPaid > 0) {
      newStatus = "PARTIALLY_PAID";
    } else {
      newStatus = invoice.status;
    }

    await db.invoice.update({
      where: { id: validatedData.invoiceId },
      data: { status: newStatus as any },
    });

    if (validatedData.installmentId) {
      const installment = await db.paymentInstallment.findUnique({
        where: { id: validatedData.installmentId },
      });

      if (installment) {
        const installmentPaid = totalPaid / (invoice.paymentSchedule?.installments || 1);
        const installmentStatus = installmentPaid >= Number(installment.amount) ? "PAID" : "PARTIALLY_PAID";

        await db.paymentInstallment.update({
          where: { id: validatedData.installmentId },
          data: {
            status: installmentStatus as any,
            paidAmount: Math.min(totalPaid, Number(installment.amount)),
            paidDate: new Date(),
          },
        });

        if (invoice.paymentSchedule) {
          const allInstallments = await db.paymentInstallment.findMany({
            where: { paymentScheduleId: invoice.paymentSchedule.id },
          });
          const allPaid = allInstallments.every((inst: any) => inst.status === "PAID");
          const scheduleStatus = allPaid ? "COMPLETED" : "PARTIALLY_PAID";

          await db.paymentSchedule.update({
            where: { id: invoice.paymentSchedule.id },
            data: { status: scheduleStatus as any },
          });
        }
      }
    }

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "CREATE",
        entity: "Payment",
        entityId: payment.id,
        after: payment as any,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    console.error("POST /api/payments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
