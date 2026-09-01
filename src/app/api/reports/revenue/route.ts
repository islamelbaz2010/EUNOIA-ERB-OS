import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { INVOICE_STATUS_LABELS } from "@/lib/constants";

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

    const where: any = { companyId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + "T23:59:59.999Z");
    }

    const invoices = await db.invoice.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, nameAr: true } },
        payments: { select: { amount: true, paymentDate: true } },
        items: { select: { total: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const summary = {
      totalInvoices: invoices.length,
      totalRevenue: invoices.reduce((sum, inv) => sum + Number(inv.total), 0),
      totalPaid: invoices.reduce((sum, inv) => sum + inv.payments.reduce((ps, p) => ps + Number(p.amount), 0), 0),
      totalOutstanding: invoices.reduce((sum, inv) => {
        const paid = inv.payments.reduce((ps, p) => ps + Number(p.amount), 0);
        return sum + (Number(inv.total) - paid);
      }, 0),
      byStatus: invoices.reduce((acc, inv) => {
        const label = INVOICE_STATUS_LABELS[inv.status] || inv.status;
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    const items = invoices.map((inv) => {
      const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      return {
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.client?.nameAr || inv.client?.name || "-",
        total: Number(inv.total),
        paid,
        outstanding: Number(inv.total) - paid,
        status: INVOICE_STATUS_LABELS[inv.status] || inv.status,
      };
    });

    return NextResponse.json({ summary, items });
  } catch (error) {
    console.error("GET /api/reports/revenue error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
