import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { formatZodError } from "@/lib/validation";
import { requireRole } from "@/lib/authorization";

const createLeaveSchema = z.object({
  employeeId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  totalDays: z.number().int().positive(),
  reason: z.string().min(1),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(["ADMIN", "HR", "MANAGER"]);
    if (authResult.error) return authResult.error;
    const session = authResult.session;

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const employeeId = searchParams.get("employeeId") || undefined;
    const status = searchParams.get("status") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const where: any = { employee: { companyId } };
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }

    const [requests, total] = await Promise.all([
      db.leaveRequest.findMany({
        where,
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          leaveType: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      db.leaveRequest.count({ where }),
    ]);

    return NextResponse.json({
      requests,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("GET /api/leave error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
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
    const validatedData = createLeaveSchema.parse(body);

    // Verify employee belongs to the company
    const employee = await db.employee.findUnique({
      where: { id: validatedData.employeeId, companyId },
    });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const leaveRequest = await db.leaveRequest.create({
      data: {
        employeeId: validatedData.employeeId,
        leaveTypeId: validatedData.leaveTypeId,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        totalDays: validatedData.totalDays,
        reason: validatedData.reason,
        notes: validatedData.notes,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        leaveType: true,
      },
    });

    return NextResponse.json(leaveRequest, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(error), details: error.issues }, { status: 400 });
    }
    console.error("POST /api/leave error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
