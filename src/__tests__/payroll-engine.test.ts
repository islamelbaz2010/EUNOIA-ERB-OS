jest.mock('@/lib/db', () => ({
  db: {
    salaryProfile: { findFirst: jest.fn() },
    attendanceDay: { findMany: jest.fn() },
    scheduleAssignment: { findFirst: jest.fn() },
    leaveRequest: { findFirst: jest.fn() },
  },
}));

import { calculateEmployeePayroll, WORKING_DAYS_PER_MONTH } from '@/lib/payroll-engine';
import { db } from '@/lib/db';

const mockDb = db as any;

function makeSalaryProfile(overrides: Record<string, any> = {}) {
  return {
    baseSalary: 15000,
    hourlyRate: 83.33,
    components: [],
    ...overrides,
  };
}

function makeAttendanceDay(overrides: Record<string, any> = {}) {
  return {
    date: new Date('2026-03-01'),
    status: 'PRESENT',
    lateMinutes: 0,
    overtimeMinutes: 0,
    scheduledStart: '09:00',
    scheduledEnd: '17:00',
    ...overrides,
  };
}

function setupDefaults() {
  mockDb.salaryProfile.findFirst.mockResolvedValue(makeSalaryProfile());
  mockDb.attendanceDay.findMany.mockResolvedValue([]);
  mockDb.scheduleAssignment.findFirst.mockResolvedValue(null);
  mockDb.leaveRequest.findFirst.mockResolvedValue(null);
}

