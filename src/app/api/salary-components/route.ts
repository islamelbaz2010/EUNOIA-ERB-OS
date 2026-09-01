import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { formatZodError } from "@/lib/validation";
import { requireRole } from "@/lib/authorization";

const createComponentSchema = z.object({
  salaryProfileId: z.string().uuid(),
  type: z.enum(["ALLOWANCE", "BONUS", "OVERTIME", "COMMISSION", "DEDUCTION", "ADVANCE", "PENALTY", "REIMBURSEMENT", "MANUAL"]),
  name: z.string().min(1),
  nameAr: z.string().optional(),
  amount: z.number().min(0),
  isPercentage: z.boolean().optional().default(false),
  isRecurring: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(["ADMIN", "HR"]);
    if (authResult.error) return authResult.error;
    const session = authResult.session;

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = createComponentSchema.parse(body);

    const profile = await db.salaryProfile.findUnique({
      where: { id: validatedData.salaryProfileId },
      include: { employee: true },
    });

    if (!profile || profile.employee.companyId !== companyId) {
      return NextResponse.json({ error: "Salary profile not found" }, { status: 404 });
    }

    const component = await db.salaryComponent.create({
      data: {
        salaryProfileId: validatedData.salaryProfileId,
        type: validatedData.type,
        name: validatedData.name,
        nameAr: validatedData.nameAr,
        amount: validatedData.amount,
        isPercentage: validatedData.isPercentage,
        isRecurring: validatedData.isRecurring,
      },
    });

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "CREATE",
        entity: "SalaryComponent",
        entityId: component.id,
        after: component as any,
      },
    });

    return NextResponse.json(component, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(error), details: error.issues }, { status: 400 });
    }
    console.error("POST /api/salary-components error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireRole(["ADMIN", "HR"]);
    if (authResult.error) return authResult.error;
    const session = authResult.session;

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

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
    console.error("DELETE /api/salary-components error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
