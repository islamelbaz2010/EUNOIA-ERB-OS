import {
  canCalculatePayrollPeriod,
  canTransitionPayrollStatus,
  canEditPayrollRecord,
  canEditPayrollPeriodFields,
  translatePayrollError,
} from "@/lib/payroll-workflow";

describe("payroll-workflow", () => {
  describe("canCalculatePayrollPeriod", () => {
    // A) DRAFT period: calculation action is available.
    it("allows calculation for a DRAFT period", () => {
      expect(canCalculatePayrollPeriod("DRAFT")).toBe(true);
    });

    // B) NON-DRAFT period: calculation action is not actionable.
    it("rejects calculation for every non-DRAFT status", () => {
      expect(canCalculatePayrollPeriod("CALCULATED")).toBe(false);
      expect(canCalculatePayrollPeriod("UNDER_REVIEW")).toBe(false);
      expect(canCalculatePayrollPeriod("APPROVED")).toBe(false);
      expect(canCalculatePayrollPeriod("LOCKED")).toBe(false);
    });
  });

  describe("canTransitionPayrollStatus", () => {
    // C) Backend protection: mirrors the state machine the API enforces.
    it("allows the documented forward transitions", () => {
      expect(canTransitionPayrollStatus("DRAFT", "CALCULATED")).toBe(true);
      expect(canTransitionPayrollStatus("CALCULATED", "UNDER_REVIEW")).toBe(true);
      expect(canTransitionPayrollStatus("UNDER_REVIEW", "APPROVED")).toBe(true);
      expect(canTransitionPayrollStatus("APPROVED", "LOCKED")).toBe(true);
    });

    it("rejects skipping a state, e.g. CALCULATED straight to APPROVED", () => {
      // This is the exact bug: the UI used to send APPROVED directly from
      // CALCULATED, which the backend has always rejected.
      expect(canTransitionPayrollStatus("CALCULATED", "APPROVED")).toBe(false);
    });

    it("rejects transitions out of a terminal or unknown status", () => {
      expect(canTransitionPayrollStatus("LOCKED", "APPROVED")).toBe(false);
      expect(canTransitionPayrollStatus("DRAFT", "APPROVED")).toBe(false);
      expect(canTransitionPayrollStatus("UNKNOWN", "CALCULATED")).toBe(false);
    });

    // LOCKED is terminal in V1: no outgoing transition of any kind.
    it("rejects every possible transition out of LOCKED", () => {
      expect(canTransitionPayrollStatus("LOCKED", "APPROVED")).toBe(false);
      expect(canTransitionPayrollStatus("LOCKED", "UNDER_REVIEW")).toBe(false);
      expect(canTransitionPayrollStatus("LOCKED", "CALCULATED")).toBe(false);
      expect(canTransitionPayrollStatus("LOCKED", "DRAFT")).toBe(false);
      expect(canTransitionPayrollStatus("LOCKED", "LOCKED")).toBe(false);
    });

    // V1 has no rejection/return-to-draft/reopen path from any state.
    it("rejects every attempt to move a period back to an earlier state", () => {
      expect(canTransitionPayrollStatus("CALCULATED", "DRAFT")).toBe(false);
      expect(canTransitionPayrollStatus("UNDER_REVIEW", "DRAFT")).toBe(false);
      expect(canTransitionPayrollStatus("UNDER_REVIEW", "CALCULATED")).toBe(false);
      expect(canTransitionPayrollStatus("APPROVED", "DRAFT")).toBe(false);
      expect(canTransitionPayrollStatus("APPROVED", "CALCULATED")).toBe(false);
      expect(canTransitionPayrollStatus("APPROVED", "UNDER_REVIEW")).toBe(false);
    });
  });

  describe("canEditPayrollRecord", () => {
    it("allows editing a payroll record while its period is DRAFT or CALCULATED", () => {
      expect(canEditPayrollRecord("DRAFT")).toBe(true);
      expect(canEditPayrollRecord("CALCULATED")).toBe(true);
    });

    it("blocks editing once the parent period is under review or later", () => {
      expect(canEditPayrollRecord("UNDER_REVIEW")).toBe(false);
      expect(canEditPayrollRecord("APPROVED")).toBe(false);
      expect(canEditPayrollRecord("LOCKED")).toBe(false);
    });
  });

  describe("canEditPayrollPeriodFields", () => {
    it("allows editing period name/notes through DRAFT, CALCULATED, and UNDER_REVIEW", () => {
      expect(canEditPayrollPeriodFields("DRAFT")).toBe(true);
      expect(canEditPayrollPeriodFields("CALCULATED")).toBe(true);
      expect(canEditPayrollPeriodFields("UNDER_REVIEW")).toBe(true);
    });

    it("blocks editing period name/notes once APPROVED or LOCKED", () => {
      expect(canEditPayrollPeriodFields("APPROVED")).toBe(false);
      expect(canEditPayrollPeriodFields("LOCKED")).toBe(false);
    });
  });

  describe("translatePayrollError", () => {
    // D) The displayed message is a clear English sentence and never the
    // raw internal implementation string, for every case the backend can
    // return.
    it("translates the DRAFT-required calculation error to a clear message", () => {
      const result = translatePayrollError("Period must be in DRAFT status to calculate", "fallback");
      expect(result).toBe("This payroll period must be in Draft status before it can be calculated");
    });

    it("translates an invalid-transition error to a generic clear message", () => {
      const result = translatePayrollError("Cannot transition from CALCULATED to APPROVED", "fallback");
      expect(result).toBe("This action is not available for the payroll period's current status");
    });

    it("translates the not-found error to a clear message", () => {
      expect(translatePayrollError("Payroll period not found", "fallback")).toBe(
        "Payroll period not found"
      );
    });

    it("translates the record-edit-blocked error to a clear message", () => {
      const result = translatePayrollError(
        "Cannot modify payroll records once the period is under review or later",
        "fallback"
      );
      expect(result).toBe("Payroll records can no longer be edited once the period has been sent for review");
    });

    it("translates the period-fields-blocked error to a clear message", () => {
      const result = translatePayrollError(
        "Cannot modify payroll period details once approved or locked",
        "fallback"
      );
      expect(result).toBe("Payroll period details can no longer be edited once it has been approved or locked");
    });

    it("translates the concurrent-modification conflict error to a clear message", () => {
      const result = translatePayrollError(
        "Payroll period was modified by another user, please try again",
        "fallback"
      );
      expect(result).toBe("This payroll period was just updated by another user — please refresh and try again");
    });

    it("falls back to the given default for an unrecognized message", () => {
      expect(translatePayrollError("Internal server error", "Calculation failed")).toBe("Calculation failed");
    });

    it("falls back to the given default when no message is present", () => {
      expect(translatePayrollError(undefined, "Calculation failed")).toBe("Calculation failed");
      expect(translatePayrollError(null, "Calculation failed")).toBe("Calculation failed");
    });
  });
});
