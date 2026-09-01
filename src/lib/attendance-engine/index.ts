import { db } from "@/lib/db";
import { timeToMinutes, minutesToTime } from "@/lib/utils";

export async function getEffectiveSchedule(
  employeeId: string,
  date: Date
): Promise<{
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
  gracePeriodMinutes: number;
  overtimeEnabled: boolean;
}> {
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

  // 1. Check ScheduleOverride for this exact date
  const override = await db.scheduleOverride.findFirst({
    where: {
      employeeId,
      date,
      status: "APPROVED",
    },
  });

  if (override) {
    return {
      startTime: override.startTime ?? "09:00",
      endTime: override.endTime ?? "17:00",
      isWorkingDay: override.isWorkingDay,
      gracePeriodMinutes: 0,
      overtimeEnabled: false,
    };
  }

  // 2. Check ScheduleAssignment (effective date range)
  const assignment = await db.scheduleAssignment.findFirst({
    where: {
      employeeId,
      effectiveFrom: { lte: date },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: date } },
      ],
    },
    include: { schedule: true },
    orderBy: { effectiveFrom: "desc" },
  });

  if (assignment) {
    const schedule = assignment.schedule;
    const isWorkingDay = schedule[dayOfWeek as keyof typeof schedule] as boolean;
    return {
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      isWorkingDay,
      gracePeriodMinutes: schedule.gracePeriodMinutes,
      overtimeEnabled: schedule.overtimeEnabled,
    };
  }

  // 3. Fall back to company default WorkSchedule
  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    select: { companyId: true },
  });

  if (!employee) {
    return {
      startTime: "09:00",
      endTime: "17:00",
      isWorkingDay: true,
      gracePeriodMinutes: 15,
      overtimeEnabled: true,
    };
  }

  const defaultSchedule = await db.workSchedule.findFirst({
    where: {
      companyId: employee.companyId,
      isDefault: true,
    },
  });

  if (!defaultSchedule) {
    return {
      startTime: "09:00",
      endTime: "17:00",
      isWorkingDay: true,
      gracePeriodMinutes: 15,
      overtimeEnabled: true,
    };
  }

  const isWorkingDay = defaultSchedule[dayOfWeek as keyof typeof defaultSchedule] as boolean;
  return {
    startTime: defaultSchedule.startTime,
    endTime: defaultSchedule.endTime,
    isWorkingDay,
    gracePeriodMinutes: defaultSchedule.gracePeriodMinutes,
    overtimeEnabled: defaultSchedule.overtimeEnabled,
  };
}

export async function isHoliday(
  companyId: string,
  date: Date
): Promise<{ isHoliday: boolean; name?: string }> {
  const holiday = await db.holiday.findFirst({
    where: {
      companyId,
      date,
    },
  });

  if (holiday) {
    return { isHoliday: true, name: holiday.name };
  }

  // Check recurring holidays (same month/day)
  const monthDay = date.getMonth() * 100 + date.getDate();
  const recurringHoliday = await db.holiday.findFirst({
    where: {
      companyId,
      isRecurring: true,
    },
  });

  if (recurringHoliday) {
    const recurringMonthDay =
      recurringHoliday.date.getMonth() * 100 + recurringHoliday.date.getDate();
    if (recurringMonthDay === monthDay) {
      return { isHoliday: true, name: recurringHoliday.name };
    }
  }

  return { isHoliday: false };
}

