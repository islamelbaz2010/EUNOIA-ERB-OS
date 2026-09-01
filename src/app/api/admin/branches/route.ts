import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { formatZodError } from "@/lib/validation";
import { requireRole } from "@/lib/authorization";

const createBranchSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const branches = await db.branch.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(branches);
  } catch (error) {
    console.error("GET /api/admin/branches error:", error);
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
    const validatedData = createBranchSchema.parse(body);

    const branch = await db.branch.create({
      data: {
        companyId,
        name: validatedData.name,
        nameAr: validatedData.nameAr,
        address: validatedData.address,
        city: validatedData.city,
        phone: validatedData.phone,
        isDefault: validatedData.isDefault ?? false,
        isActive: validatedData.isActive ?? true,
      },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(error), details: error.issues }, { status: 400 });
    }
    console.error("POST /api/admin/branches error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
