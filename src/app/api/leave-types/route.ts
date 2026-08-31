import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createLeaveTypeSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  defaultDays: z.number().int().min(0).optional(),
  isPaid: z.boolean().optional(),
  affectsPayroll: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
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

    const leaveTypes = await db.leaveType.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(leaveTypes);
  } catch (error) {
    console.error("GET /api/leave-types error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = createLeaveTypeSchema.parse(body);

    const leaveType = await db.leaveType.create({
      data: {
        companyId,
        name: validatedData.name,
        nameAr: validatedData.nameAr,
        defaultDays: validatedData.defaultDays ?? 0,
        isPaid: validatedData.isPaid ?? true,
        affectsPayroll: validatedData.affectsPayroll ?? true,
        requiresApproval: validatedData.requiresApproval ?? true,
      },
    });

    return NextResponse.json(leaveType, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    console.error("POST /api/leave-types error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
