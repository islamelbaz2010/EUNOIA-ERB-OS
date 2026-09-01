// Single source of truth for payroll-period status rules, shared between
// the API routes that enforce them and the UI that must only expose
// actions the API will actually accept. Keeping one definition here is
// what prevents the UI and backend from drifting apart on what is a
// valid action for a given period status.

export type PayrollPeriodStatus = "DRAFT" | "CALCULATED" | "UNDER_REVIEW" | "APPROVED" | "LOCKED";

export const PAYROLL_STATUS_TRANSITIONS: Record<string, PayrollPeriodStatus[]> = {
  DRAFT: ["CALCULATED"],
  CALCULATED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED"],
  APPROVED: ["LOCKED"],
};

export function canTransitionPayrollStatus(from: string, to: string): boolean {
  return (PAYROLL_STATUS_TRANSITIONS[from] || []).includes(to as PayrollPeriodStatus);
}

// Calculation is only ever valid for a period still in DRAFT.
export function canCalculatePayrollPeriod(status: string): boolean {
  return status === "DRAFT";
}

// PayrollPeriod.status (not PayrollRecord.status — see the note in
// PayrollRecordStatus below) is the authoritative lifecycle for whether an
// individual payroll record may still be edited. Once a period has moved
// past CALCULATED, its records are under review or later and must be
// protected from further mutation.
export function canEditPayrollRecord(periodStatus: string): boolean {
  return periodStatus === "DRAFT" || periodStatus === "CALCULATED";
}

// Period-level fields (name/notes) stay editable through review, but are
// frozen once the period is APPROVED or LOCKED.
export function canEditPayrollPeriodFields(periodStatus: string): boolean {
  return periodStatus !== "APPROVED" && periodStatus !== "LOCKED";
}

// Known backend implementation-detail error strings, mapped to a
// user-facing Arabic message. The API keeps returning the English string
// (stable contract for logs/other clients); this mapping is presentation
// only and never changes what the API sends.
const PAYROLL_ERROR_MESSAGES: Record<string, string> = {
  "Period must be in DRAFT status to calculate": "يجب أن تكون فترة الرواتب في حالة مسودة لبدء الحساب",
  "Payroll period not found": "لم يتم العثور على فترة الرواتب",
  "Payroll record not found": "لم يتم العثور على سجل الراتب",
  "Cannot modify payroll records once the period is under review or later":
    "لا يمكن تعديل سجلات الرواتب بعد إرسال الفترة للمراجعة",
  "Cannot modify payroll period details once approved or locked":
    "لا يمكن تعديل بيانات فترة الرواتب بعد اعتمادها أو قفلها",
  "Payroll period was modified by another user, please try again":
    "تم تعديل فترة الرواتب من قبل مستخدم آخر، يرجى إعادة المحاولة",
};

export function translatePayrollError(message: string | undefined | null, fallback: string): string {
  if (!message) return fallback;
  if (PAYROLL_ERROR_MESSAGES[message]) return PAYROLL_ERROR_MESSAGES[message];
  if (message.startsWith("Cannot transition from")) {
    return "لا يمكن تنفيذ هذا الإجراء في الحالة الحالية لفترة الرواتب";
  }
  return fallback;
}
