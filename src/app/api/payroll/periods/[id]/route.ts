import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";
import { canTransitionPayrollStatus, canEditPayrollPeriodFields } from "@/lib/payroll-workflow";

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
            employee: { select: { id: true, firstName: true, lastName: true, displayName: true, employeeCode: true } },
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

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const period = await db.payrollPeriod.findFirst({
      where: { id, companyId },
    });
    if (!period) {
      return NextResponse.json({ error: "Payroll period not found" }, { status: 404 });
    }

    // Period name/notes are frozen once the period is APPROVED or LOCKED —
    // those are meant to be an immutable record at that point.
    if (
      (validatedData.name !== undefined || validatedData.notes !== undefined) &&
      !canEditPayrollPeriodFields(period.status)
    ) {
      return NextResponse.json(
        { error: "Cannot modify payroll period details once approved or locked" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    if (validatedData.status) {
      if (!canTransitionPayrollStatus(period.status, validatedData.status)) {
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

    // Conditional (compare-and-swap) update: the WHERE clause re-checks that
    // the period's status is still what we just read it as. This closes the
    // race window between the check above and this write — two concurrent
    // requests acting on a stale status can no longer both succeed.
    const writeResult = await db.payrollPeriod.updateMany({
      where: { id, companyId, status: period.status },
      data: updateData,
    });

    if (writeResult.count === 0) {
      return NextResponse.json(
        { error: "Payroll period was modified by another user, please try again" },
        { status: 409 }
      );
    }

    const updated = await db.payrollPeriod.findUnique({ where: { id } });

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
