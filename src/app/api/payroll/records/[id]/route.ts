import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateRecordSchema = z.object({
  baseSalary: z.number().optional(),
  totalAdditions: z.number().optional(),
  totalDeductions: z.number().optional(),
  attendanceDeductions: z.number().optional(),
  overtime: z.number().optional(),
  gross: z.number().optional(),
  net: z.number().optional(),
  notes: z.string().optional(),
  components: z
    .array(
      z.object({
        type: z.string(),
        name: z.string(),
        nameAr: z.string().optional(),
        amount: z.number(),
        description: z.string().optional(),
      })
    )
    .optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const record = await db.payrollRecord.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        componentsList: true,
        payrollPeriod: true,
      },
    });

    if (!record) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error("GET /api/payroll/records/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const validatedData = updateRecordSchema.parse(body);

    const existing = await db.payrollRecord.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 });
    }

    if (existing.status === "APPROVED" || existing.status === "PAID") {
      return NextResponse.json(
        { error: "Cannot modify approved or paid records" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (validatedData.baseSalary !== undefined) updateData.baseSalary = validatedData.baseSalary;
    if (validatedData.totalAdditions !== undefined) updateData.totalAdditions = validatedData.totalAdditions;
    if (validatedData.totalDeductions !== undefined) updateData.totalDeductions = validatedData.totalDeductions;
    if (validatedData.attendanceDeductions !== undefined) updateData.attendanceDeductions = validatedData.attendanceDeductions;
    if (validatedData.overtime !== undefined) updateData.overtime = validatedData.overtime;
    if (validatedData.gross !== undefined) updateData.gross = validatedData.gross;
    if (validatedData.net !== undefined) updateData.net = validatedData.net;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    const updated = await db.payrollRecord.update({
      where: { id },
      data: updateData,
      include: { componentsList: true },
    });

    if (validatedData.components) {
      await db.payrollComponent.deleteMany({ where: { payrollRecordId: id } });
      await db.payrollComponent.createMany({
        data: validatedData.components.map((c) => ({
          payrollRecordId: id,
          type: c.type as any,
          name: c.name,
          nameAr: c.nameAr,
          amount: c.amount,
          description: c.description,
        })),
      });
    }

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "UPDATE",
        entity: "PayrollRecord",
        entityId: id,
        before: existing as any,
        after: updated as any,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    console.error("PUT /api/payroll/records/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
