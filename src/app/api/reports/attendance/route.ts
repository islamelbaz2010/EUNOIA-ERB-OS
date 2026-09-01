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
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const employeeId = searchParams.get("employeeId") || undefined;
    const status = searchParams.get("status") || undefined;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where: any = {
      employee: { companyId },
    };
    if (Object.keys(dateFilter).length > 0) where.date = dateFilter;
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    const records = await db.attendanceDay.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      },
      orderBy: [{ employeeId: "asc" }, { date: "asc" }],
    });

    const employeeMap: Record<string, any> = {};

    for (const record of records) {
      const empId = record.employeeId;
      if (!employeeMap[empId]) {
        employeeMap[empId] = {
          employee: record.employee,
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          leaveDays: 0,
          holidayDays: 0,
          halfDays: 0,
          totalLateMinutes: 0,
          totalOvertimeMinutes: 0,
          totalWorkMinutes: 0,
        };
      }

      const emp = employeeMap[empId];
      emp.totalDays++;
      emp.totalLateMinutes += record.lateMinutes;
      emp.totalOvertimeMinutes += record.overtimeMinutes;
      emp.totalWorkMinutes += record.workMinutes;

      switch (record.status) {
        case "PRESENT":
          emp.presentDays++;
          break;
        case "ABSENT":
          emp.absentDays++;
          break;
        case "LEAVE":
          emp.leaveDays++;
          break;
        case "HOLIDAY":
          emp.holidayDays++;
          break;
        case "HALF_DAY":
          emp.halfDays++;
          break;
      }
    }

    const summaryRows = Object.values(employeeMap);
    const totalPresent = summaryRows.reduce((sum, e) => sum + e.presentDays, 0);
    const totalAbsent = summaryRows.reduce((sum, e) => sum + e.absentDays, 0);
    const totalLate = summaryRows.reduce((sum, e) => sum + e.totalLateMinutes, 0);
    const totalOvertime = summaryRows.reduce((sum, e) => sum + e.totalOvertimeMinutes, 0);

    const items = summaryRows.map((e: any) => ({
      employeeCode: e.employee?.employeeCode ?? "-",
      displayName: e.employee ? `${e.employee.firstName} ${e.employee.lastName}` : "-",
      presentDays: e.presentDays,
      absentDays: e.absentDays,
      leaveDays: e.leaveDays,
      lateMinutes: e.totalLateMinutes,
      overtimeMinutes: e.totalOvertimeMinutes,
      workHours: Math.round((e.totalWorkMinutes / 60) * 10) / 10,
    }));

    return NextResponse.json({
      summary: {
        totalEmployees: summaryRows.length,
        totalPresent,
        totalAbsent,
        totalLate,
        totalOvertime,
        averageAttendance:
          summaryRows.length > 0 ? ((totalPresent / (summaryRows.length * (summaryRows[0]?.totalDays || 1))) * 100).toFixed(1) : 0,
      },
      items,
    });
  } catch (error) {
    console.error("GET /api/reports/attendance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
