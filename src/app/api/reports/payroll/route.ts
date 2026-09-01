import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PAYROLL_RECORD_STATUS_LABELS } from "@/lib/constants";

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
    const periodId = searchParams.get("periodId");
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    let records: any[];

    if (periodId) {
      const period = await db.payrollPeriod.findUnique({
        where: { id: periodId, companyId },
      });

      if (!period) {
        return NextResponse.json({ error: "Payroll period not found" }, { status: 404 });
      }

      records = await db.payrollRecord.findMany({
        where: { payrollPeriodId: periodId },
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          componentsList: true,
          payrollPeriod: { select: { id: true, name: true, startDate: true, endDate: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    } else {
      const where: any = {
        payrollPeriod: { companyId },
      };

      if (startDate || endDate) {
        where.payrollPeriod.startDate = {};
        if (startDate) where.payrollPeriod.startDate.gte = new Date(startDate);
        if (endDate) where.payrollPeriod.startDate.lte = new Date(endDate);
      }

      records = await db.payrollRecord.findMany({
        where,
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          componentsList: true,
          payrollPeriod: { select: { id: true, name: true, startDate: true, endDate: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    }

    const totalGross = records.reduce((sum: number, r: any) => sum + Number(r.gross), 0);
    const totalNet = records.reduce((sum: number, r: any) => sum + Number(r.net), 0);
    const totalDeductions = records.reduce((sum: number, r: any) => sum + Number(r.totalDeductions) + Number(r.attendanceDeductions), 0);
    const totalOvertime = records.reduce((sum: number, r: any) => sum + Number(r.overtime), 0);
    const totalBaseSalary = records.reduce((sum: number, r: any) => sum + Number(r.baseSalary), 0);

    let periodInfo = null;
    if (periodId) {
      const period = await db.payrollPeriod.findUnique({
        where: { id: periodId, companyId },
      });
      if (period) {
        periodInfo = {
          id: period.id,
          name: period.name,
          startDate: period.startDate,
          endDate: period.endDate,
          status: period.status,
        };
      }
    } else if (records.length > 0 && records[0].payrollPeriod) {
      const p = records[0].payrollPeriod;
      periodInfo = {
        id: p.id,
        name: p.name,
        startDate: p.startDate,
        endDate: p.endDate,
      };
    }

    return NextResponse.json({
      period: periodInfo,
      summary: {
        totalEmployees: records.length,
        totalBaseSalary,
        totalGross,
        totalNet,
        totalDeductions,
        totalOvertime,
      },
      items: records.map((r: any) => ({
        employeeCode: r.employee?.employeeCode ?? "-",
        displayName: r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : "-",
        baseSalary: Number(r.baseSalary),
        totalAdditions: Number(r.totalAdditions),
        totalDeductions: Number(r.totalDeductions),
        overtime: Number(r.overtime),
        gross: Number(r.gross),
        net: Number(r.net),
        status: PAYROLL_RECORD_STATUS_LABELS[r.status] || r.status,
      })),
    });
  } catch (error) {
    console.error("GET /api/reports/payroll error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
