import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";
import { calculatePeriodPayroll } from "@/lib/payroll-engine";

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

    if (period.status !== "DRAFT") {
      return NextResponse.json({ error: "Period must be in DRAFT status to calculate" }, { status: 400 });
    }

    const result = await calculatePeriodPayroll(periodId);

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
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    console.error("POST /api/payroll/calculate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
