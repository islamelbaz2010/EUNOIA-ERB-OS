import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authorization";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(["ADMIN", "HR"]);
    if (authResult.error) return authResult.error;
    const session = authResult.session;

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const { id } = await params;

    const component = await db.salaryComponent.findUnique({
      where: { id },
      include: { salaryProfile: { include: { employee: true } } },
    });

    if (!component || component.salaryProfile.employee.companyId !== companyId) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }

    await db.salaryComponent.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "DELETE",
        entity: "SalaryComponent",
        entityId: id,
        before: component as any,
      },
    });

    return NextResponse.json({ message: "Component deleted" });
  } catch (error) {
    console.error("DELETE /api/salary-components/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
