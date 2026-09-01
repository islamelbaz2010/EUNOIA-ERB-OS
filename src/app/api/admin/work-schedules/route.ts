import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { formatZodError } from "@/lib/validation";
import { requireRole } from "@/lib/authorization";

const createScheduleSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  isDefault: z.boolean().optional(),
  sunday: z.boolean().optional(),
  monday: z.boolean().optional(),
  tuesday: z.boolean().optional(),
  wednesday: z.boolean().optional(),
  thursday: z.boolean().optional(),
  friday: z.boolean().optional(),
  saturday: z.boolean().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  gracePeriodMinutes: z.number().int().min(0).optional(),
  overtimeEnabled: z.boolean().optional(),
  overtimeMinMinutes: z.number().int().min(0).optional(),
  maxOvertimeMinutes: z.number().int().min(0).optional(),
});

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

    const schedules = await db.workSchedule.findMany({
      where: { companyId },
      include: { assignments: { include: { employee: { select: { id: true, firstName: true, lastName: true } } } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("GET /api/admin/work-schedules error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(["ADMIN"]);
    if (authResult.error) return authResult.error;
    const session = authResult.session;

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = createScheduleSchema.parse(body);

    if (validatedData.isDefault) {
      await db.workSchedule.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const schedule = await db.workSchedule.create({
      data: {
        companyId,
        name: validatedData.name,
        nameAr: validatedData.nameAr,
        isDefault: validatedData.isDefault ?? false,
        sunday: validatedData.sunday ?? true,
        monday: validatedData.monday ?? true,
        tuesday: validatedData.tuesday ?? true,
        wednesday: validatedData.wednesday ?? true,
        thursday: validatedData.thursday ?? true,
        friday: validatedData.friday ?? false,
        saturday: validatedData.saturday ?? false,
        startTime: validatedData.startTime ?? "10:30",
        endTime: validatedData.endTime ?? "18:30",
        gracePeriodMinutes: validatedData.gracePeriodMinutes ?? 15,
        overtimeEnabled: validatedData.overtimeEnabled ?? true,
        overtimeMinMinutes: validatedData.overtimeMinMinutes ?? 30,
        maxOvertimeMinutes: validatedData.maxOvertimeMinutes ?? 180,
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(error), details: error.issues }, { status: 400 });
    }
    console.error("POST /api/admin/work-schedules error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
