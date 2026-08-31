export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AttendanceCalculationResult {
  employeeId: string;
  date: string;
  scheduledStart: string;
  scheduledEnd: string;
  firstIn: Date | null;
  lastOut: Date | null;
  workMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  status: string;
}

export interface PayrollCalculationResult {
  employeeId: string;
  baseSalary: number;
  totalAdditions: number;
  totalDeductions: number;
  attendanceDeductions: number;
  overtime: number;
  gross: number;
  net: number;
  components: PayrollComponentItem[];
  attendanceSummary: {
    totalWorkDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    overtimeDays: number;
    leaveDays: number;
    holidayDays: number;
  };
}

export interface PayrollComponentItem {
  type: string;
  name: string;
  nameAr?: string;
  amount: number;
  description?: string;
}

export interface InvoiceCalculationResult {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  vatEnabled: boolean;
  vatRate: number;
  vatAmount: number;
  total: number;
}
