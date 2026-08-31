function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function calculateLateMinutes(
  firstInMinutes: number,
  scheduledStartMinutes: number,
  gracePeriodMinutes: number
): number {
  const lateBy = firstInMinutes - scheduledStartMinutes;
  if (lateBy <= gracePeriodMinutes) return 0;
  return lateBy;
}

function calculateEarlyDepartureMinutes(
  scheduledEndMinutes: number,
  lastOutMinutes: number
): number {
  const earlyBy = scheduledEndMinutes - lastOutMinutes;
  if (earlyBy <= 0) return 0;
  return earlyBy;
}

function calculateOvertimeMinutes(
  scheduledEndMinutes: number,
  lastOutMinutes: number,
  overtimeEnabled: boolean
): number {
  if (!overtimeEnabled) return 0;
  const overtime = lastOutMinutes - scheduledEndMinutes;
  if (overtime <= 0) return 0;
  return overtime;
}

describe('Attendance Engine Calculations', () => {
  const scheduledStart = parseTimeToMinutes('09:00'); // 540
  const scheduledEnd = parseTimeToMinutes('17:00');   // 1020
  const gracePeriod = 15;

  describe('parseTimeToMinutes', () => {
    it('parses midnight', () => {
      expect(parseTimeToMinutes('00:00')).toBe(0);
    });

    it('parses 09:00', () => {
      expect(parseTimeToMinutes('09:00')).toBe(540);
    });

    it('parses 17:30', () => {
      expect(parseTimeToMinutes('17:30')).toBe(1050);
    });

    it('parses 23:59', () => {
      expect(parseTimeToMinutes('23:59')).toBe(1439);
    });
  });

  describe('calculateLateMinutes', () => {
    it('on time (exact start)', () => {
      expect(calculateLateMinutes(scheduledStart, scheduledStart, gracePeriod)).toBe(0);
    });

    it('within grace period (10 min late)', () => {
      expect(calculateLateMinutes(550, scheduledStart, gracePeriod)).toBe(0);
    });

    it('at grace boundary (15 min late)', () => {
      expect(calculateLateMinutes(555, scheduledStart, gracePeriod)).toBe(0);
    });

    it('just past grace (16 min late)', () => {
      expect(calculateLateMinutes(556, scheduledStart, gracePeriod)).toBe(556 - scheduledStart);
    });

    it('30 min late', () => {
      const result = calculateLateMinutes(570, scheduledStart, gracePeriod);
      expect(result).toBe(30);
    });

    it('early arrival counts as on time', () => {
      expect(calculateLateMinutes(530, scheduledStart, gracePeriod)).toBe(0);
    });
  });

  describe('calculateEarlyDepartureMinutes', () => {
    it('leaves on time', () => {
      expect(calculateEarlyDepartureMinutes(scheduledEnd, scheduledEnd)).toBe(0);
    });

    it('leaves late (no early departure)', () => {
      expect(calculateEarlyDepartureMinutes(scheduledEnd, 1050)).toBe(0);
    });

    it('leaves 30 min early', () => {
      expect(calculateEarlyDepartureMinutes(scheduledEnd, 990)).toBe(30);
    });

    it('leaves 2 hours early', () => {
      expect(calculateEarlyDepartureMinutes(scheduledEnd, 900)).toBe(120);
    });
  });

  describe('calculateOvertimeMinutes', () => {
    it('no overtime when disabled', () => {
      expect(calculateOvertimeMinutes(scheduledEnd, 1050, false)).toBe(0);
    });

    it('no overtime when leaving on time', () => {
      expect(calculateOvertimeMinutes(scheduledEnd, scheduledEnd, true)).toBe(0);
    });

    it('no overtime when leaving early', () => {
      expect(calculateOvertimeMinutes(scheduledEnd, 990, true)).toBe(0);
    });

    it('30 min overtime', () => {
      expect(calculateOvertimeMinutes(scheduledEnd, 1050, true)).toBe(30);
    });

    it('2 hours overtime', () => {
      expect(calculateOvertimeMinutes(scheduledEnd, 1140, true)).toBe(120);
    });
  });

  describe('full day scenarios', () => {
    it('normal working day - on time', () => {
      const firstIn = 540;  // 09:00
      const lastOut = 1020; // 17:00
      expect(calculateLateMinutes(firstIn, scheduledStart, gracePeriod)).toBe(0);
      expect(calculateEarlyDepartureMinutes(scheduledEnd, lastOut)).toBe(0);
      expect(calculateOvertimeMinutes(scheduledEnd, lastOut, true)).toBe(0);
    });

    it('late arrival with overtime', () => {
      const firstIn = 570;  // 09:30 - 30 min late
      const lastOut = 1080; // 18:00 - 1 hr overtime
      expect(calculateLateMinutes(firstIn, scheduledStart, gracePeriod)).toBe(30);
      expect(calculateOvertimeMinutes(scheduledEnd, lastOut, true)).toBe(60);
    });

    it('no punches (absent)', () => {
      // No punch data means ABSENT - logic is in calculateAttendanceDay
      // Here we verify the math helpers handle edge cases
      expect(calculateLateMinutes(0, scheduledStart, gracePeriod)).toBe(0);
    });
  });
});
