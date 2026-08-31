import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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

    if (!periodId) {
      return NextResponse.json({ error: "periodId is required" }, { status: 400 });
    }

    const period = await db.payrollPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      return NextResponse.json({ error: "Payroll period not found" }, { status: 404 });
    }

    const records = await db.payrollRecord.findMany({
      where: { payrollPeriodId: periodId },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        componentsList: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const totalGross = records.reduce((sum: number, r: any) => sum + Number(r.gross), 0);
    const totalNet = records.reduce((sum: number, r: any) => sum + Number(r.net), 0);
    const totalDeductions = records.reduce((sum: number, r: any) => sum + Number(r.totalDeductions) + Number(r.attendanceDeductions), 0);
    const totalOvertime = records.reduce((sum: number, r: any) => sum + Number(r.overtime), 0);
    const totalBaseSalary = records.reduce((sum: number, r: any) => sum + Number(r.baseSalary), 0);

    return NextResponse.json({
      period: {
        id: period.id,
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
        status: period.status,
      },
      summary: {
        totalEmployees: records.length,
        totalBaseSalary,
        totalGross,
        totalNet,
        totalDeductions,
        totalOvertime,
      },
      records: records.map((r: any) => ({
        employee: r.employee,
        baseSalary: Number(r.baseSalary),
        totalAdditions: Number(r.totalAdditions),
        totalDeductions: Number(r.totalDeductions),
        attendanceDeductions: Number(r.attendanceDeductions),
        overtime: Number(r.overtime),
        gross: Number(r.gross),
        net: Number(r.net),
        status: r.status,
        components: r.componentsList,
      })),
    });
  } catch (error) {
    console.error("GET /api/reports/payroll error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
