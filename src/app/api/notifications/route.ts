import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ notifications: [] });
    }

    const logs = await db.auditLog.findMany({
      where: {
        OR: [
          { entity: "Invoice" },
          { entity: "Payment" },
          { entity: "PayrollPeriod" },
          { entity: "Employee" },
          { entity: "Company" },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { name: true } } },
    });

    return NextResponse.json({ notifications: logs });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ notifications: [] });
  }
}