describe('Payroll Engine - calculateEmployeePayroll', () => {
  const employeeId = 'emp-1';
  const startDate = new Date('2026-03-01');
  const endDate = new Date('2026-03-31');

  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaults();
  });

  describe('base salary', () => {
    it('returns full monthly base salary with no attendance', async () => {
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      expect(result.baseSalary).toBe(15000);
    });

    it('uses 30-day divisor for daily salary', () => {
      expect(WORKING_DAYS_PER_MONTH).toBe(30);
    });

    it('returns full salary without pro-rating', async () => {
      mockDb.salaryProfile.findFirst.mockResolvedValue(
        makeSalaryProfile({ baseSalary: 20000 })
      );
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      expect(result.baseSalary).toBe(20000);
    });
  });

  describe('daily salary calculation', () => {
    it('deducts 500 per absent day for 15000 salary (15000/30)', async () => {
      mockDb.attendanceDay.findMany.mockResolvedValue([
        makeAttendanceDay({ status: 'ABSENT', date: new Date('2026-03-01') }),
      ]);
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      expect(result.attendanceDeductions).toBe(500);
    });

    it('deducts 666.67 per absent day for 20000 salary (20000/30)', async () => {
      mockDb.salaryProfile.findFirst.mockResolvedValue(
        makeSalaryProfile({ baseSalary: 20000 })
      );
      mockDb.attendanceDay.findMany.mockResolvedValue([
        makeAttendanceDay({ status: 'ABSENT', date: new Date('2026-03-01') }),
      ]);
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      expect(result.attendanceDeductions).toBeCloseTo(666.67, 2);
    });
  });

  describe('late deduction', () => {
    it('deducts proportionally for 30 min late', async () => {
      mockDb.attendanceDay.findMany.mockResolvedValue([
        makeAttendanceDay({
          status: 'PRESENT',
          lateMinutes: 30,
          date: new Date('2026-03-01'),
        }),
      ]);
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      // dailySalary = 15000/30 = 500, scheduledWorkMinutes = 480
      // lateDeduction = (30/480) * 500 = 31.25
      expect(result.attendanceDeductions).toBeCloseTo(31.25, 2);
    });

    it('deducts full daily salary for 480 min late (full day)', async () => {
      mockDb.attendanceDay.findMany.mockResolvedValue([
        makeAttendanceDay({
          status: 'PRESENT',
          lateMinutes: 480,
          date: new Date('2026-03-01'),
        }),
      ]);
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      expect(result.attendanceDeductions).toBeCloseTo(500, 2);
    });
  });

  describe('overtime', () => {
    it('calculates overtime at 1.5x hourly rate', async () => {
      mockDb.attendanceDay.findMany.mockResolvedValue([
        makeAttendanceDay({
          overtimeMinutes: 60,
          date: new Date('2026-03-01'),
        }),
      ]);
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      // hourlyRate = 83.33, overtime = 60 * (83.33/60) * 1.5 = 125.00
      expect(result.overtime).toBeCloseTo(125, 0);
    });

    it('returns 0 overtime when no overtime minutes', async () => {
      mockDb.attendanceDay.findMany.mockResolvedValue([
        makeAttendanceDay({ overtimeMinutes: 0 }),
      ]);
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      expect(result.overtime).toBe(0);
    });
  });

  describe('components (allowances and deductions)', () => {
    it('includes recurring allowance in additions', async () => {
      mockDb.salaryProfile.findFirst.mockResolvedValue(
        makeSalaryProfile({
          components: [
            { type: 'ALLOWANCE', name: 'Housing', amount: 3000, isActive: true, isRecurring: true, isPercentage: false },
          ],
        })
      );
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      expect(result.totalAdditions).toBe(3000);
      expect(result.components.find((c: any) => c.name === 'Housing')).toBeDefined();
    });

    it('includes deduction in totalDeductions', async () => {
      mockDb.salaryProfile.findFirst.mockResolvedValue(
        makeSalaryProfile({
          components: [
            { type: 'DEDUCTION', name: 'Loan', amount: 500, isActive: true, isRecurring: true, isPercentage: false, notes: 'Monthly loan repayment' },
          ],
        })
      );
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      expect(result.totalDeductions).toBe(500);
      expect(result.components.find((c: any) => c.name === 'Loan')).toBeDefined();
    });

    it('calculates percentage-based allowance', async () => {
      mockDb.salaryProfile.findFirst.mockResolvedValue(
        makeSalaryProfile({
          components: [
            { type: 'BASE_SALARY', name: 'Base Salary', amount: 15000, isActive: true, isRecurring: true },
            { type: 'ALLOWANCE', name: 'Transport (10%)', amount: 10, isActive: true, isRecurring: true, isPercentage: true, percentageOf: 'BASE_SALARY' },
          ],
        })
      );
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      expect(result.totalAdditions).toBe(1500);
    });

    it('processes non-recurring components', async () => {
      mockDb.salaryProfile.findFirst.mockResolvedValue(
        makeSalaryProfile({
          components: [
            { type: 'BONUS', name: 'One-time bonus', amount: 2000, isActive: true, isRecurring: false, isPercentage: false },
          ],
        })
      );
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      expect(result.totalAdditions).toBe(2000);
    });
  });

  describe('unpaid leave', () => {
    it('deducts daily salary for unpaid leave day', async () => {
      const leaveDate = new Date('2026-03-05');
      mockDb.attendanceDay.findMany.mockResolvedValue([
        makeAttendanceDay({ status: 'LEAVE', date: leaveDate }),
      ]);
      mockDb.leaveRequest.findFirst.mockResolvedValue({
        leaveType: { name: 'Unpaid Leave', nameAr: null, isPaid: false },
      });
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      expect(result.totalDeductions).toBe(500);
      expect(result.attendanceDeductions).toBe(500);
    });

    it('does not deduct for paid leave', async () => {
      const leaveDate = new Date('2026-03-05');
      mockDb.attendanceDay.findMany.mockResolvedValue([
        makeAttendanceDay({ status: 'LEAVE', date: leaveDate }),
      ]);
      mockDb.leaveRequest.findFirst.mockResolvedValue({
        leaveType: { name: 'Annual Leave', nameAr: null, isPaid: true },
      });
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      expect(result.totalDeductions).toBe(0);
      expect(result.attendanceDeductions).toBe(0);
    });
  });

  describe('gross and net formulas', () => {
    it('gross = base + additions - attendanceDeductions', async () => {
      mockDb.salaryProfile.findFirst.mockResolvedValue(
        makeSalaryProfile({
          components: [
            { type: 'ALLOWANCE', name: 'Housing', amount: 3000, isActive: true, isRecurring: true, isPercentage: false },
          ],
        })
      );
      mockDb.attendanceDay.findMany.mockResolvedValue([
        makeAttendanceDay({ status: 'ABSENT', date: new Date('2026-03-01') }),
      ]);
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      expect(result.gross).toBe(17500);
    });

    it('net = gross - totalDeductions', async () => {
      mockDb.salaryProfile.findFirst.mockResolvedValue(
        makeSalaryProfile({
          components: [
            { type: 'DEDUCTION', name: 'Loan', amount: 1000, isActive: true, isRecurring: true, isPercentage: false },
          ],
        })
      );
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      expect(result.gross).toBe(15000);
      expect(result.net).toBe(14000);
    });

    it('rounds to 2 decimal places', async () => {
      mockDb.salaryProfile.findFirst.mockResolvedValue(
        makeSalaryProfile({ baseSalary: 12345.67 })
      );
      mockDb.attendanceDay.findMany.mockResolvedValue([
        makeAttendanceDay({ status: 'ABSENT', date: new Date('2026-03-01') }),
      ]);
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      expect(result.attendanceDeductions).toBe(Math.round(411.5223 * 100) / 100);
    });
  });

  describe('attendance summary', () => {
    it('counts present and absent days correctly', async () => {
      mockDb.attendanceDay.findMany.mockResolvedValue([
        makeAttendanceDay({ status: 'PRESENT', date: new Date('2026-03-01') }),
        makeAttendanceDay({ status: 'PRESENT', date: new Date('2026-03-02') }),
        makeAttendanceDay({ status: 'ABSENT', date: new Date('2026-03-03') }),
        makeAttendanceDay({ status: 'LEAVE', date: new Date('2026-03-04') }),
        makeAttendanceDay({ status: 'HOLIDAY', date: new Date('2026-03-05') }),
      ]);
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      expect(result.attendanceSummary.presentDays).toBe(2);
      expect(result.attendanceSummary.absentDays).toBe(1);
      expect(result.attendanceSummary.leaveDays).toBe(1);
      expect(result.attendanceSummary.holidayDays).toBe(1);
    });
  });

  describe('error handling', () => {
    it('throws when no salary profile found', async () => {
      mockDb.salaryProfile.findFirst.mockResolvedValue(null);
      await expect(
        calculateEmployeePayroll(employeeId, startDate, endDate)
      ).rejects.toThrow('No active salary profile found');
    });
  });

  describe('edge cases', () => {
    it('handles zero overtime correctly', async () => {
      mockDb.attendanceDay.findMany.mockResolvedValue([
        makeAttendanceDay({ overtimeMinutes: 0 }),
      ]);
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      expect(result.overtime).toBe(0);
      expect(result.gross).toBe(15000);
    });

    it('handles zero deductions correctly', async () => {
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      expect(result.totalDeductions).toBe(0);
      expect(result.net).toBe(15000);
    });

    it('handles employee with no optional components', async () => {
      mockDb.salaryProfile.findFirst.mockResolvedValue(
        makeSalaryProfile({ components: [] })
      );
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      expect(result.baseSalary).toBe(15000);
      expect(result.totalAdditions).toBe(0);
      expect(result.totalDeductions).toBe(0);
      expect(result.gross).toBe(15000);
      expect(result.net).toBe(15000);
    });

    it('handles different salary levels', async () => {
      mockDb.salaryProfile.findFirst.mockResolvedValue(
        makeSalaryProfile({ baseSalary: 5000, hourlyRate: 27.78 })
      );
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      expect(result.baseSalary).toBe(5000);
    });

    it('handles large salary correctly', async () => {
      mockDb.salaryProfile.findFirst.mockResolvedValue(
        makeSalaryProfile({ baseSalary: 100000, hourlyRate: 555.56 })
      );
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      expect(result.baseSalary).toBe(100000);
      expect(result.gross).toBe(100000);
    });
  });

  describe('combined scenarios', () => {
    it('base + allowance + overtime - absence - deduction', async () => {
      mockDb.salaryProfile.findFirst.mockResolvedValue(
        makeSalaryProfile({
          hourlyRate: 83.33,
          components: [
            { type: 'ALLOWANCE', name: 'Housing', amount: 3000, isActive: true, isRecurring: true, isPercentage: false },
            { type: 'DEDUCTION', name: 'Loan', amount: 500, isActive: true, isRecurring: true, isPercentage: false },
          ],
        })
      );
      mockDb.attendanceDay.findMany.mockResolvedValue([
        makeAttendanceDay({ status: 'PRESENT', overtimeMinutes: 60, date: new Date('2026-03-01') }),
        makeAttendanceDay({ status: 'ABSENT', date: new Date('2026-03-02') }),
      ]);
      const result = await calculateEmployeePayroll(employeeId, startDate, endDate);
      expect(result.baseSalary).toBe(15000);
      expect(result.totalAdditions).toBeCloseTo(3125, 0);
      expect(result.attendanceDeductions).toBe(500);
      expect(result.totalDeductions).toBe(500);
      expect(result.gross).toBeCloseTo(17625, 0);
      expect(result.net).toBeCloseTo(17125, 0);
    });
  });
});
