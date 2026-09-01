import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";

const createInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  discount: z.number().min(0).optional(),
  vatEnabled: z.boolean().optional(),
  notes: z.string().optional(),
  paymentTerms: z.number().int().min(0).optional(),
  status: z.enum(["DRAFT", "SENT"]).optional(),
  items: z.array(
    z.object({
      serviceId: z.string().uuid().optional(),
      description: z.string().min(1),
      quantity: z.number().positive(),
      unitPrice: z.number().min(0),
    })
  ).min(1),
  installments: z.number().int().min(1).optional(),
});

async function generateInvoiceNumber(companyId: string): Promise<string> {
  const count = await db.invoice.count({ where: { companyId } });
  const num = count + 1;
  const year = new Date().getFullYear();
  return `INV-${year}-${String(num).padStart(5, "0")}`;
}

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
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const status = searchParams.get("status") || undefined;
    const clientId = searchParams.get("clientId") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const where: any = { companyId };
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, contactPerson: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      db.invoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("GET /api/invoices error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(["ADMIN", "FINANCE"]);
    if (authResult.error) return authResult.error;
    const session = authResult.session;

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = createInvoiceSchema.parse(body);

    const invoiceNumber = await generateInvoiceNumber(companyId);

    let subtotal = 0;
    for (const item of validatedData.items) {
      subtotal += item.quantity * item.unitPrice;
    }

    const discount = validatedData.discount || 0;
    const afterDiscount = subtotal - discount;

    const company = await db.company.findUnique({ where: { id: companyId } });
    const vatEnabled = validatedData.vatEnabled ?? false;
    const vatRate = vatEnabled ? Number(company?.vatRate || 15) : 0;
    const vatAmount = afterDiscount * (vatRate / 100);
    const total = afterDiscount + vatAmount;

    const invoice = await db.invoice.create({
      data: {
        companyId,
        clientId: validatedData.clientId,
        invoiceNumber,
        dueDate: new Date(validatedData.dueDate),
        subtotal: subtotal,
        discount: discount,
        vatEnabled: vatEnabled,
        vatRate: vatRate,
        vatAmount: vatAmount,
        total: total,
        notes: validatedData.notes,
        paymentTerms: validatedData.paymentTerms ?? 30,
        status: validatedData.status ?? "DRAFT",
        createdById: (session.user as any).id,
        items: {
          create: validatedData.items.map((item) => ({
            serviceId: item.serviceId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
        client: true,
      },
    });

    const installmentCount = validatedData.installments || 1;
    if (installmentCount > 1) {
      const installmentAmount = total / installmentCount;
      const schedule = await db.paymentSchedule.create({
        data: {
          invoiceId: invoice.id,
          totalAmount: total,
          installments: installmentCount,
          installmentList: {
            create: Array.from({ length: installmentCount }, (_, i) => {
              const dueDate = new Date(validatedData.dueDate);
              dueDate.setMonth(dueDate.getMonth() + i);
              return {
                installmentNumber: i + 1,
                amount: installmentAmount,
                dueDate,
                status: "PENDING",
              };
            }),
          },
        },
      });
    }

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "CREATE",
        entity: "Invoice",
        entityId: invoice.id,
        after: invoice as any,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    console.error("POST /api/invoices error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
