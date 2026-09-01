import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";

const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  nameAr: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPersonAr: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  taxNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  paymentTerms: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
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

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const { id } = await params;

    const client = await db.client.findFirst({
      where: { id, companyId },
      include: {
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            payments: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("GET /api/clients/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(["ADMIN", "HR", "FINANCE"]);
    if (authResult.error) return authResult.error;
    const session = authResult.session;

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateClientSchema.parse(body);

    const client = await db.client.findFirst({ where: { id, companyId } });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const updated = await db.client.update({ where: { id }, data: validatedData });

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "UPDATE",
        entity: "Client",
        entityId: id,
        before: client as any,
        after: updated as any,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    console.error("PUT /api/clients/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(["ADMIN", "HR", "FINANCE"]);
    if (authResult.error) return authResult.error;
    const session = authResult.session;

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const { id } = await params;

    const client = await db.client.findFirst({ where: { id, companyId } });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await db.client.update({
      where: { id },
      data: { status: "INACTIVE" },
    });

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "SOFT_DELETE",
        entity: "Client",
        entityId: id,
        before: client as any,
      },
    });

    return NextResponse.json({ message: "Client deactivated" });
  } catch (error) {
    console.error("DELETE /api/clients/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
