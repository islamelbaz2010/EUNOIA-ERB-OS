import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Seed only available in development" }, { status: 403 });
    }

    const existingCompany = await db.company.findFirst();
    if (existingCompany) {
      return NextResponse.json({ error: "Database already seeded" }, { status: 400 });
    }

    const company = await db.company.create({
      data: {
        name: "EUNOIA HR Solutions",
        nameAr: "حلولوارتفنياء للموارد البشرية",
        email: "info@eunoia.com",
        phone: "+966500000000",
        address: "123 Business Street",
        city: "Riyadh",
        country: "Saudi Arabia",
        taxNumber: "1234567890",
        vatNumber: "123456789012345",
        vatRate: 15,
        currency: "SAR",
        timezone: "Asia/Riyadh",
      },
    });

    const adminPassword = await bcrypt.hash("admin123", 12);
    const adminUser = await db.user.create({
      data: {
        email: "admin@eunoia.com",
        password: adminPassword,
        name: "Admin User",
        role: "ADMIN",
      },
    });

    const departments = await Promise.all([
      db.department.create({ data: { companyId: company.id, name: "Human Resources", nameAr: "الموارد البشرية" } }),
      db.department.create({ data: { companyId: company.id, name: "Engineering", nameAr: "الهندسة" } }),
      db.department.create({ data: { companyId: company.id, name: "Finance", nameAr: "المالية" } }),
      db.department.create({ data: { companyId: company.id, name: "Marketing", nameAr: "التسويق" } }),
    ]);

    const branch = await db.branch.create({
      data: {
        companyId: company.id,
        name: "Riyadh HQ",
        nameAr: "المقر الرئيسي - الرياض",
        address: "123 Business Street",
        city: "Riyadh",
        phone: "+966500000000",
        isDefault: true,
      },
    });

    const workSchedule = await db.workSchedule.create({
      data: {
        companyId: company.id,
        name: "Standard Working Hours",
        nameAr: "ساعات العمل标准",
        isDefault: true,
        sunday: true,
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: false,
        saturday: false,
        startTime: "08:00",
        endTime: "17:00",
        gracePeriodMinutes: 15,
        overtimeEnabled: true,
        overtimeMinMinutes: 30,
        maxOvertimeMinutes: 180,
      },
    });

    const employees = [];
    const employeeData = [
      { firstName: "Ahmed", lastName: "Al-Rashid", jobTitle: "HR Manager", deptIdx: 0 },
      { firstName: "Fatima", lastName: "Hassan", jobTitle: "Software Engineer", deptIdx: 1 },
      { firstName: "Mohammed", lastName: "Al-Saud", jobTitle: "Finance Director", deptIdx: 2 },
      { firstName: "Sara", lastName: "Ibrahim", jobTitle: "Marketing Specialist", deptIdx: 3 },
      { firstName: "Khalid", lastName: "Nasser", jobTitle: "Senior Developer", deptIdx: 1 },
    ];

    for (let i = 0; i < employeeData.length; i++) {
      const emp = employeeData[i];
      const employee = await db.employee.create({
        data: {
          companyId: company.id,
          branchId: branch.id,
          departmentId: departments[emp.deptIdx].id,
          employeeCode: `EMP${String(i + 1).padStart(4, "0")}`,
          firstName: emp.firstName,
          lastName: emp.lastName,
          displayName: `${emp.firstName} ${emp.lastName}`,
          phone: `+96650${String(1000000 + i).padStart(7, "0")}`,
          email: `${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}@eunoia.com`,
          joinDate: new Date("2024-01-15"),
          jobTitle: emp.jobTitle,
          gender: i % 2 === 0 ? "MALE" : "FEMALE",
          employmentStatus: "ACTIVE",
        },
      });

      const baseSalary = 15000 + i * 3000;
      await db.salaryProfile.create({
        data: {
          employeeId: employee.id,
          baseSalary,
          overtimeRate: 50,
          hourlyRate: Math.round(baseSalary / 30 / 8 * 100) / 100,
          currency: "SAR",
          effectiveFrom: new Date("2024-01-15"),
          components: {
            create: [
              {
                type: "ALLOWANCE",
                name: "Housing Allowance",
                nameAr: "بدل السكن",
                amount: baseSalary * 0.25,
                isRecurring: true,
              },
              {
                type: "ALLOWANCE",
                name: "Transportation Allowance",
                nameAr: "بدل النقل",
                amount: 1000,
                isRecurring: true,
              },
            ],
          },
        },
      });

      employees.push(employee);
    }

    const leaveTypes = await Promise.all([
      db.leaveType.create({
        data: { companyId: company.id, name: "Annual Leave", nameAr: "إجازة سنوية", defaultDays: 21, isPaid: true, affectsPayroll: true },
      }),
      db.leaveType.create({
        data: { companyId: company.id, name: "Sick Leave", nameAr: "إجازة مرضية", defaultDays: 30, isPaid: true, affectsPayroll: false },
      }),
      db.leaveType.create({
        data: { companyId: company.id, name: "Unpaid Leave", nameAr: "إجازة بدون راتب", defaultDays: 0, isPaid: false, affectsPayroll: true },
      }),
    ]);

    const holidays = await Promise.all([
      db.holiday.create({ data: { companyId: company.id, name: "Saudi National Day", nameAr: "اليوم الوطني السعودي", date: new Date("2024-09-23"), isRecurring: true } }),
      db.holiday.create({ data: { companyId: company.id, name: "Founding Day", nameAr: "يوم التأسيس", date: new Date("2024-02-22"), isRecurring: true } }),
    ]);

    const clients = await Promise.all([
      db.client.create({
        data: {
          companyId: company.id,
          name: "TechCorp Saudi",
          contactPerson: "Omar Abdullah",
          phone: "+966511111111",
          email: "omar@techcorp.sa",
          city: "Riyadh",
          country: "Saudi Arabia",
          paymentTerms: 30,
        },
      }),
      db.client.create({
        data: {
          companyId: company.id,
          name: "Green Valley Trading",
          contactPerson: "Layla Mansour",
          phone: "+966522222222",
          email: "layla@greenvalley.sa",
          city: "Jeddah",
          country: "Saudi Arabia",
          paymentTerms: 15,
        },
      }),
    ]);

    return NextResponse.json({
      message: "Demo data seeded successfully",
      data: {
        company: { id: company.id, name: company.name },
        admin: { email: "admin@eunoia.com", password: "admin123" },
        departments: departments.length,
        branch: { id: branch.id, name: branch.name },
        workSchedule: { id: workSchedule.id, name: workSchedule.name },
        employees: employees.length,
        leaveTypes: leaveTypes.length,
        holidays: holidays.length,
        clients: clients.length,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/seed error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