export async function calculateAttendanceDay(
  employeeId: string,
  date: Date,
  punches: Array<{ punchTime: Date; punchType: "IN" | "OUT" }>
): Promise<{
  firstIn: Date | null;
  lastOut: Date | null;
  workMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  status: string;
}> {
  const schedule = await getEffectiveSchedule(employeeId, date);

  // Check if it's a holiday
  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    select: { companyId: true },
  });

  if (employee) {
    const holidayCheck = await isHoliday(employee.companyId, date);
    if (holidayCheck.isHoliday) {
      return {
        firstIn: null,
        lastOut: null,
        workMinutes: 0,
        overtimeMinutes: 0,
        lateMinutes: 0,
        earlyDepartureMinutes: 0,
        status: "HOLIDAY",
      };
    }
  }

  // Check if it's a rest day
  if (!schedule.isWorkingDay) {
    return {
      firstIn: null,
      lastOut: null,
      workMinutes: 0,
      overtimeMinutes: 0,
      lateMinutes: 0,
      earlyDepartureMinutes: 0,
      status: "REST_DAY",
    };
  }

  // Check for approved leave
  if (employee) {
    const leaveRequest = await db.leaveRequest.findFirst({
      where: {
        employeeId,
        status: "APPROVED",
        startDate: { lte: date },
        endDate: { gte: date },
      },
      include: { leaveType: true },
    });

    if (leaveRequest) {
      return {
        firstIn: null,
        lastOut: null,
        workMinutes: 0,
        overtimeMinutes: 0,
        lateMinutes: 0,
        earlyDepartureMinutes: 0,
        status: "LEAVE",
      };
    }
  }

  // No punches -> ABSENT
  if (!punches || punches.length === 0) {
    return {
      firstIn: null,
      lastOut: null,
      workMinutes: 0,
      overtimeMinutes: 0,
      lateMinutes: 0,
      earlyDepartureMinutes: 0,
      status: "ABSENT",
    };
  }

  // Sort punches by time
  const sorted = [...punches].sort(
    (a, b) => a.punchTime.getTime() - b.punchTime.getTime()
  );

  const firstIn = sorted[0].punchTime;
  const lastOut = sorted[sorted.length - 1].punchTime;

  // Calculate scheduled start/end in minutes from midnight
  const scheduledStartMinutes = timeToMinutes(schedule.startTime);
  const scheduledEndMinutes = timeToMinutes(schedule.endTime);
  const scheduledWorkMinutes = scheduledEndMinutes - scheduledStartMinutes;

  // Calculate firstIn and lastOut in minutes from midnight
  const firstInMinutes =
    firstIn.getHours() * 60 + firstIn.getMinutes();
  const lastOutMinutes =
    lastOut.getHours() * 60 + lastOut.getMinutes();

  // Late = how many minutes after (scheduledStart + gracePeriod)
  const lateMinutes = Math.max(
    0,
    firstInMinutes - (scheduledStartMinutes + schedule.gracePeriodMinutes)
  );

  // Early departure = how many minutes before scheduledEnd
  const earlyDepartureMinutes = Math.max(
    0,
    scheduledEndMinutes - lastOutMinutes
  );

  // Total work minutes (from firstIn to lastOut, capped at scheduled end for base work)
  const totalSpanMinutes = Math.max(0, lastOutMinutes - firstInMinutes);

  // Work minutes = total span minus any break, but for simplicity we count continuous work
  const workMinutes = Math.min(totalSpanMinutes, scheduledWorkMinutes);

  // Overtime = any minutes worked beyond scheduled end (only if overtime enabled)
  let overtimeMinutes = 0;
  if (schedule.overtimeEnabled && lastOutMinutes > scheduledEndMinutes) {
    overtimeMinutes = lastOutMinutes - scheduledEndMinutes;
  }

  const status = "PRESENT";

  return {
    firstIn,
    lastOut,
    workMinutes,
    overtimeMinutes,
    lateMinutes,
    earlyDepartureMinutes,
    status,
  };
}

