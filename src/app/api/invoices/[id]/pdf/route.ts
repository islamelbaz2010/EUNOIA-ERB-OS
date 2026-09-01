import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateInvoicePdf } from "@/lib/pdf/invoice";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const { id } = await params;

    const invoice = await db.invoice.findFirst({
      where: { id, companyId },
      include: {
        client: true,
        items: true,
        payments: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const company = await db.company.findFirst({
      where: { invoices: { some: { id: invoice.id } } },
    });

    const items = invoice.items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.total),
    }));

    const payments = invoice.payments.map((p) => ({
      amount: Number(p.amount),
      date: p.paymentDate.toISOString(),
      method: p.method,
    }));

    const pdfBuffer = await generateInvoicePdf({
      company: {
        name: company?.name || "EUNOIA",
        nameAr: company?.nameAr || undefined,
        address: company?.address || undefined,
        phone: company?.phone || undefined,
        email: company?.email || undefined,
        vatNumber: company?.vatNumber || undefined,
      },
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date.toISOString(),
        dueDate: invoice.dueDate.toISOString(),
        status: invoice.status,
        notes: invoice.notes || undefined,
        paymentTerms: invoice.paymentTerms,
      },
      client: {
        name: invoice.client.name,
        contactPerson: invoice.client.contactPerson || undefined,
        phone: invoice.client.phone || undefined,
        email: invoice.client.email || undefined,
        address: invoice.client.address || undefined,
      },
      items,
      subtotal: Number(invoice.subtotal),
      discount: Number(invoice.discount),
      vatEnabled: invoice.vatEnabled,
      vatRate: Number(invoice.vatRate),
      vatAmount: Number(invoice.vatAmount),
      total: Number(invoice.total),
      currency: invoice.currency,
      payments,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("GET /api/invoices/[id]/pdf error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
