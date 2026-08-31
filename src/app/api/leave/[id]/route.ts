import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateLeaveSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateLeaveSchema.parse(body);

    const leaveRequest = await db.leaveRequest.findUnique({
      where: { id },
      include: { leaveType: true },
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    if (leaveRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Leave request already processed" }, { status: 400 });
    }

    const updated = await db.leaveRequest.update({
      where: { id },
      data: {
        status: validatedData.status,
        approvedBy: (session.user as any).id,
        approvedAt: new Date(),
        notes: validatedData.notes || leaveRequest.notes,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        leaveType: true,
      },
    });

    if (validatedData.status === "APPROVED" && leaveRequest.leaveType.affectsPayroll) {
      const startDate = new Date(leaveRequest.startDate);
      const endDate = new Date(leaveRequest.endDate);
      const dates: Date[] = [];
      const current = new Date(startDate);
      while (current <= endDate) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      for (const date of dates) {
        date.setHours(0, 0, 0, 0);
        const existingDay = await db.attendanceDay.findUnique({
          where: { employeeId_date: { employeeId: leaveRequest.employeeId, date } },
        });

        if (existingDay) {
          await db.attendanceDay.update({
            where: { id: existingDay.id },
            data: { status: "LEAVE" },
          });
        } else {
          await db.attendanceDay.create({
            data: {
              employeeId: leaveRequest.employeeId,
              date,
              scheduledStart: "08:00",
              scheduledEnd: "17:00",
              status: "LEAVE",
            },
          });
        }
      }
    }

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: validatedData.status,
        entity: "LeaveRequest",
        entityId: id,
        before: leaveRequest as any,
        after: updated as any,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    console.error("PUT /api/leave/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
