import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { INVOICE_STATUS_LABELS } from "@/lib/constants";
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
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const status = searchParams.get("status") || undefined;
    const clientId = searchParams.get("clientId") || undefined;

    const where: any = { companyId };
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const invoices = await db.invoice.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        items: true,
        payments: true,
      },
      orderBy: { date: "asc" },
    });

    const summary = {
      totalInvoices: invoices.length,
      totalSubtotal: invoices.reduce((sum: number, inv: any) => sum + Number(inv.subtotal), 0),
      totalDiscount: invoices.reduce((sum: number, inv: any) => sum + Number(inv.discount), 0),
      totalVat: invoices.reduce((sum: number, inv: any) => sum + Number(inv.vatAmount), 0),
      totalAmount: invoices.reduce((sum: number, inv: any) => sum + Number(inv.total), 0),
      totalPaid: invoices.reduce(
        (sum: number, inv: any) => sum + inv.payments.reduce((pSum: number, p: any) => pSum + Number(p.amount), 0),
        0
      ),
      byStatus: invoices.reduce((acc: Record<string, number>, inv: any) => {
        const label = INVOICE_STATUS_LABELS[inv.status] || inv.status;
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    const items = invoices.map((inv: any) => {
      const paid = inv.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      return {
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.client?.name ?? "-",
        date: formatDate(inv.date),
        dueDate: formatDate(inv.dueDate),
        total: Number(inv.total),
        paid,
        outstanding: Number(inv.total) - paid,
        status: INVOICE_STATUS_LABELS[inv.status] || inv.status,
      };
    });

    return NextResponse.json({ summary, items });
  } catch (error) {
    console.error("GET /api/reports/invoices error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
