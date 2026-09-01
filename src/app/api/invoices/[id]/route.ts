import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";

const updateInvoiceSchema = z.object({
  clientId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  discount: z.number().min(0).optional(),
  vatEnabled: z.boolean().optional(),
  notes: z.string().optional(),
  status: z.enum(["DRAFT", "SENT", "VIEWED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  paymentTerms: z.number().int().min(0).optional(),
  items: z
    .array(
      z.object({
        serviceId: z.string().uuid().optional(),
        description: z.string().min(1),
        quantity: z.number().positive(),
        unitPrice: z.number().min(0),
      })
    )
    .optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const invoice = await db.invoice.findFirst({
      where: { id, companyId },
      include: {
        client: true,
        items: { include: { service: true } },
        payments: { orderBy: { createdAt: "desc" } },
        paymentSchedule: { include: { installmentList: { orderBy: { installmentNumber: "asc" } } } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("GET /api/invoices/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(["ADMIN", "FINANCE"]);
    if (authResult.error) return authResult.error;
    const session = authResult.session;

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateInvoiceSchema.parse(body);

    const existing = await db.invoice.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (validatedData.status) {
      updateData.status = validatedData.status;
    }

    if (existing.status !== "DRAFT" && !validatedData.status) {
      return NextResponse.json({ error: "Only draft invoices can be edited" }, { status: 400 });
    }

    if (validatedData.clientId) updateData.clientId = validatedData.clientId;
    if (validatedData.dueDate) updateData.dueDate = new Date(validatedData.dueDate);
    if (validatedData.discount !== undefined) updateData.discount = validatedData.discount;
    if (validatedData.vatEnabled !== undefined) updateData.vatEnabled = validatedData.vatEnabled;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    if (validatedData.paymentTerms !== undefined) updateData.paymentTerms = validatedData.paymentTerms;

    if (validatedData.items) {
      await db.invoiceItem.deleteMany({ where: { invoiceId: id } });

      let subtotal = 0;
      for (const item of validatedData.items) {
        subtotal += item.quantity * item.unitPrice;
      }

      const discount = validatedData.discount ?? Number(existing.discount);
      const afterDiscount = subtotal - discount;
      const vatEnabled = validatedData.vatEnabled ?? existing.vatEnabled;
      const vatRate = vatEnabled ? Number(existing.vatRate) : 0;
      const vatAmount = afterDiscount * (vatRate / 100);
      const total = afterDiscount + vatAmount;

      updateData.subtotal = subtotal;
      updateData.vatAmount = vatAmount;
      updateData.total = total;

      await db.invoiceItem.createMany({
        data: validatedData.items.map((item) => ({
          invoiceId: id,
          serviceId: item.serviceId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      });
    }

    const updated = await db.invoice.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "UPDATE",
        entity: "Invoice",
        entityId: id,
        before: existing as any,
        after: updated as any,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    console.error("PUT /api/invoices/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(["ADMIN", "FINANCE"]);
    if (authResult.error) return authResult.error;
    const session = authResult.session;

    const { id } = await params;

    const invoice = await db.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot cancel paid or already cancelled invoices" },
        { status: 400 }
      );
    }

    const updated = await db.invoice.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "CANCEL",
        entity: "Invoice",
        entityId: id,
        before: invoice as any,
        after: updated as any,
      },
    });

    return NextResponse.json({ message: "Invoice cancelled" });
  } catch (error) {
    console.error("DELETE /api/invoices/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
