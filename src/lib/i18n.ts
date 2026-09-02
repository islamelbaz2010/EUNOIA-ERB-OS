export type Locale = "en" | "ar";
export const locales: Locale[] = ["en", "ar"];
export const defaultLocale: Locale = "en";

let activeLocale: Locale = defaultLocale;
const listeners: Array<() => void> = [];

export function getLocale(): Locale {
  return activeLocale;
}

export function setLocale(locale: Locale) {
  if (locale === activeLocale) return;
  activeLocale = locale;
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
  }
  listeners.forEach((cb) => cb());
}

export function subscribeLocale(callback: () => void): () => void {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index >= 0) listeners.splice(index, 1);
  };
}

export function isRTL(locale?: Locale): boolean {
  return (locale ?? activeLocale) === "ar";
}

export const localeLabel: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
};

const en = {
  app: { name: "EUNOIA ERB OS", tagline: "Business Operating System" },
  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    add: "Add",
    search: "Search...",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    menu: "Menu",
    noRecords: "No records found",
    close: "Close",
    submit: "Submit",
    confirm: "Confirm",
    active: "Active",
    inactive: "Inactive",
    yes: "Yes",
    no: "No",
    signOut: "Sign Out",
    profile: "Profile",
    language: "Language",
    notifications: "Notifications",
    markAsRead: "Mark as read",
    noNotifications: "No notifications",
    english: "English",
    arabic: "العربية",
    all: "All",
    status: "Status",
    actions: "Actions",
    date: "Date",
    amount: "Amount",
    name: "Name",
    total: "Total",
    notes: "Notes",
    subtotal: "Subtotal",
    outstanding: "Outstanding",
    paid: "Paid",
    operations: "Operations",
    insights: "Insights",
    firstName: "First Name",
    lastName: "Last Name",
    phone: "Phone",
    jobTitle: "Job Title",
    select: "Select",
    fixed: "Fixed",
    reference: "Reference",
  },
  nav: {
    dashboard: "Dashboard",
    employees: "Employees",
    attendance: "Attendance",
    payroll: "Payroll",
    clients: "Clients",
    services: "Services",
    invoices: "Invoices",
    reports: "Reports",
    admin: "Administration",
  },
  auth: {
    signIn: "Sign In",
    email: "Email",
    password: "Password",
    incorrect: "Incorrect email or password",
    error: "An error occurred while signing in",
    signingIn: "Signing in...",
  },
  profile: {
    title: "Profile",
    accountInfo: "Account Information",
    yourAccount: "Your account information",
    name: "Name",
    email: "Email",
    role: "Role",
    status: "Account Status",
    language: "Language Preference",
    linkedEmployee: "Linked Employee",
    adminOnly:
      "No employee record is linked to this account. This account is for administrative use only.",
    viewFull: "View Full Employee Record",
    employeeCode: "Employee Code",
    jobTitle: "Job Title",
    branch: "Branch",
  },
  payroll: {
    title: "Payroll",
    subtitle: "Manage payroll periods and calculations",
    periods: "Payroll Periods",
    calculate: "Calculate",
    records: "Records",
    name: "Name",
    from: "From",
    to: "To",
    employees: "Employees",
    gross: "Gross",
    net: "Net",
    status: "Status",
    actions: "Actions",
    view: "View",
    sendReview: "Send for review",
    selectPeriod: "Select period",
    approve: "Approve",
    lock: "Lock permanently",
    calculateAction: "Start Calculation",
    noDraft:
      'There are no Draft payroll periods ready to calculate. Periods that have already been calculated can be tracked from the "Periods" or "Records" tab.',
    noRecords: "Select a period to view its records",
    noPeriods: "No payroll periods found",
    calculationCompleted: "Calculation completed successfully",
    periodApproved: "Period approved",
    periodLocked: "Period locked permanently",
    periodSentReview: "Period sent for review",
    baseSalary: "Base Salary",
    additions: "Additions",
    deductions: "Deductions",
  },
  employees: {
    title: "Employees",
    subtitle: "Manage your employee records",
    add: "Add Employee",
    list: "Employee List",
    code: "Code",
    name: "Name",
    department: "Department",
    branch: "Branch",
    status: "Status",
    noEmployees: "No employees found",
    deactivate: "Deactivate",
    delete: "Delete",
    deleteBlocked: "Cannot delete employee: {reason}",
    deleteConfirm: "Are you sure? This action cannot be undone.",
    deactivated: "Employee deactivated successfully",
    added: "Employee added successfully",
  },
  invoices: {
    title: "Invoices",
    subtitle: "Manage invoices and payments",
    create: "Create Invoice",
    list: "Invoice List",
    invoiceNo: "Invoice #",
    client: "Client",
    date: "Invoice Date",
    dueDate: "Due Date",
    amount: "Amount",
    paid: "Paid",
    status: "Status",
    noInvoices: "No invoices found",
    downloadPdf: "Download PDF",
    recordPayment: "Record Payment",
    issueDate: "Issue Date",
    financialSummary: "Financial Summary",
    subtotal: "Subtotal",
    discount: "Discount",
    markup: "Marketing Agency Markup",
    vat: "VAT",
    total: "Total",
    outstanding: "Outstanding",
    lineItems: "Line Items",
    description: "Description",
    qty: "Qty",
    unitPrice: "Unit Price",
    item: "Item",
    addItem: "Add Item",
    notes: "Notes",
    paymentTerms: "Payment Terms",
    paymentPolicy: "Payment Policy",
    saveDraft: "Save as Draft",
    sendInvoice: "Send Invoice",
    missingClient: "Please select a client",
    missingLineItem: "Add at least one line item",
    missingDueDate: "Due date is required",
    paymentRecorded: "Payment recorded successfully",
  },
  clients: { title: "Clients" },
  services: { title: "Services" },
  attendance: { title: "Attendance" },
  reports: { title: "Reports" },
  admin: {
    title: "Administration",
    companyInfo: "Company Information",
    paymentPolicy: "Payment Policy",
    saved: "Saved successfully",
  },
  status: {
    payroll: {
      DRAFT: "Draft",
      CALCULATED: "Calculated",
      UNDER_REVIEW: "Under Review",
      APPROVED: "Approved",
      LOCKED: "Locked",
    },
    payrollRecord: {
      DRAFT: "Draft",
      CALCULATED: "Calculated",
      REVIEWED: "Reviewed",
      APPROVED: "Approved",
      PAID: "Paid",
    },
    invoice: {
      DRAFT: "Draft",
      SENT: "Sent",
      VIEWED: "Viewed",
      PARTIALLY_PAID: "Partially Paid",
      PAID: "Paid",
      OVERDUE: "Overdue",
      CANCELLED: "Cancelled",
    },
    employee: {
      ACTIVE: "Active",
      ON_LEAVE: "On Leave",
      TERMINATED: "Terminated",
      SUSPENDED: "Suspended",
    },
    paymentMethod: {
      CASH: "Cash",
      BANK_TRANSFER: "Bank Transfer",
      CHECK: "Check",
      CREDIT_CARD: "Credit Card",
      ONLINE: "Online Payment",
      OTHER: "Other",
    },
  },
  notification: {
    title: "Notifications",
    empty: "No notifications",
    recentActivity: "Recent activity",
  },
  dashboard: {
    title: "Dashboard",
    welcome: "Welcome to the EUNOIA ERB OS",
    totalEmployees: "Total Employees",
    todayAttendance: "Today's Attendance",
    lateToday: "Late Today",
    absentToday: "Absent Today",
    pendingExceptions: "Pending Exceptions",
    outstandingInvoices: "Outstanding Invoices",
    overdueInvoices: "Overdue Invoices",
    recentActivity: "Recent Activity",
    noRecentActivity: "No recent activity",
    payment: "Payment",
    paymentMessage: "Payment of {amount} recorded for invoice {invoiceNumber}",
  },
};

