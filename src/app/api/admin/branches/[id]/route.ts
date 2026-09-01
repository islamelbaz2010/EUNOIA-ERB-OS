import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";

const updateBranchSchema = z.object({
  name: z.string().min(1).optional(),
  nameAr: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(["ADMIN", "HR"]);
    if (authResult.error) return authResult.error;
    const session = authResult.session;

    const companyId = (session.user as any).companyId;

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateBranchSchema.parse(body);

    const branch = await db.branch.findFirst({ where: { id, companyId } });
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const updated = await db.branch.update({ where: { id }, data: validatedData });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    console.error("PUT /api/admin/branches/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(["ADMIN"]);
    if (authResult.error) return authResult.error;
    const session = authResult.session;

    const companyId = (session.user as any).companyId;

    const { id } = await params;

    const branch = await db.branch.findFirst({ where: { id, companyId } });
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    await db.employee.updateMany({ where: { branchId: id }, data: { branchId: null } });
    await db.branch.delete({ where: { id } });

    return NextResponse.json({ message: "Branch deleted" });
  } catch (error) {
    console.error("DELETE /api/admin/branches/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
