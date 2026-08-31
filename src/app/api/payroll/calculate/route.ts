import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";

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

    const period = await db.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) {
      return NextResponse.json({ error: "Payroll period not found" }, { status: 404 });
    }

    if (period.status !== "DRAFT") {
      return NextResponse.json({ error: "Period must be in DRAFT status to calculate" }, { status: 400 });
    }

    const activeEmployees = await db.employee.findMany({
      where: {
        companyId: period.companyId,
        employmentStatus: "ACTIVE",
      },
      include: {
        salaryProfiles: {
          where: { effectiveTo: null },
          take: 1,
          include: { components: { where: { isActive: true } } },
          orderBy: { effectiveFrom: "desc" },
        },
      },
    });

    let totalGross = 0;
    let totalNet = 0;
    const records: any[] = [];

    for (const employee of activeEmployees) {
      if (!employee.salaryProfiles.length) continue;

      const salaryProfile = employee.salaryProfiles[0];
      const baseSalary = Number(salaryProfile.baseSalary);
      const hourlyRate = Number(salaryProfile.hourlyRate) || (baseSalary / 30 / 8);

      const attendanceDays = await db.attendanceDay.findMany({
        where: {
          employeeId: employee.id,
          date: { gte: period.startDate, lte: period.endDate },
        },
      });

      let totalLateMinutes = 0;
      let absentDays = 0;
      let workDays = 0;

      for (const day of attendanceDays) {
        if (day.status === "PRESENT" || day.status === "HALF_DAY") {
          workDays++;
          totalLateMinutes += day.lateMinutes;
          if (day.status === "HALF_DAY") absentDays += 0.5;
        } else if (day.status === "ABSENT") {
          absentDays++;
        }
      }

      const dailySalary = baseSalary / 30;
      const attendanceDeduction = (absentDays * dailySalary) + (totalLateMinutes / 60 * hourlyRate);
      const lateDeduction = totalLateMinutes / 60 * hourlyRate;

      let totalAdditions = 0;
      let totalDeductions = 0;
      const componentRecords: any[] = [];

      for (const component of salaryProfile.components) {
        const amount = Number(component.amount);
        componentRecords.push({
          type: component.type,
          name: component.name,
          nameAr: component.nameAr,
          amount: component.amount,
          description: `${component.type} component`,
        });

        if (["DEDUCTION", "ADVANCE", "PENALTY"].includes(component.type)) {
          totalDeductions += amount;
        } else {
          totalAdditions += amount;
        }
      }

      const overtimeMinutesTotal = attendanceDays.reduce((sum: number, d: any) => sum + d.overtimeMinutes, 0);
      const overtime = overtimeMinutesTotal / 60 * hourlyRate * 1.5;

      const gross = baseSalary + totalAdditions + overtime;
      const net = gross - totalDeductions - attendanceDeduction;

      totalGross += gross;
      totalNet += net;

      const payrollRecord = await db.payrollRecord.create({
        data: {
          payrollPeriodId: periodId,
          employeeId: employee.id,
          baseSalary: baseSalary,
          totalAdditions: totalAdditions,
          totalDeductions: totalDeductions,
          attendanceDeductions: attendanceDeduction,
          overtime: overtime,
          gross: gross,
          net: net,
          status: "CALCULATED",
          attendanceSummary: {
            totalWorkDays: workDays,
            absentDays,
            lateMinutes: totalLateMinutes,
            overtimeMinutes: overtimeMinutesTotal,
          },
          componentsList: {
            create: componentRecords.map((c) => ({
              type: c.type,
              name: c.name,
              nameAr: c.nameAr,
              amount: c.amount,
              description: c.description,
            })),
          },
        },
        include: { componentsList: true },
      });

      records.push(payrollRecord);
    }

    await db.payrollPeriod.update({
      where: { id: periodId },
      data: {
        status: "CALCULATED",
        totalEmployees: records.length,
        totalGross: totalGross,
        totalNet: totalNet,
        calculatedById: (session.user as any).id,
        calculatedAt: new Date(),
      },
    });

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "CALCULATE",
        entity: "PayrollPeriod",
        entityId: periodId,
        after: {
          totalEmployees: records.length,
          totalGross,
          totalNet,
        },
      },
    });

    return NextResponse.json({
      periodId,
      totalEmployees: records.length,
      totalGross,
      totalNet,
      recordsCreated: records.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    console.error("POST /api/payroll/calculate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
