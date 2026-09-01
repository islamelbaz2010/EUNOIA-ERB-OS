import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const method = searchParams.get("method");

    const where: any = {
      invoice: { companyId },
    };

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate + "T23:59:59.999Z");
    }
    if (method) where.method = method;

    const payments = await db.payment.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            client: { select: { id: true, name: true, nameAr: true } },
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    const summary = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + Number(p.amount), 0),
      byMethod: payments.reduce((acc, p) => {
        const label = PAYMENT_METHOD_LABELS[p.method] || p.method;
        acc[label] = (acc[label] || 0) + Number(p.amount);
        return acc;
      }, {} as Record<string, number>),
    };

    const items = payments.map((p) => ({
      invoiceNumber: p.invoice?.invoiceNumber ?? "-",
      clientName: p.invoice?.client?.nameAr || p.invoice?.client?.name || "-",
      amount: Number(p.amount),
      paymentDate: formatDate(p.paymentDate),
      method: PAYMENT_METHOD_LABELS[p.method] || p.method,
      reference: p.reference || "-",
    }));

    return NextResponse.json({ summary, items });
  } catch (error) {
    console.error("GET /api/reports/payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