export async function processAttendanceImport(
  importId: string
): Promise<{
  totalProcessed: number;
  matched: number;
  unmatched: number;
  duplicates: number;
}> {
  const rawRecords = await db.attendanceRawRecord.findMany({
    where: { attendanceImportId: importId },
    orderBy: { createdAt: "asc" },
  });

  let matched = 0;
  let unmatched = 0;
  let duplicates = 0;

  // Group raw records by employeeIdentifier to detect duplicates
  const groupedByEmployee = new Map<string, typeof rawRecords>();
  for (const record of rawRecords) {
    const key = record.employeeIdentifier;
    if (!groupedByEmployee.has(key)) {
      groupedByEmployee.set(key, []);
    }
    groupedByEmployee.get(key)!.push(record);
  }

  for (const [identifier, records] of groupedByEmployee) {
    // Try to find employee by employeeCode, fingerprintId, or name
    const employeeName = ((records[0]?.rawRow as Record<string, any>)?._employeeName) || "";
    let employee = await db.employee.findFirst({
      where: {
        OR: [
          { employeeCode: identifier },
          { fingerprintId: identifier },
        ],
        employmentStatus: "ACTIVE",
      },
    });

    // Fallback: try matching by employee name if ID matching failed
    if (!employee && employeeName) {
      const nameParts = employeeName.toLowerCase().split(/\s+/).filter(Boolean);
      if (nameParts.length >= 2) {
        // Try first + last name match for better accuracy
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];
        employee = await db.employee.findFirst({
          where: {
            AND: [
              {
                OR: [
                  { firstName: { contains: firstName, mode: "insensitive" } },
                  { displayName: { contains: firstName, mode: "insensitive" } },
                ],
              },
              {
                OR: [
                  { lastName: { contains: lastName, mode: "insensitive" } },
                  { displayName: { contains: lastName, mode: "insensitive" } },
                ],
              },
            ],
            employmentStatus: "ACTIVE",
          },
        });
      }
      // Last resort: exact displayName match
      if (!employee) {
        employee = await db.employee.findFirst({
          where: {
            displayName: { equals: employeeName, mode: "insensitive" },
            employmentStatus: "ACTIVE",
          },
        });
      }
    }

    if (!employee) {
      for (const record of records) {
        await db.attendanceRawRecord.update({
          where: { id: record.id },
          data: { matchStatus: "UNMATCHED" },
        });
        unmatched++;
      }
      continue;
    }

    // Check for duplicates within the records for this employee
    const seenPunchTimes = new Map<number, string>();
    for (const record of records) {
      const punchTimeMs = new Date(record.punchTime).getTime();
      const existingId = seenPunchTimes.get(punchTimeMs);

      if (existingId) {
        // Duplicate punch time for same employee
        await db.attendanceRawRecord.update({
          where: { id: record.id },
          data: {
            matchStatus: "DUPLICATE",
            isDuplicate: true,
            matchedEmployeeId: employee.id,
          },
        });
        duplicates++;
      } else {
        seenPunchTimes.set(punchTimeMs, record.id);

        // Also check against existing punches in the database
        const existingPunch = await db.attendancePunch.findFirst({
          where: {
            employeeId: employee.id,
            punchTime: record.punchTime,
          },
        });

        if (existingPunch) {
          await db.attendanceRawRecord.update({
            where: { id: record.id },
            data: {
              matchStatus: "DUPLICATE",
              isDuplicate: true,
              matchedEmployeeId: employee.id,
            },
          });
          duplicates++;
        } else {
          // Create the attendance punch
          const punchDate = new Date(record.punchTime);
          punchDate.setHours(0, 0, 0, 0);

          // Determine IN/OUT based on existing punches for this employee on this date
          const existingPunchesForDay = await db.attendancePunch.findMany({
            where: {
              employeeId: employee.id,
              date: punchDate,
            },
            orderBy: { punchTime: "asc" },
          });

          // Determine punch type: if no punches yet, it's IN; if last was IN, it's OUT
          let punchType: "IN" | "OUT" = "IN";
          if (existingPunchesForDay.length > 0) {
            const lastPunch =
              existingPunchesForDay[existingPunchesForDay.length - 1];
            punchType = lastPunch.punchType === "IN" ? "OUT" : "IN";
          }

          await db.attendancePunch.create({
            data: {
              rawRecordId: record.id,
              employeeId: employee.id,
              date: punchDate,
              punchTime: record.punchTime,
              punchType,
              confidence: 1.0,
              isManual: false,
            },
          });

          await db.attendanceRawRecord.update({
            where: { id: record.id },
            data: {
              matchStatus: "MATCHED",
              matchedEmployeeId: employee.id,
            },
          });
          matched++;
        }
      }
    }
  }

  // Update the import summary
  await db.attendanceImport.update({
    where: { id: importId },
    data: {
      status: "COMPLETED",
      unmatchedRows: unmatched,
      duplicateRows: duplicates,
      completedAt: new Date(),
      summary: {
        totalProcessed: rawRecords.length,
        matched,
        unmatched,
        duplicates,
      },
    },
  });

  return {
    totalProcessed: rawRecords.length,
    matched,
    unmatched,
    duplicates,
  };
}

