import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createAttendanceDaySchema = z.object({
  employeeId: z.string().uuid(),
  date: z.string().datetime(),
  status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE", "HOLIDAY", "REST_DAY", "EXCEPTION"]).optional(),
  firstIn: z.string().datetime().optional(),
  lastOut: z.string().datetime().optional(),
  workMinutes: z.number().min(0).optional(),
  overtimeMinutes: z.number().min(0).optional(),
  lateMinutes: z.number().min(0).optional(),
  earlyDepartureMinutes: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");
    const employeeId = searchParams.get("employeeId") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const status = searchParams.get("status") || undefined;

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [records, total] = await Promise.all([
      db.attendanceDay.findMany({
        where,
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { date: "desc" },
      }),
      db.attendanceDay.count({ where }),
    ]);

    return NextResponse.json({
      records,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("GET /api/attendance/records error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createAttendanceDaySchema.parse(body);

    const dateOnly = new Date(validatedData.date);
    dateOnly.setHours(0, 0, 0, 0);

    const existing = await db.attendanceDay.findUnique({
      where: { employeeId_date: { employeeId: validatedData.employeeId, date: dateOnly } },
    });

    let record;
    if (existing) {
      record = await db.attendanceDay.update({
        where: { id: existing.id },
        data: {
          status: validatedData.status || existing.status,
          firstIn: validatedData.firstIn ? new Date(validatedData.firstIn) : existing.firstIn,
          lastOut: validatedData.lastOut ? new Date(validatedData.lastOut) : existing.lastOut,
          workMinutes: validatedData.workMinutes ?? existing.workMinutes,
          overtimeMinutes: validatedData.overtimeMinutes ?? existing.overtimeMinutes,
          lateMinutes: validatedData.lateMinutes ?? existing.lateMinutes,
          earlyDepartureMinutes: validatedData.earlyDepartureMinutes ?? existing.earlyDepartureMinutes,
          notes: validatedData.notes || existing.notes,
        },
      });
    } else {
      record = await db.attendanceDay.create({
        data: {
          employeeId: validatedData.employeeId,
          date: dateOnly,
          scheduledStart: "08:00",
          scheduledEnd: "17:00",
          firstIn: validatedData.firstIn ? new Date(validatedData.firstIn) : undefined,
          lastOut: validatedData.lastOut ? new Date(validatedData.lastOut) : undefined,
          status: validatedData.status || "PRESENT",
          workMinutes: validatedData.workMinutes || 0,
          overtimeMinutes: validatedData.overtimeMinutes || 0,
          lateMinutes: validatedData.lateMinutes || 0,
          earlyDepartureMinutes: validatedData.earlyDepartureMinutes || 0,
          notes: validatedData.notes,
        },
      });
    }

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: existing ? "UPDATE" : "CREATE",
        entity: "AttendanceDay",
        entityId: record.id,
        after: record as any,
      },
    });

    return NextResponse.json(record, { status: existing ? 200 : 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    console.error("POST /api/attendance/records error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
