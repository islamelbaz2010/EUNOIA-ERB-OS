import { db } from "@/lib/db";

export async function calculateEmployeePayroll(
  employeeId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  baseSalary: number;
  totalAdditions: number;
  totalDeductions: number;
  attendanceDeductions: number;
  overtime: number;
  gross: number;
  net: number;
  components: Array<{
    type: string;
    name: string;
    nameAr?: string;
    amount: number;
    description?: string;
  }>;
  attendanceSummary: {
    totalWorkDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    overtimeDays: number;
    leaveDays: number;
    holidayDays: number;
  };
}> {
  // 1. Get employee's active salary profile
  const salaryProfile = await db.salaryProfile.findFirst({
    where: {
      employeeId,
      effectiveFrom: { lte: endDate },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: startDate } },
      ],
    },
    include: {
      components: {
        where: { isActive: true },
      },
    },
    orderBy: { effectiveFrom: "desc" },
  });

  if (!salaryProfile) {
    throw new Error(`No active salary profile found for employee ${employeeId}`);
  }

  const baseSalaryMonthly = Number(salaryProfile.baseSalary);
  const hourlyRate = Number(salaryProfile.hourlyRate);

  // 2. Get all attendance days in the period
  const attendanceDays = await db.attendanceDay.findMany({
    where: {
      employeeId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "asc" },
  });

  // 3. Count actual work days in the period (for pro-rating)
  const totalDaysInRange = attendanceDays.length;
  const presentDays = attendanceDays.filter((d: { status: string }) => d.status === "PRESENT").length;
  const absentDays = attendanceDays.filter((d: { status: string }) => d.status === "ABSENT").length;
  const lateDays = attendanceDays.filter((d: { lateMinutes: number }) => d.lateMinutes > 0).length;
  const overtimeDays = attendanceDays.filter((d: { overtimeMinutes: number }) => d.overtimeMinutes > 0).length;
  const leaveDays = attendanceDays.filter((d: { status: string }) => d.status === "LEAVE").length;
  const holidayDays = attendanceDays.filter((d: { status: string }) => d.status === "HOLIDAY").length;

  // 4. Pro-rate base salary based on actual days worked
  // Get the employee's effective work schedule for the period
  const scheduleAssignment = await db.scheduleAssignment.findFirst({
    where: {
      employeeId,
      effectiveFrom: { lte: endDate },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: startDate } },
      ],
    },
    include: { schedule: true },
    orderBy: { effectiveFrom: "desc" },
  });

  const schedule = scheduleAssignment?.schedule;
  // JS getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
  const dayFlags: Record<number, boolean> = {
    0: schedule?.sunday ?? true,
    1: schedule?.monday ?? true,
    2: schedule?.tuesday ?? true,
    3: schedule?.wednesday ?? true,
    4: schedule?.thursday ?? true,
    5: schedule?.friday ?? false,
    6: schedule?.saturday ?? false,
  };

  let actualWorkDaysInPeriod = 0;
  const tempDate = new Date(startDate);
  while (tempDate <= endDate) {
    const dayOfWeek = tempDate.getDay();
    if (dayFlags[dayOfWeek]) {
      actualWorkDaysInPeriod++;
    }
    tempDate.setDate(tempDate.getDate() + 1);
  }

  // Base salary pro-rated: (days worked / total work days in period) * monthly salary
  const baseSalary =
    totalDaysInRange > 0
      ? (presentDays / Math.max(actualWorkDaysInPeriod, 1)) * baseSalaryMonthly
      : 0;

  // 5. Calculate attendance deductions
  const scheduledWorkMinutes = attendanceDays.length > 0
    ? (() => {
        const firstDay = attendanceDays[0];
        const startMinutes = firstDay.scheduledStart
          .split(":")
          .reduce((acc, val) => acc * 60 + parseInt(val), 0);
        const endMinutes = firstDay.scheduledEnd
          .split(":")
          .reduce((acc, val) => acc * 60 + parseInt(val), 0);
        return endMinutes - startMinutes;
      })()
    : 480; // Default 8 hours

  const dailySalary = actualWorkDaysInPeriod > 0
    ? baseSalaryMonthly / actualWorkDaysInPeriod
    : 0;

  let attendanceDeductions = 0;

  // Late deductions
  for (const day of attendanceDays) {
    if (day.lateMinutes > 0) {
      const lateDeduction =
        (day.lateMinutes / scheduledWorkMinutes) * dailySalary;
      attendanceDeductions += lateDeduction;
    }
  }

  // Absence deductions
  for (const day of attendanceDays) {
    if (day.status === "ABSENT") {
      attendanceDeductions += dailySalary;
    }
  }

  // 6. Calculate overtime
  let overtime = 0;
  const overtimeMultiplier = 1.5;
  for (const day of attendanceDays) {
    if (day.overtimeMinutes > 0) {
      overtime +=
        day.overtimeMinutes * (hourlyRate / 60) * overtimeMultiplier;
    }
  }

  // 7. Add recurring salary components (additions)
  let totalAdditions = 0;
  const components: Array<{
    type: string;
    name: string;
    nameAr?: string;
    amount: number;
    description?: string;
  }> = [];

  // Base salary component
  components.push({
    type: "BASE_SALARY",
    name: "Base Salary",
    amount: Math.round(baseSalary * 100) / 100,
    description: "Pro-rated base salary for the period",
  });

  // Overtime component
  if (overtime > 0) {
    components.push({
      type: "OVERTIME",
      name: "Overtime",
      amount: Math.round(overtime * 100) / 100,
      description: "Overtime pay at 1.5x hourly rate",
    });
    totalAdditions += overtime;
  }

  // Recurring additions (allowances, bonuses, etc.)
  for (const comp of salaryProfile.components) {
    if (!comp.isRecurring) continue;

    const amount = Number(comp.amount);
    let componentAmount = amount;

    // If it's a percentage, calculate based on base salary
    if (comp.isPercentage && comp.percentageOf) {
      const baseComp = components.find((c) => c.type === comp.percentageOf);
      if (baseComp) {
        componentAmount = (baseComp.amount * amount) / 100;
      }
    }

    if (
      comp.type === "ALLOWANCE" ||
      comp.type === "BONUS" ||
      comp.type === "COMMISSION" ||
      comp.type === "REIMBURSEMENT"
    ) {
      totalAdditions += componentAmount;
      components.push({
        type: comp.type,
        name: comp.name,
        nameAr: comp.nameAr ?? undefined,
        amount: Math.round(componentAmount * 100) / 100,
      });
    }
  }

  // 8. Deduct recurring deductions
  let totalDeductions = 0;
  for (const comp of salaryProfile.components) {
    if (!comp.isRecurring) continue;

    const amount = Number(comp.amount);
    let componentAmount = amount;

    if (comp.isPercentage && comp.percentageOf) {
      const baseComp = components.find((c) => c.type === comp.percentageOf);
      if (baseComp) {
        componentAmount = (baseComp.amount * amount) / 100;
      }
    }

    if (
      comp.type === "DEDUCTION" ||
      comp.type === "ADVANCE" ||
      comp.type === "PENALTY"
    ) {
      totalDeductions += componentAmount;
      components.push({
        type: comp.type,
        name: comp.name,
        nameAr: comp.nameAr ?? undefined,
        amount: Math.round(componentAmount * 100) / 100,
        description: comp.notes ?? undefined,
      });
    }
  }

  // 9. Apply unpaid leave deductions
  for (const day of attendanceDays) {
    if (day.status === "LEAVE") {
      const leaveRequest = await db.leaveRequest.findFirst({
        where: {
          employeeId,
          startDate: { lte: day.date },
          endDate: { gte: day.date },
          status: "APPROVED",
        },
        include: { leaveType: true },
      });

      if (leaveRequest && !leaveRequest.leaveType.isPaid) {
        const unpaidDeduction = dailySalary;
        totalDeductions += unpaidDeduction;
        attendanceDeductions += unpaidDeduction;
        components.push({
          type: "UNPAID_LEAVE",
          name: `Unpaid Leave - ${leaveRequest.leaveType.name}`,
          nameAr: leaveRequest.leaveType.nameAr ?? undefined,
          amount: Math.round(unpaidDeduction * 100) / 100,
          description: `Unpaid leave on ${day.date.toISOString().split("T")[0]}`,
        });
      }
    }
  }

  // 10. Calculate gross and net
  const gross = baseSalary + totalAdditions - attendanceDeductions;
  const net = gross - totalDeductions;

  return {
    baseSalary: Math.round(baseSalary * 100) / 100,
    totalAdditions: Math.round(totalAdditions * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    attendanceDeductions: Math.round(attendanceDeductions * 100) / 100,
    overtime: Math.round(overtime * 100) / 100,
    gross: Math.round(gross * 100) / 100,
    net: Math.round(net * 100) / 100,
    components,
    attendanceSummary: {
      totalWorkDays: totalDaysInRange,
      presentDays,
      absentDays,
      lateDays,
      overtimeDays,
      leaveDays,
      holidayDays,
    },
  };
}

