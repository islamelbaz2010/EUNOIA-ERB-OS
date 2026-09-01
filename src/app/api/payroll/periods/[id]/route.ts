import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";

const statusTransitions: Record<string, string[]> = {
  DRAFT: ["CALCULATED"],
  CALCULATED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED"],
  APPROVED: ["LOCKED"],
};

const updatePeriodSchema = z.object({
  status: z.enum(["CALCULATED", "UNDER_REVIEW", "APPROVED", "LOCKED"]).optional(),
  name: z.string().optional(),
  notes: z.string().optional(),
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

    const period = await db.payrollPeriod.findFirst({
      where: { id, companyId },
      include: {
        records: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
            componentsList: true,
          },
        },

      },
    });

    if (!period) {
      return NextResponse.json({ error: "Payroll period not found" }, { status: 404 });
    }

    return NextResponse.json(period);
  } catch (error) {
    console.error("GET /api/payroll/periods/[id] error:", error);
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
    const validatedData = updatePeriodSchema.parse(body);

    const period = await db.payrollPeriod.findUnique({ where: { id } });
    if (!period) {
      return NextResponse.json({ error: "Payroll period not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    if (validatedData.status) {
      const allowed = statusTransitions[period.status];
      if (!allowed || !allowed.includes(validatedData.status)) {
        return NextResponse.json(
          { error: `Cannot transition from ${period.status} to ${validatedData.status}` },
          { status: 400 }
        );
      }

      updateData.status = validatedData.status;

      if (validatedData.status === "CALCULATED") {
        updateData.calculatedById = (session.user as any).id;
        updateData.calculatedAt = new Date();
      } else if (validatedData.status === "APPROVED") {
        updateData.approvedById = (session.user as any).id;
        updateData.approvedAt = new Date();
      } else if (validatedData.status === "LOCKED") {
        updateData.lockedById = (session.user as any).id;
        updateData.lockedAt = new Date();
      }
    }

    const updated = await db.payrollPeriod.update({ where: { id }, data: updateData });

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: validatedData.status ? `STATUS_${validatedData.status}` : "UPDATE",
        entity: "PayrollPeriod",
        entityId: id,
        before: period as any,
        after: updated as any,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    console.error("PUT /api/payroll/periods/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
