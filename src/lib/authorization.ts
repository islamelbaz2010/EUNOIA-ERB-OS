import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

type Role = "ADMIN" | "HR" | "FINANCE" | "MANAGER" | "EMPLOYEE" | "VIEWER";

const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 6,
  FINANCE: 5,
  HR: 4,
  MANAGER: 3,
  EMPLOYEE: 2,
  VIEWER: 1,
};

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}

export async function requireRole(allowedRoles: Role[]) {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const userRole = (session.user as any).role as Role;
  if (!allowedRoles.includes(userRole)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export function hasRole(userRole: string, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole as Role);
}
