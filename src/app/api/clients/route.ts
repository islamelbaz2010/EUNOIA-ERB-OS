import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createClientSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPersonAr: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  taxNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  paymentTerms: z.number().int().min(0).optional(),
  notes: z.string().optional(),
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
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || "";

    const where: any = { companyId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [clients, total] = await Promise.all([
      db.client.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      db.client.count({ where }),
    ]);

    return NextResponse.json({
      clients,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("GET /api/clients error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = createClientSchema.parse(body);

    const client = await db.client.create({
      data: {
        companyId,
        name: validatedData.name,
        nameAr: validatedData.nameAr,
        contactPerson: validatedData.contactPerson,
        phone: validatedData.phone,
        email: validatedData.email,
        address: validatedData.address,
        city: validatedData.city,
        country: validatedData.country,
        taxNumber: validatedData.taxNumber,
        vatNumber: validatedData.vatNumber,
        paymentTerms: validatedData.paymentTerms ?? 30,
        notes: validatedData.notes,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    console.error("POST /api/clients error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
