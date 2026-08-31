import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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
      byStatus: {
        DRAFT: invoices.filter((inv: any) => inv.status === "DRAFT").length,
        SENT: invoices.filter((inv: any) => inv.status === "SENT").length,
        PAID: invoices.filter((inv: any) => inv.status === "PAID").length,
        PARTIALLY_PAID: invoices.filter((inv: any) => inv.status === "PARTIALLY_PAID").length,
        OVERDUE: invoices.filter((inv: any) => inv.status === "OVERDUE").length,
        CANCELLED: invoices.filter((inv: any) => inv.status === "CANCELLED").length,
      },
    };

    return NextResponse.json({ summary, invoices });
  } catch (error) {
    console.error("GET /api/reports/invoices error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
