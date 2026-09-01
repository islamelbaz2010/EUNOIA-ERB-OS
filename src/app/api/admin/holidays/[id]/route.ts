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

    const holiday = await db.holiday.findFirst({
      where: { id, companyId },
    });
    if (!holiday) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }

    await db.holiday.delete({ where: { id, companyId } });

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "DELETE",
        entity: "Holiday",
        entityId: id,
        before: holiday as any,
      },
    });

    return NextResponse.json({ message: "Holiday deleted" });
  } catch (error) {
    console.error("DELETE /api/admin/holidays/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
