import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";

const updateExceptionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(["ADMIN", "HR", "MANAGER"]);
    if (authResult.error) return authResult.error;
    const session = authResult.session;

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateExceptionSchema.parse(body);

    const exception = await db.attendanceException.findFirst({
      where: { id, employee: { companyId } },
    });
    if (!exception) {
      return NextResponse.json({ error: "Exception not found" }, { status: 404 });
    }

    if (exception.status !== "PENDING") {
      return NextResponse.json({ error: "Exception already processed" }, { status: 400 });
    }

    const updated = await db.attendanceException.update({
      where: { id },
      data: {
        status: validatedData.status,
        approvedById: (session.user as any).id,
        approvedAt: new Date(),
        notes: validatedData.notes || exception.notes,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (validatedData.status === "APPROVED" && exception.affectsAttendance) {
      const dateOnly = new Date(exception.date);
      dateOnly.setHours(0, 0, 0, 0);

      const existingDay = await db.attendanceDay.findUnique({
        where: { employeeId_date: { employeeId: exception.employeeId, date: dateOnly } },
      });

      if (existingDay) {
        await db.attendanceDay.update({
          where: { id: existingDay.id },
          data: { hasException: true, exceptionId: id },
        });
      } else {
        await db.attendanceDay.create({
          data: {
            employeeId: exception.employeeId,
            date: dateOnly,
            scheduledStart: "10:30",
            scheduledEnd: "18:30",
            status: "EXCEPTION",
            hasException: true,
            exceptionId: id,
          },
        });
      }
    }

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: validatedData.status,
        entity: "AttendanceException",
        entityId: id,
        before: exception as any,
        after: updated as any,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    console.error("PUT /api/attendance/exceptions/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
