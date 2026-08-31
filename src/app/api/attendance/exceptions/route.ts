import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createExceptionSchema = z.object({
  employeeId: z.string().uuid(),
  date: z.string().datetime(),
  type: z.enum([
    "LATE_ARRIVAL",
    "EARLY_DEPARTURE",
    "BUSINESS_TRIP",
    "WORK_FROM_HOME",
    "MISSED_FINGERPRINT",
    "FORGOTTEN_PUNCH",
    "APPROVED_ABSENCE",
    "SPECIAL_WORKING_DAY",
    "OVERTIME_APPROVAL",
    "SCHEDULE_OVERRIDE",
    "OTHER",
  ]),
  reason: z.string().min(1),
  notes: z.string().optional(),
  affectsAttendance: z.boolean().optional(),
  affectsPayroll: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const employeeId = searchParams.get("employeeId") || undefined;
    const status = searchParams.get("status") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [exceptions, total] = await Promise.all([
      db.attendanceException.findMany({
        where,
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      db.attendanceException.count({ where }),
    ]);

    return NextResponse.json({
      exceptions,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("GET /api/attendance/exceptions error:", error);
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
    const validatedData = createExceptionSchema.parse(body);

    const exception = await db.attendanceException.create({
      data: {
        employeeId: validatedData.employeeId,
        date: new Date(validatedData.date),
        type: validatedData.type,
        reason: validatedData.reason,
        notes: validatedData.notes,
        submittedById: (session.user as any).id,
        affectsAttendance: validatedData.affectsAttendance ?? true,
        affectsPayroll: validatedData.affectsPayroll ?? true,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(exception, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    console.error("POST /api/attendance/exceptions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
