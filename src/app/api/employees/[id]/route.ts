import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { formatZodError } from "@/lib/validation";
import { requireRole } from "@/lib/authorization";

const updateEmployeeSchema = z.object({
  branchId: z.string().uuid().optional().or(z.literal("")),
  departmentId: z.string().uuid().optional().or(z.literal("")),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  firstNameAr: z.string().optional(),
  lastNameAr: z.string().optional(),
  displayName: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  nationalId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional().or(z.literal("")),
  maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]).optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  governorate: z.string().optional(),
  joinDate: z.string().optional(),
  jobTitle: z.string().optional(),
  fingerprintId: z.string().optional(),
  notes: z.string().optional(),
  employmentStatus: z.enum(["ACTIVE", "ON_LEAVE", "TERMINATED", "SUSPENDED"]).optional(),
  endDate: z.string().optional(),
  salary: z
    .object({
      baseSalary: z.number().positive(),
      overtimeRate: z.number().min(0).optional(),
      hourlyRate: z.number().min(0).optional(),
      currency: z.string().optional(),
    })
    .optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const { id } = await params;

    const employee = await db.employee.findUnique({
      where: { id, companyId },
      include: {
        branch: true,
        department: true,
        salaryProfiles: {
          include: { components: true },
          orderBy: { effectiveFrom: "desc" },
        },
        scheduleAssignments: {
          include: { schedule: true },
        },
        attendanceDays: {
          orderBy: { date: "desc" },
          take: 30,
        },
        leaveRequests: {
          include: { leaveType: true },
          orderBy: { createdAt: "desc" },
        },
        payrollRecords: {
          include: { payrollPeriod: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("GET /api/employees/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
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
    const body = await request.json();
    const validatedData = updateEmployeeSchema.parse(body);

    const existingEmployee = await db.employee.findUnique({
      where: { id, companyId },
      include: {
        salaryProfiles: {
          where: { effectiveTo: null },
          take: 1,
          orderBy: { effectiveFrom: "desc" },
          include: { components: true },
        },
      },
    });

    if (!existingEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const { salary, ...employeeData } = validatedData;

    const updateData: any = { ...employeeData };

    if (updateData.email === "") updateData.email = null;
    if (updateData.gender === "") updateData.gender = null;
    if (updateData.maritalStatus === "") updateData.maritalStatus = null;
    if (updateData.branchId === "") updateData.branchId = null;
    if (updateData.departmentId === "") updateData.departmentId = null;
    if (updateData.dateOfBirth === "") {
      updateData.dateOfBirth = null;
    } else if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    if (updateData.joinDate === "") {
      updateData.joinDate = null;
    } else if (updateData.joinDate) {
      updateData.joinDate = new Date(updateData.joinDate);
    }
    if (updateData.endDate === "") {
      updateData.endDate = null;
    } else if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    const employee = await db.employee.update({
      where: { id },
      data: updateData,
    });

    if (salary && existingEmployee.salaryProfiles.length > 0) {
      const currentProfile = existingEmployee.salaryProfiles[0];
      const needsNewProfile =
        Number(currentProfile.baseSalary) !== salary.baseSalary ||
        (salary.overtimeRate !== undefined && Number(currentProfile.overtimeRate) !== salary.overtimeRate) ||
        (salary.hourlyRate !== undefined && Number(currentProfile.hourlyRate) !== salary.hourlyRate);

      if (needsNewProfile) {
        await db.salaryProfile.update({
          where: { id: currentProfile.id },
          data: { effectiveTo: new Date() },
        });

        await db.salaryProfile.create({
          data: {
            employeeId: id,
            baseSalary: salary.baseSalary,
            overtimeRate: salary.overtimeRate || currentProfile.overtimeRate,
            hourlyRate: salary.hourlyRate || currentProfile.hourlyRate,
            currency: salary.currency || currentProfile.currency,
            effectiveFrom: new Date(),
            components: {
              create: currentProfile.components.map((c: any) => ({
                type: c.type,
                name: c.name,
                nameAr: c.nameAr,
                amount: c.amount,
                isPercentage: c.isPercentage,
                percentageOf: c.percentageOf,
                isRecurring: c.isRecurring,
                isActive: c.isActive,
                notes: c.notes,
              })),
            },
          },
        });
      }
    } else if (salary) {
      await db.salaryProfile.create({
        data: {
          employeeId: id,
          baseSalary: salary.baseSalary,
          overtimeRate: salary.overtimeRate || 0,
          hourlyRate: salary.hourlyRate || 0,
          currency: salary.currency || "EGP",
          effectiveFrom: new Date(),
        },
      });
    }

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "UPDATE",
        entity: "Employee",
        entityId: id,
        before: existingEmployee as any,
        after: employee as any,
      },
    });

    return NextResponse.json(employee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(error), details: error.issues }, { status: 400 });
    }
    console.error("PUT /api/employees/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    const employee = await db.employee.findUnique({
      where: { id, companyId },
      include: {
        _count: {
          select: {
            attendancePunches: true,
            attendanceDays: true,
            leaveRequests: true,
            payrollRecords: true,
            payslips: true,
            salaryProfiles: true,
            scheduleAssignments: true,
          },
        },
      },
    });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const protectedReasons: string[] = [];
    const counts = employee._count;
    if (counts.attendancePunches > 0) protectedReasons.push(`${counts.attendancePunches} attendance punch record(s)`);
    if (counts.attendanceDays > 0) protectedReasons.push(`${counts.attendanceDays} attendance day(s)`);
    if (counts.leaveRequests > 0) protectedReasons.push(`${counts.leaveRequests} leave request(s)`);
    if (counts.payrollRecords > 0) protectedReasons.push(`${counts.payrollRecords} payroll record(s)`);
    if (counts.payslips > 0) protectedReasons.push(`${counts.payslips} payslip(s)`);
    if (counts.salaryProfiles > 0) protectedReasons.push(`${counts.salaryProfiles} salary profile(s)`);
    if (counts.scheduleAssignments > 0) protectedReasons.push(`${counts.scheduleAssignments} schedule assignment(s)`);

    if (protectedReasons.length > 0) {
      return NextResponse.json(
        {
          error: "Employee has linked historical records and cannot be permanently deleted",
          reasons: protectedReasons,
        },
        { status: 400 }
      );
    }

    // Clear the employee link from any user before deletion so the foreign key doesn't block.
    await db.user.updateMany({
      where: { employeeId: id },
      data: { employeeId: null },
    });

    await db.employee.delete({
      where: { id, companyId },
    });

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "DELETE",
        entity: "Employee",
        entityId: id,
        before: employee as any,
      },
    });

    return NextResponse.json({ message: "Employee deleted permanently" });
  } catch (error) {
    console.error("DELETE /api/employees/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
