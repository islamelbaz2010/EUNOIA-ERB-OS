import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { formatZodError } from "@/lib/validation";
import { requireRole } from "@/lib/authorization";
import { calculatePeriodPayroll } from "@/lib/payroll-engine";
import { canCalculatePayrollPeriod } from "@/lib/payroll-workflow";

const calculateSchema = z.object({
  periodId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(["ADMIN", "HR", "FINANCE"]);
    if (authResult.error) return authResult.error;
    const session = authResult.session;

    const body = await request.json();
    const { periodId } = calculateSchema.parse(body);

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const period = await db.payrollPeriod.findFirst({ where: { id: periodId, companyId } });
    if (!period) {
      return NextResponse.json({ error: "Payroll period not found" }, { status: 404 });
    }

    if (!canCalculatePayrollPeriod(period.status)) {
      return NextResponse.json({ error: "Period must be in DRAFT status to calculate" }, { status: 400 });
    }

    let result;
    try {
      result = await calculatePeriodPayroll(periodId);
    } catch (calcError) {
      // The engine itself re-checks DRAFT atomically at write time (see
      // src/lib/payroll-engine). The pre-check above already covers the
      // common case; this only fires if another request won a genuine
      // concurrent-calculation race between our read and the engine's
      // conditional write — surface it as the same clean 400 instead of
      // falling through to a generic 500.
      if (calcError instanceof Error && calcError.message.includes("is not in DRAFT status")) {
        return NextResponse.json({ error: "Period must be in DRAFT status to calculate" }, { status: 400 });
      }
      throw calcError;
    }

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "CALCULATE",
        entity: "PayrollPeriod",
        entityId: periodId,
        after: {
          totalEmployees: result.totalEmployees,
          totalGross: result.totalGross,
          totalNet: result.totalNet,
        },
      },
    });

    return NextResponse.json({
      periodId,
      totalEmployees: result.totalEmployees,
      totalGross: result.totalGross,
      totalNet: result.totalNet,
      recordsCreated: result.totalEmployees,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(error), details: error.issues }, { status: 400 });
    }
    console.error("POST /api/payroll/calculate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