export async function calculatePeriodPayroll(
  periodId: string
): Promise<{
  totalEmployees: number;
  totalGross: number;
  totalNet: number;
}> {
  const period = await db.payrollPeriod.findUnique({
    where: { id: periodId },
  });

  if (!period) {
    throw new Error(`Payroll period ${periodId} not found`);
  }

  if (period.status !== "DRAFT" && period.status !== "CALCULATED") {
    throw new Error(`Payroll period ${periodId} is not in a calculable state`);
  }

  // Get all active employees
  const employees = await db.employee.findMany({
    where: {
      companyId: period.companyId,
      employmentStatus: "ACTIVE",
    },
    select: { id: true },
  });

  let totalGross = 0;
  let totalNet = 0;
  let processedCount = 0;

  for (const employee of employees) {
    try {
      const result = await calculateEmployeePayroll(
        employee.id,
        period.startDate,
        period.endDate
      );

      // Upsert payroll record
      const record = await db.payrollRecord.upsert({
        where: {
          payrollPeriodId_employeeId: {
            payrollPeriodId: periodId,
            employeeId: employee.id,
          },
        },
        create: {
          payrollPeriodId: periodId,
          employeeId: employee.id,
          baseSalary: result.baseSalary,
          totalAdditions: result.totalAdditions,
          totalDeductions: result.totalDeductions,
          attendanceDeductions: result.attendanceDeductions,
          overtime: result.overtime,
          gross: result.gross,
          net: result.net,
          status: "CALCULATED",
          components: result.components,
          attendanceSummary: result.attendanceSummary,
        },
        update: {
          baseSalary: result.baseSalary,
          totalAdditions: result.totalAdditions,
          totalDeductions: result.totalDeductions,
          attendanceDeductions: result.attendanceDeductions,
          overtime: result.overtime,
          gross: result.gross,
          net: result.net,
          status: "CALCULATED",
          components: result.components,
          attendanceSummary: result.attendanceSummary,
        },
      });

      // Delete existing components and recreate
      await db.payrollComponent.deleteMany({
        where: { payrollRecordId: record.id },
      });

      await db.payrollComponent.createMany({
        data: result.components.map((c) => ({
          payrollRecordId: record.id,
          type: c.type as "BASE_SALARY",
          name: c.name,
          nameAr: c.nameAr,
          amount: c.amount,
          description: c.description,
        })),
      });

      totalGross += result.gross;
      totalNet += result.net;
      processedCount++;
    } catch {
      // Skip employees without salary profiles
      continue;
    }
  }

  // Update period totals
  await db.payrollPeriod.update({
    where: { id: periodId },
    data: {
      status: "CALCULATED",
      totalEmployees: processedCount,
      totalGross,
      totalNet,
      calculatedAt: new Date(),
    },
  });

  return {
    totalEmployees: processedCount,
    totalGross: Math.round(totalGross * 100) / 100,
    totalNet: Math.round(totalNet * 100) / 100,
  };
}

export async function getEffectiveSalary(
  employeeId: string,
  date: Date
) {
  const salaryProfile = await db.salaryProfile.findFirst({
    where: {
      employeeId,
      effectiveFrom: { lte: date },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: date } },
      ],
    },
    include: {
      components: {
        where: { isActive: true },
      },
    },
    orderBy: { effectiveFrom: "desc" },
  });

  return salaryProfile;
}

function calculateDailySalary(
  monthlySalary: number,
  workDaysInMonth: number
): number {
  if (workDaysInMonth <= 0) return 0;
  return monthlySalary / workDaysInMonth;
}

function calculateLateDeduction(
  lateMinutes: number,
  dailySalary: number,
  scheduledWorkMinutes: number
): number {
  if (lateMinutes <= 0 || scheduledWorkMinutes <= 0) return 0;
  return (lateMinutes / scheduledWorkMinutes) * dailySalary;
}

function calculateAbsenceDeduction(dailySalary: number): number {
  return dailySalary;
}