export async function normalizePunches(rawRecordId: string): Promise<void> {
  const rawRecord = await db.attendanceRawRecord.findUnique({
    where: { id: rawRecordId },
    include: {
      attendancePunches: { orderBy: { punchTime: "asc" } },
    },
  });

  if (!rawRecord || !rawRecord.matchedEmployeeId) {
    return;
  }

  // If punches already exist, skip normalization
  if (rawRecord.attendancePunches.length > 0) {
    return;
  }

  const punchDate = new Date(rawRecord.punchTime);
  punchDate.setHours(0, 0, 0, 0);

  // Get all existing punches for this employee on this date (from other raw records)
  const existingPunches = await db.attendancePunch.findMany({
    where: {
      employeeId: rawRecord.matchedEmployeeId,
      date: punchDate,
    },
    orderBy: { punchTime: "asc" },
  });

  // Determine punch type based on time ordering
  let punchType: "IN" | "OUT" = "IN";
  if (existingPunches.length > 0) {
    const lastPunch = existingPunches[existingPunches.length - 1];
    punchType = lastPunch.punchType === "IN" ? "OUT" : "IN";
  }

  await db.attendancePunch.create({
    data: {
      rawRecordId: rawRecord.id,
      employeeId: rawRecord.matchedEmployeeId,
      date: punchDate,
      punchTime: rawRecord.punchTime,
      punchType,
      confidence: 1.0,
      isManual: false,
    },
  });
}

export async function calculateAttendanceForRange(
  startDate: Date,
  endDate: Date,
  employeeIds?: string[]
): Promise<void> {
  // Get all active employees (or filtered list)
  const whereCondition: Record<string, unknown> = {
    employmentStatus: "ACTIVE",
  };

  if (employeeIds && employeeIds.length > 0) {
    whereCondition.id = { in: employeeIds };
  }

  const employees = await db.employee.findMany({
    where: whereCondition,
    select: { id: true, companyId: true },
  });

  // Generate all dates in the range
  const dates: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  for (const employee of employees) {
    for (const date of dates) {
      // Get all punches for this employee on this date
      const punches = await db.attendancePunch.findMany({
        where: {
          employeeId: employee.id,
          date,
        },
        orderBy: { punchTime: "asc" },
      });

      const punchData = punches.map((p: { punchTime: Date; punchType: string }) => ({
        punchTime: p.punchTime,
        punchType: p.punchType as "IN" | "OUT",
      }));

      const result = await calculateAttendanceDay(
        employee.id,
        date,
        punchData
      );

      // Upsert the AttendanceDay record
      await db.attendanceDay.upsert({
        where: {
          employeeId_date: {
            employeeId: employee.id,
            date,
          },
        },
        create: {
          employeeId: employee.id,
          date,
          scheduledStart: minutesToTime(
            timeToMinutes(
              (
                await getEffectiveSchedule(employee.id, date)
              ).startTime
            )
          ),
          scheduledEnd: minutesToTime(
            timeToMinutes(
              (
                await getEffectiveSchedule(employee.id, date)
              ).endTime
            )
          ),
          firstIn: result.firstIn,
          lastOut: result.lastOut,
          workMinutes: result.workMinutes,
          overtimeMinutes: result.overtimeMinutes,
          lateMinutes: result.lateMinutes,
          earlyDepartureMinutes: result.earlyDepartureMinutes,
          status: result.status as "PRESENT",
        },
        update: {
          firstIn: result.firstIn,
          lastOut: result.lastOut,
          workMinutes: result.workMinutes,
          overtimeMinutes: result.overtimeMinutes,
          lateMinutes: result.lateMinutes,
          earlyDepartureMinutes: result.earlyDepartureMinutes,
          status: result.status as "PRESENT",
        },
      });
    }
  }
}

export async function lockAttendance(
  startDate: Date,
  endDate: Date
): Promise<void> {
  // Lock all AttendanceDay records in the date range
  await db.attendanceDay.updateMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      isLocked: false,
    },
    data: {
      isLocked: true,
    },
  });
}
