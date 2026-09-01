import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authorization";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(["ADMIN"]);
    if (authResult.error) return authResult.error;
    const session = authResult.session;

    const { id } = await params;

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const leaveType = await db.leaveType.findFirst({
      where: { id, companyId },
    });
    if (!leaveType) {
      return NextResponse.json({ error: "Leave type not found" }, { status: 404 });
    }

    await db.leaveType.delete({ where: { id, companyId } });

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "DELETE",
        entity: "LeaveType",
        entityId: id,
        before: leaveType as any,
      },
    });

    return NextResponse.json({ message: "Leave type deleted" });
  } catch (error) {
    console.error("DELETE /api/admin/leave-types/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