const ar = {
  app: { name: "EUNOIA ERB OS", tagline: "نظام تشغيل الأعمال" },
  common: {
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    view: "عرض",
    add: "إضافة",
    search: "بحث...",
    loading: "جاري التحميل...",
    error: "خطأ",
    success: "تم بنجاح",
    menu: "القائمة",
    noRecords: "لا توجد سجلات",
    close: "إغلاق",
    submit: "إرسال",
    confirm: "تأكيد",
    active: "نشط",
    inactive: "غير نشط",
    yes: "نعم",
    no: "لا",
    signOut: "تسجيل الخروج",
    profile: "الملف الشخصي",
    language: "اللغة",
    notifications: "الإشعارات",
    markAsRead: "تحديد كمقروء",
    noNotifications: "لا توجد إشعارات",
    english: "English",
    arabic: "العربية",
    all: "الكل",
    status: "الحالة",
    actions: "الإجراءات",
    date: "التاريخ",
    amount: "المبلغ",
    name: "الاسم",
    total: "الإجمالي",
    notes: "ملاحظات",
    subtotal: "المجموع الفرعي",
    outstanding: "المتبقي",
    paid: "المدفوع",
    operations: "العمليات",
    insights: "الرؤى",
    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    phone: "الهاتف",
    jobTitle: "المسمى الوظيفي",
    select: "اختر",
    fixed: "ثابت",
    reference: "المرجع",
  },
  nav: {
    dashboard: "لوحة التحكم",
    employees: "الموظفين",
    attendance: "الحضور",
    payroll: "الرواتب",
    clients: "العملاء",
    services: "الخدمات",
    invoices: "الفواتير",
    reports: "التقارير",
    admin: "الإدارة",
  },
  auth: {
    signIn: "تسجيل الدخول",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    incorrect: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    error: "حدث خطأ أثناء تسجيل الدخول",
    signingIn: "جاري تسجيل الدخول...",
  },
  profile: {
    title: "الملف الشخصي",
    accountInfo: "معلومات الحساب",
    yourAccount: "معلومات حسابك",
    name: "الاسم",
    email: "البريد الإلكتروني",
    role: "الدور",
    status: "حالة الحساب",
    language: "تفضيل اللغة",
    linkedEmployee: "الموظف المرتبط",
    adminOnly:
      "لا يوجد سجل موظف مرتبط بهذا الحساب. هذا الحساب للاستخدام الإداري فقط.",
    viewFull: "عرض سجل الموظف كاملاً",
    employeeCode: "كود الموظف",
    jobTitle: "المسمى الوظيفي",
    branch: "الفرع",
  },
  payroll: {
    title: "الرواتب",
    subtitle: "إدارة فترات الرواتب والحسابات",
    periods: "فترات الرواتب",
    calculate: "حساب",
    records: "السجلات",
    name: "الاسم",
    from: "من",
    to: "إلى",
    employees: "الموظفين",
    gross: "الإجمالي",
    net: "الصافي",
    status: "الحالة",
    actions: "الإجراءات",
    view: "عرض",
    sendReview: "إرسال للمراجعة",
    approve: "اعتماد",
    lock: "قفل نهائي",
    calculateAction: "بدء الحساب",
    selectPeriod: "اختر الفترة",
    noDraft:
      'لا توجد فترات رواتب مسودة جاهزة للحساب. يمكن متابعة الفترات المحسوبة من "الفترات" أو "السجلات".',
    noRecords: "اختر فترة لعرض سجلاتها",
    noPeriods: "لا توجد فترات رواتب",
    calculationCompleted: "تم إكمال الحساب بنجاح",
    periodApproved: "تم اعتماد الفترة",
    periodLocked: "تم قفل الفترة نهائياً",
    periodSentReview: "تم إرسال الفترة للمراجعة",
    baseSalary: "الراتب الأساسي",
    additions: "الإضافات",
    deductions: "الخصومات",
  },
  employees: {
    title: "الموظفين",
    subtitle: "إدارة سجلات الموظفين",
    add: "إضافة موظف",
    list: "قائمة الموظفين",
    code: "الكود",
    name: "الاسم",
    department: "القسم",
    branch: "الفرع",
    status: "الحالة",
    noEmployees: "لا يوجد موظفين",
    deactivate: "إلغاء التفعيل",
    delete: "حذف",
    deleteBlocked: "لا يمكن حذف الموظف: {reason}",
    deleteConfirm: "هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.",
    deactivated: "تم إلغاء تفعيل الموظف بنجاح",
    added: "تم إضافة الموظف بنجاح",
  },
  invoices: {
    title: "الفواتير",
    subtitle: "إدارة الفواتير والمدفوعات",
    create: "إنشاء فاتورة",
    list: "قائمة الفواتير",
    invoiceNo: "رقم الفاتورة",
    client: "العميل",
    date: "تاريخ الفاتورة",
    dueDate: "تاريخ الاستحقاق",
    amount: "المبلغ",
    paid: "المدفوع",
    status: "الحالة",
    noInvoices: "لا توجد فواتير",
    downloadPdf: "تحميل PDF",
    recordPayment: "تسجيل دفعة",
    issueDate: "تاريخ الإصدار",
    financialSummary: "الملخص المالي",
    subtotal: "المجموع الفرعي",
    discount: "خصم",
    markup: "عمولة الوكالة التسويقية",
    vat: "ضريبة القيمة المضافة",
    total: "الإجمالي",
    outstanding: "المتبقي",
    lineItems: "بنود الفاتورة",
    description: "الوصف",
    qty: "الكمية",
    unitPrice: "سعر الوحدة",
    item: "بند",
    addItem: "إضافة بند",
    notes: "ملاحظات",
    paymentTerms: "شروط الدفع",
    paymentPolicy: "سياسة الدفع",
    saveDraft: "حفظ كمسودة",
    sendInvoice: "إرسال الفاتورة",
    missingClient: "يرجى اختيار عميل",
    missingLineItem: "أضف بندًا واحدًا على الأقل",
    missingDueDate: "تاريخ الاستحقاق مطلوب",
    paymentRecorded: "تم تسجيل الدفعة بنجاح",
  },
  clients: { title: "العملاء" },
  services: { title: "الخدمات" },
  attendance: { title: "الحضور" },
  reports: { title: "التقارير" },
  admin: {
    title: "الإدارة",
    companyInfo: "معلومات الشركة",
    paymentPolicy: "سياسة الدفع",
    saved: "تم الحفظ بنجاح",
  },
  status: {
    payroll: {
      DRAFT: "مسودة",
      CALCULATED: "محسوبة",
      UNDER_REVIEW: "قيد المراجعة",
      APPROVED: "معتمدة",
      LOCKED: "مقفولة",
    },
    payrollRecord: {
      DRAFT: "مسودة",
      CALCULATED: "محسوبة",
      REVIEWED: "تمت مراجعتها",
      APPROVED: "معتمدة",
      PAID: "مدفوع",
    },
    invoice: {
      DRAFT: "مسودة",
      SENT: "مرسلة",
      VIEWED: "تمت مشاهدتها",
      PARTIALLY_PAID: "مدفوعة جزئياً",
      PAID: "مدفوعة",
      OVERDUE: "متأخرة",
      CANCELLED: "ملغاة",
    },
    employee: {
      ACTIVE: "نشط",
      ON_LEAVE: "في إجازة",
      TERMINATED: "منتهي",
      SUSPENDED: "موقوف",
    },
    paymentMethod: {
      CASH: "نقدي",
      BANK_TRANSFER: "تحويل بنكي",
      CHECK: "شيك",
      CREDIT_CARD: "بطاقة ائتمان",
      ONLINE: "دفع إلكتروني",
      OTHER: "أخرى",
    },
  },
  notification: {
    title: "الإشعارات",
    empty: "لا توجد إشعارات",
    recentActivity: "النشاط الأخير",
  },
  dashboard: {
    title: "لوحة التحكم",
    welcome: "مرحبًا بك في نظام EUNOIA لإدارة الأعمال",
    totalEmployees: "إجمالي الموظفين",
    todayAttendance: "حضور اليوم",
    lateToday: "المتأخرون اليوم",
    absentToday: "الغائبون اليوم",
    pendingExceptions: "استثناءات معلقة",
    outstandingInvoices: "فواتير مستحقة",
    overdueInvoices: "فواتير متأخرة السداد",
    recentActivity: "النشاط الأخير",
    noRecentActivity: "لا يوجد نشاط حديث",
    payment: "دفعة",
    paymentMessage: "تم تسجيل دفعة بقيمة {amount} للفاتورة {invoiceNumber}",
  },
};

const dictionaries: Record<Locale, any> = { en, ar };

export function t(key: string, locale?: Locale): string {
  const dict = dictionaries[locale ?? activeLocale] ?? en;
  const parts = key.split(".");
  let value: any = dict;
  for (const part of parts) {
    if (value && typeof value === "object") {
      value = value[part];
    } else {
      return key;
    }
  }
  return typeof value === "string" ? value : key;
}

export function tReplace(key: string, values: Record<string, string>): string {
  let text = t(key);
  for (const [k, v] of Object.entries(values)) {
    text = text.replace(`{${k}}`, v);
  }
  return text;
}

export function formatCurrency(
  amount: number,
  currency = "EGP",
  locale?: Locale
): string {
  return new Intl.NumberFormat(locale ?? activeLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number, locale?: Locale): string {
  return new Intl.NumberFormat(locale ?? activeLocale).format(num);
}

export function formatDate(
  date: Date | string,
  locale?: Locale
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale ?? activeLocale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTime(date: Date | string, locale?: Locale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(locale ?? activeLocale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
