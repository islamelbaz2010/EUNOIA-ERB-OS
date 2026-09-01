// Shared constants for Egypt-focused EUNOIA deployment.
// Keep this as the single source of truth for controlled lists reused
// across clients, employees, and admin forms.

// Canonical list of the 27 Egyptian governorates.
export const EGYPT_GOVERNORATES = [
  "Cairo",
  "Giza",
  "Alexandria",
  "Dakahlia",
  "Red Sea",
  "Beheira",
  "Fayoum",
  "Gharbia",
  "Ismailia",
  "Monufia",
  "Minya",
  "Qalyubia",
  "New Valley",
  "Suez",
  "Aswan",
  "Asyut",
  "Beni Suef",
  "Port Said",
  "Damietta",
  "Sharqia",
  "South Sinai",
  "Kafr El Sheikh",
  "Matrouh",
  "Luxor",
  "Qena",
  "North Sinai",
  "Sohag",
] as const;

export const DEFAULT_COUNTRY = "Egypt";

export const EMPLOYMENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  ON_LEAVE: "On Leave",
  TERMINATED: "Terminated",
  SUSPENDED: "Suspended",
};

export const GENDER_LABELS: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
};

export const MARITAL_STATUS_LABELS: Record<string, string> = {
  SINGLE: "Single",
  MARRIED: "Married",
  DIVORCED: "Divorced",
  WIDOWED: "Widowed",
};

export const SALARY_COMPONENT_TYPE_LABELS: Record<string, string> = {
  ALLOWANCE: "Allowance",
  BONUS: "Bonus",
  OVERTIME: "Overtime",
  COMMISSION: "Commission",
  DEDUCTION: "Deduction",
  ADVANCE: "Advance",
  PENALTY: "Penalty",
  REIMBURSEMENT: "Reimbursement",
  MANUAL: "Manual",
};

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  HALF_DAY: "Half Day",
  LEAVE: "Leave",
  HOLIDAY: "Holiday",
  REST_DAY: "Rest Day",
  EXCEPTION: "Exception",
};

export const LEAVE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const PAYROLL_RECORD_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  CALCULATED: "Calculated",
  REVIEWED: "Reviewed",
  APPROVED: "Approved",
  PAID: "Paid",
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  VIEWED: "Viewed",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
};

export const IMPORT_STATUS_LABELS: Record<string, string> = {
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const EXCEPTION_TYPE_LABELS: Record<string, string> = {
  LATE_ARRIVAL: "Late Arrival",
  EARLY_DEPARTURE: "Early Departure",
  BUSINESS_TRIP: "Business Trip",
  WORK_FROM_HOME: "Work From Home",
  MISSED_FINGERPRINT: "Missed Fingerprint",
  FORGOTTEN_PUNCH: "Forgotten Punch",
  APPROVED_ABSENCE: "Approved Absence",
  SPECIAL_WORKING_DAY: "Special Working Day",
  OVERTIME_APPROVAL: "Overtime Approval",
  SCHEDULE_OVERRIDE: "Schedule Override",
  OTHER: "Other",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  CHECK: "Check",
  CREDIT_CARD: "Credit Card",
  ONLINE: "Online Payment",
  OTHER: "Other",
};
