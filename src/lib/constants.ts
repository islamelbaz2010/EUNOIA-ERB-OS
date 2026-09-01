// Shared constants for Egypt-focused EUNOIA deployment.
// Keep this as the single source of truth for controlled lists reused
// across clients, employees, and admin forms.

// Canonical list of the 27 Egyptian governorates.
export const EGYPT_GOVERNORATES = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "الدقهلية",
  "البحر الأحمر",
  "البحيرة",
  "الفيوم",
  "الغربية",
  "الإسماعيلية",
  "المنوفية",
  "المنيا",
  "القليوبية",
  "الوادي الجديد",
  "السويس",
  "أسوان",
  "أسيوط",
  "بني سويف",
  "بورسعيد",
  "دمياط",
  "الشرقية",
  "جنوب سيناء",
  "كفر الشيخ",
  "مطروح",
  "الأقصر",
  "قنا",
  "شمال سيناء",
  "سوهاج",
] as const;

export const DEFAULT_COUNTRY = "مصر";

export const EMPLOYMENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "نشط",
  ON_LEAVE: "في إجازة",
  TERMINATED: "منتهي",
  SUSPENDED: "معلق",
};

export const GENDER_LABELS: Record<string, string> = {
  MALE: "ذكر",
  FEMALE: "أنثى",
};

export const MARITAL_STATUS_LABELS: Record<string, string> = {
  SINGLE: "أعزب",
  MARRIED: "متزوج",
  DIVORCED: "مطلق",
  WIDOWED: "أرمل",
};

export const SALARY_COMPONENT_TYPE_LABELS: Record<string, string> = {
  ALLOWANCE: "بدل",
  BONUS: "مكافأة",
  OVERTIME: "عمل إضافي",
  COMMISSION: "عمولة",
  DEDUCTION: "خصم",
  ADVANCE: "سلفة",
  PENALTY: "غرامة",
  REIMBURSEMENT: "تعويض",
  MANUAL: "يدوي",
};

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  PRESENT: "حاضر",
  ABSENT: "غائب",
  HALF_DAY: "نصف يوم",
  LEAVE: "إجازة",
  HOLIDAY: "عطلة",
  REST_DAY: "يوم راحة",
  EXCEPTION: "استثناء",
};

export const LEAVE_STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد الانتظار",
  APPROVED: "موافق عليها",
  REJECTED: "مرفوضة",
};

export const PAYROLL_RECORD_STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  CALCULATED: "محسوب",
  REVIEWED: "تمت المراجعة",
  APPROVED: "موافق عليه",
  PAID: "مدفوع",
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  SENT: "مرسلة",
  VIEWED: "تمت المشاهدة",
  PARTIALLY_PAID: "مدفوعة جزئياً",
  PAID: "مدفوعة",
  OVERDUE: "متأخرة",
  CANCELLED: "ملغاة",
};

export const IMPORT_STATUS_LABELS: Record<string, string> = {
  PROCESSING: "جاري المعالجة",
  COMPLETED: "مكتمل",
  FAILED: "فشل",
  CANCELLED: "ملغى",
};

export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد الانتظار",
  APPROVED: "موافق عليه",
  REJECTED: "مرفوض",
};

export const EXCEPTION_TYPE_LABELS: Record<string, string> = {
  LATE_ARRIVAL: "تأخر في الحضور",
  EARLY_DEPARTURE: "انصراف مبكر",
  BUSINESS_TRIP: "مهمة عمل",
  WORK_FROM_HOME: "عمل عن بعد",
  MISSED_FINGERPRINT: "بصمة مفقودة",
  FORGOTTEN_PUNCH: "نسيان تسجيل",
  APPROVED_ABSENCE: "غياب معتمد",
  SPECIAL_WORKING_DAY: "يوم عمل استثنائي",
  OVERTIME_APPROVAL: "اعتماد عمل إضافي",
  SCHEDULE_OVERRIDE: "تعديل الجدول",
  OTHER: "أخرى",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "نقداً",
  BANK_TRANSFER: "تحويل بنكي",
  CHECK: "شيك",
  CREDIT_CARD: "بطاقة ائتمان",
  ONLINE: "دفع إلكتروني",
  OTHER: "أخرى",
};
