function calculateLateDeduction(lateMinutes: number, scheduledWorkMinutes: number, dailySalary: number): number {
  if (lateMinutes <= 0 || scheduledWorkMinutes <= 0) return 0;
  return (lateMinutes / scheduledWorkMinutes) * dailySalary;
}

function calculateAbsenceDeduction(dailySalary: number): number {
  return dailySalary;
}

function calculateOvertimePay(overtimeMinutes: number, hourlyRate: number): number {
  return overtimeMinutes * (hourlyRate / 60) * 1.5;
}

function calculateDailySalary(monthlySalary: number, workDaysInMonth: number): number {
  if (workDaysInMonth <= 0) return 0;
  return monthlySalary / workDaysInMonth;
}

describe('Payroll Engine Calculations', () => {
  describe('calculateLateDeduction', () => {
    const dailySalary = 500;
    const scheduledWorkMinutes = 480; // 8 hours

    it('returns 0 for no lateness', () => {
      expect(calculateLateDeduction(0, scheduledWorkMinutes, dailySalary)).toBe(0);
    });

    it('deducts proportionally for 30 min late', () => {
      const result = calculateLateDeduction(30, scheduledWorkMinutes, dailySalary);
      expect(result).toBeCloseTo(31.25, 2);
    });

    it('deducts proportionally for 60 min late', () => {
      const result = calculateLateDeduction(60, scheduledWorkMinutes, dailySalary);
      expect(result).toBeCloseTo(62.5, 2);
    });

    it('deducts full daily salary for full day late', () => {
      const result = calculateLateDeduction(480, scheduledWorkMinutes, dailySalary);
      expect(result).toBe(dailySalary);
    });

    it('returns 0 when scheduledWorkMinutes is 0', () => {
      expect(calculateLateDeduction(30, 0, dailySalary)).toBe(0);
    });
  });

  describe('calculateAbsenceDeduction', () => {
    it('deducts full daily salary', () => {
      expect(calculateAbsenceDeduction(500)).toBe(500);
    });

    it('works with fractional daily salary', () => {
      expect(calculateAbsenceDeduction(166.67)).toBeCloseTo(166.67, 2);
    });
  });

  describe('calculateOvertimePay', () => {
    const hourlyRate = 60;

    it('calculates 30 min overtime at 1.5x', () => {
      const result = calculateOvertimePay(30, hourlyRate);
      expect(result).toBeCloseTo(45, 2);
    });

    it('calculates 2 hours overtime at 1.5x', () => {
      const result = calculateOvertimePay(120, hourlyRate);
      expect(result).toBeCloseTo(180, 2);
    });

    it('returns 0 for 0 minutes', () => {
      expect(calculateOvertimePay(0, hourlyRate)).toBe(0);
    });

    it('correctly applies 1.5 multiplier', () => {
      // 60 min at 60/hr = 60, times 1.5 = 90
      const result = calculateOvertimePay(60, 60);
      expect(result).toBe(90);
    });
  });

  describe('calculateDailySalary', () => {
    it('divides monthly by work days', () => {
      const result = calculateDailySalary(6000, 22);
      expect(result).toBeCloseTo(272.73, 2);
    });

    it('handles 24 work days (Sun-Thu month)', () => {
      const result = calculateDailySalary(6000, 24);
      expect(result).toBe(250);
    });

    it('returns 0 for 0 work days', () => {
      expect(calculateDailySalary(6000, 0)).toBe(0);
    });

    it('handles full month (30 days as work days)', () => {
      const result = calculateDailySalary(9000, 30);
      expect(result).toBe(300);
    });
  });
});
