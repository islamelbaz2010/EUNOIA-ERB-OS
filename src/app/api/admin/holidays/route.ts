import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { formatZodError } from "@/lib/validation";
import { requireRole } from "@/lib/authorization";

const createHolidaySchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  date: z.string().datetime(),
  isRecurring: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    const where: any = { companyId };
    if (year) {
      const startOfYear = new Date(parseInt(year), 0, 1);
      const endOfYear = new Date(parseInt(year), 11, 31);
      where.date = { gte: startOfYear, lte: endOfYear };
    }

    const holidays = await db.holiday.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return NextResponse.json(holidays);
  } catch (error) {
    console.error("GET /api/admin/holidays error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(["ADMIN"]);
    if (authResult.error) return authResult.error;
    const session = authResult.session;

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = createHolidaySchema.parse(body);

    const holiday = await db.holiday.create({
      data: {
        companyId,
        name: validatedData.name,
        nameAr: validatedData.nameAr,
        date: new Date(validatedData.date),
        isRecurring: validatedData.isRecurring ?? false,
      },
    });

    return NextResponse.json(holiday, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(error), details: error.issues }, { status: 400 });
    }
    console.error("POST /api/admin/holidays error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
