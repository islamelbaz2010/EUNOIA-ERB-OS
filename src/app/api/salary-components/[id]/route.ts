import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";

const updateComponentSchema = z.object({
  type: z.enum(["ALLOWANCE", "BONUS", "OVERTIME", "COMMISSION", "DEDUCTION", "ADVANCE", "PENALTY", "REIMBURSEMENT", "MANUAL"]).optional(),
  name: z.string().min(1).optional(),
  nameAr: z.string().optional(),
  amount: z.number().min(0).optional(),
  isPercentage: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(["ADMIN", "HR"]);
    if (authResult.error) return authResult.error;
    const session = authResult.session;

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateComponentSchema.parse(body);

    const component = await db.salaryComponent.findUnique({
      where: { id },
      include: { salaryProfile: { include: { employee: true } } },
    });

    if (!component || component.salaryProfile.employee.companyId !== companyId) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }

    const updated = await db.salaryComponent.update({
      where: { id },
      data: validatedData,
    });

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "UPDATE",
        entity: "SalaryComponent",
        entityId: id,
        before: component as any,
        after: updated as any,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    console.error("PATCH /api/salary-components/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(["ADMIN", "HR"]);
    if (authResult.error) return authResult.error;
    const session = authResult.session;

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const { id } = await params;

    const component = await db.salaryComponent.findUnique({
      where: { id },
      include: { salaryProfile: { include: { employee: true } } },
    });

    if (!component || component.salaryProfile.employee.companyId !== companyId) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }

    await db.salaryComponent.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "DELETE",
        entity: "SalaryComponent",
        entityId: id,
        before: component as any,
      },
    });

    return NextResponse.json({ message: "Component deleted" });
  } catch (error) {
    console.error("DELETE /api/salary-components/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
