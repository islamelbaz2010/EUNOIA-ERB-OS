import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: (session.user as any).id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        employeeId: true,
      },
    });

    let employee = null;
    if (user?.employeeId) {
      employee = await db.employee.findUnique({
        where: { id: user.employeeId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeCode: true,
          jobTitle: true,
          branch: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ ...user, employee });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
