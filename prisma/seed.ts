import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  const existingCompany = await prisma.company.findFirst();
  if (existingCompany) {
    console.log("Database already seeded. Skipping.");
    return;
  }

  const company = await prisma.company.create({
    data: {
      name: "EUNOIA",
      nameAr: "يونيويا",
      email: "info@eunoia.com",
      phone: "+201000000000",
      address: "Cairo, Egypt",
      city: "Cairo",
      country: "Egypt",
      taxNumber: "1234567890",
      vatNumber: "123456789012345",
      vatRate: 14,
      currency: "EGP",
      timezone: "Africa/Cairo",
    },
  });
  console.log("Company created:", company.name);

  const adminPassword = await bcrypt.hash("admin123", 12);
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@eunoia.com",
      password: adminPassword,
      name: "Admin User",
      role: "ADMIN",
    },
  });
  console.log("Admin user created:", adminUser.email);

  const departments = await Promise.all([
    prisma.department.create({ data: { companyId: company.id, name: "Human Resources", nameAr: "الموارد البشرية" } }),
    prisma.department.create({ data: { companyId: company.id, name: "Engineering", nameAr: "الهندسة" } }),
    prisma.department.create({ data: { companyId: company.id, name: "Finance", nameAr: "المالية" } }),
    prisma.department.create({ data: { companyId: company.id, name: "Marketing", nameAr: "التسويق" } }),
  ]);
  console.log("Departments created:", departments.length);

  const branch = await prisma.branch.create({
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
  console.log("Branch created:", branch.name);

  const workSchedule = await prisma.workSchedule.create({
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
  console.log("Work schedule created:", workSchedule.name);

  const employeeData = [
    { firstName: "Ahmed", lastName: "Al-Rashid", jobTitle: "HR Manager", deptIdx: 0 },
    { firstName: "Fatima", lastName: "Hassan", jobTitle: "Software Engineer", deptIdx: 1 },
    { firstName: "Mohammed", lastName: "Al-Saud", jobTitle: "Finance Director", deptIdx: 2 },
    { firstName: "Sara", lastName: "Ibrahim", jobTitle: "Marketing Specialist", deptIdx: 3 },
    { firstName: "Khalid", lastName: "Nasser", jobTitle: "Senior Developer", deptIdx: 1 },
  ];

  const employees = [];
  for (let i = 0; i < employeeData.length; i++) {
    const emp = employeeData[i];
    const employee = await prisma.employee.create({
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
    await prisma.salaryProfile.create({
      data: {
        employeeId: employee.id,
        baseSalary,
        overtimeRate: 50,
        hourlyRate: Math.round(baseSalary / 30 / 8 * 100) / 100,
        currency: "EGP",
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
  console.log("Employees created:", employees.length);

  const leaveTypes = await Promise.all([
    prisma.leaveType.create({
      data: { companyId: company.id, name: "Annual Leave", nameAr: "إجازة سنوية", defaultDays: 21, isPaid: true, affectsPayroll: true },
    }),
    prisma.leaveType.create({
      data: { companyId: company.id, name: "Sick Leave", nameAr: "إجازة مرضية", defaultDays: 30, isPaid: true, affectsPayroll: false },
    }),
    prisma.leaveType.create({
      data: { companyId: company.id, name: "Unpaid Leave", nameAr: "إجازة بدون راتب", defaultDays: 0, isPaid: false, affectsPayroll: true },
    }),
  ]);
  console.log("Leave types created:", leaveTypes.length);

  const holidays = await Promise.all([
    prisma.holiday.create({ data: { companyId: company.id, name: "Saudi National Day", nameAr: "اليوم الوطني السعودي", date: new Date("2024-09-23"), isRecurring: true } }),
    prisma.holiday.create({ data: { companyId: company.id, name: "Founding Day", nameAr: "يوم التأسيس", date: new Date("2024-02-22"), isRecurring: true } }),
  ]);
  console.log("Holidays created:", holidays.length);

  const clients = await Promise.all([
    prisma.client.create({
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
    prisma.client.create({
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
  console.log("Clients created:", clients.length);

  console.log("\nSeed completed successfully!");
  console.log("Admin credentials: admin@eunoia.com / admin123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
