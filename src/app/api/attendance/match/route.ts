import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authorization";

const COMPANY_SCHEDULE = {
  start: "10:30",
  end: "18:30",
  graceMinutes: 15,
  workMinutes: 480,
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesDiff(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 60000);
}

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
    const importId = body.importId;

    if (!importId) {
      return NextResponse.json({ error: "importId is required" }, { status: 400 });
    }

    const importRecord = await db.attendanceImport.findFirst({
      where: { id: importId, companyId },
    });

    if (!importRecord) {
      return NextResponse.json({ error: "Import not found" }, { status: 404 });
    }

    const rawRecords = await db.attendanceRawRecord.findMany({
      where: { attendanceImportId: importId, matchStatus: "UNMATCHED" },
      orderBy: { punchTime: "asc" },
    });

    if (rawRecords.length === 0) {
      return NextResponse.json({ message: "No unmatched records to process" });
    }

    const employees = await db.employee.findMany({
      where: { companyId, employmentStatus: "ACTIVE" },
      select: {
        id: true,
        employeeCode: true,
        fingerprintId: true,
        firstName: true,
        lastName: true,
        displayName: true,
      },
    });

    const empByFingerprint = new Map<string, typeof employees[0]>();
    const empByCode = new Map<string, typeof employees[0]>();
    const empByName = new Map<string, typeof employees[0]>();

    for (const emp of employees) {
      if (emp.fingerprintId) empByFingerprint.set(emp.fingerprintId, emp);
      if (emp.employeeCode) empByCode.set(emp.employeeCode.toLowerCase(), emp);
      empByName.set(emp.displayName.toLowerCase(), emp);
    }

    let matched = 0;
    let unmatched = 0;
    const punchData: Array<{
      rawRecordId: string;
      employeeId: string;
      date: Date;
      punchTime: Date;
      punchType: "IN" | "OUT";
    }> = [];

    const unmatchedIds: string[] = [];

    for (const raw of rawRecords) {
      const identifier = raw.employeeIdentifier.trim();
      let employee = null;

      employee = empByFingerprint.get(identifier);
      if (!employee) employee = empByCode.get(identifier.toLowerCase());
      if (!employee) employee = empByName.get(identifier.toLowerCase());

      if (!employee) {
        unmatchedIds.push(raw.id);
        unmatched++;
        continue;
      }

      const punchDate = new Date(raw.punchTime);
      punchDate.setHours(0, 0, 0, 0);

      const existingPunches = await db.attendancePunch.findMany({
        where: {
          employeeId: employee.id,
          date: punchDate,
        },
      });

      const isDuplicate = existingPunches.some(
        (p) => Math.abs(minutesDiff(p.punchTime, raw.punchTime)) < 2
      );

      if (isDuplicate) {
        await db.attendanceRawRecord.update({
          where: { id: raw.id },
          data: { matchStatus: "MATCHED", matchedEmployeeId: employee.id, isDuplicate: true },
        });
        continue;
      }

      const hour = raw.punchTime.getHours();
      const punchType = hour < 14 ? "IN" : "OUT";

      punchData.push({
        rawRecordId: raw.id,
        employeeId: employee.id,
        date: punchDate,
        punchTime: raw.punchTime,
        punchType,
      });

      await db.attendanceRawRecord.update({
        where: { id: raw.id },
        data: { matchStatus: "MATCHED", matchedEmployeeId: employee.id },
      });

      matched++;
    }

    if (punchData.length > 0) {
      for (const punch of punchData) {
        await db.attendancePunch.create({
          data: {
            rawRecordId: punch.rawRecordId,
            employeeId: punch.employeeId,
            date: punch.date,
            punchTime: punch.punchTime,
            punchType: punch.punchType,
          },
        });
      }
    }

    const employeeDates = new Map<string, Set<string>>();
    for (const punch of punchData) {
      const key = punch.employeeId;
      const dateStr = punch.date.toISOString().split("T")[0];
      if (!employeeDates.has(key)) employeeDates.set(key, new Set());
      employeeDates.get(key)!.add(dateStr);
    }

    const scheduleStart = timeToMinutes(COMPANY_SCHEDULE.start);
    const scheduleEnd = timeToMinutes(COMPANY_SCHEDULE.end);

    for (const [empId, dates] of employeeDates) {
      for (const dateStr of dates) {
        const dateOnly = new Date(dateStr + "T00:00:00.000Z");

        const punches = await db.attendancePunch.findMany({
          where: { employeeId: empId, date: dateOnly },
          orderBy: { punchTime: "asc" },
        });

        if (punches.length === 0) continue;

        const firstIn = punches[0].punchTime;
        const lastOut = punches[punches.length - 1].punchTime;

        const firstInMinutes = firstIn.getHours() * 60 + firstIn.getMinutes();
        const lateMinutes = Math.max(0, firstInMinutes - scheduleStart - COMPANY_SCHEDULE.graceMinutes);

        const workMinutes = minutesDiff(firstIn, lastOut);
        const overtimeMinutes = Math.max(0, workMinutes - COMPANY_SCHEDULE.workMinutes);

        const status = "PRESENT";

        const existing = await db.attendanceDay.findUnique({
          where: { employeeId_date: { employeeId: empId, date: dateOnly } },
        });

        if (existing) {
          await db.attendanceDay.update({
            where: { id: existing.id },
            data: {
              firstIn,
              lastOut,
              workMinutes,
              lateMinutes,
              overtimeMinutes,
              status,
            },
          });
        } else {
          await db.attendanceDay.create({
            data: {
              employeeId: empId,
              date: dateOnly,
              scheduledStart: COMPANY_SCHEDULE.start,
              scheduledEnd: COMPANY_SCHEDULE.end,
              firstIn,
              lastOut,
              workMinutes,
              lateMinutes,
              overtimeMinutes,
              status,
            },
          });
        }
      }
    }

    if (unmatchedIds.length > 0) {
      await db.attendanceRawRecord.updateMany({
        where: { id: { in: unmatchedIds } },
        data: { matchStatus: "UNMATCHED" },
      });
    }

    await db.attendanceImport.update({
      where: { id: importId },
      data: { unmatchedRows: unmatched },
    });

    return NextResponse.json({
      matched,
      unmatched,
      totalProcessed: rawRecords.length,
      attendanceDaysCreated: Array.from(employeeDates.values()).reduce((sum, dates) => sum + dates.size, 0),
    });
  } catch (error) {
    console.error("POST /api/attendance/match error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
