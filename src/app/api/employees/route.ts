import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";

const createEmployeeSchema = z.object({
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  firstNameAr: z.string().optional(),
  lastNameAr: z.string().optional(),
  displayName: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  nationalId: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  joinDate: z.string().datetime(),
  jobTitle: z.string().optional(),
  fingerprintId: z.string().optional(),
  notes: z.string().optional(),
  salary: z
    .object({
      baseSalary: z.number().positive(),
      overtimeRate: z.number().min(0).optional(),
      hourlyRate: z.number().min(0).optional(),
      currency: z.string().optional(),
      components: z
        .array(
          z.object({
            type: z.enum([
              "ALLOWANCE",
              "BONUS",
              "OVERTIME",
              "COMMISSION",
              "DEDUCTION",
              "ADVANCE",
              "PENALTY",
              "REIMBURSEMENT",
              "MANUAL",
            ]),
            name: z.string().min(1),
            nameAr: z.string().optional(),
            amount: z.number(),
            isPercentage: z.boolean().optional(),
            percentageOf: z.string().optional(),
            isRecurring: z.boolean().optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

async function generateEmployeeCode(companyId: string): Promise<string> {
  const count = await db.employee.count({ where: { companyId } });
  const num = count + 1;
  return `EMP${String(num).padStart(4, "0")}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || undefined;
    const branchId = searchParams.get("branchId") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { employeeCode: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.employmentStatus = status;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const [employees, total] = await Promise.all([
      db.employee.findMany({
        where,
        include: {
          branch: true,
          department: true,
          salaryProfiles: {
            where: { effectiveTo: null },
            take: 1,
            orderBy: { effectiveFrom: "desc" },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      db.employee.count({ where }),
    ]);

    return NextResponse.json({
      employees,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("GET /api/employees error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(["ADMIN", "HR", "MANAGER"]);
    if (authResult.error) return authResult.error;
    const session = authResult.session;

    const body = await request.json();
    const validatedData = createEmployeeSchema.parse(body);

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const employeeCode = await generateEmployeeCode(companyId);

    const employee = await db.employee.create({
      data: {
        companyId,
        branchId: validatedData.branchId,
        departmentId: validatedData.departmentId,
        employeeCode,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        firstNameAr: validatedData.firstNameAr,
        lastNameAr: validatedData.lastNameAr,
        displayName: validatedData.displayName,
        phone: validatedData.phone,
        email: validatedData.email,
        nationalId: validatedData.nationalId,
        dateOfBirth: validatedData.dateOfBirth
          ? new Date(validatedData.dateOfBirth)
          : undefined,
        gender: validatedData.gender,
        maritalStatus: validatedData.maritalStatus,
        address: validatedData.address,
        city: validatedData.city,
        joinDate: new Date(validatedData.joinDate),
        jobTitle: validatedData.jobTitle,
        fingerprintId: validatedData.fingerprintId,
        notes: validatedData.notes,
      },
    });

    if (validatedData.salary) {
      const salaryProfile = await db.salaryProfile.create({
        data: {
          employeeId: employee.id,
          baseSalary: validatedData.salary.baseSalary,
          overtimeRate: validatedData.salary.overtimeRate || 0,
          hourlyRate: validatedData.salary.hourlyRate || 0,
          currency: validatedData.salary.currency || "SAR",
          effectiveFrom: new Date(validatedData.joinDate),
          components: validatedData.salary.components
            ? {
                create: validatedData.salary.components.map((c) => ({
                  type: c.type,
                  name: c.name,
                  nameAr: c.nameAr,
                  amount: c.amount,
                  isPercentage: c.isPercentage || false,
                  percentageOf: c.percentageOf,
                  isRecurring: c.isRecurring !== false,
                })),
              }
            : undefined,
        },
      });
    }

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "CREATE",
        entity: "Employee",
        entityId: employee.id,
        after: employee as any,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    console.error("POST /api/employees error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
