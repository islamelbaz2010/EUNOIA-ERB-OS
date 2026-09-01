const React = require("react");
const {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Image,
} = require("@react-pdf/renderer");
const fs = require("fs");
const path = require("path");

const CI = {
  primary: "#C41E4A",
  teal: "#1A6B5C",
  dark: "#1a1a2e",
  text: "#333333",
  muted: "#666666",
  light: "#f8f9fa",
  border: "#e2e8f0",
  white: "#ffffff",
};

const s = StyleSheet.create({
  page: { padding: 50, fontSize: 10, fontFamily: "Helvetica", color: CI.text },
  coverPage: {
    padding: 0,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: CI.text,
    justifyContent: "center",
    alignItems: "center",
  },
  coverBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: CI.primary,
  },
  coverAccent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: CI.teal,
  },
  coverContent: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    zIndex: 1,
  },
  coverTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: CI.white,
    marginBottom: 8,
    letterSpacing: 2,
  },
  coverSubtitle: {
    fontSize: 14,
    color: CI.white,
    opacity: 0.9,
    marginBottom: 40,
    letterSpacing: 4,
  },
  coverSystem: {
    fontSize: 22,
    fontWeight: "bold",
    color: CI.white,
    marginBottom: 6,
  },
  coverDocType: {
    fontSize: 16,
    color: CI.white,
    opacity: 0.85,
    marginBottom: 30,
  },
  coverDate: {
    fontSize: 11,
    color: CI.white,
    opacity: 0.7,
  },
  tocPage: { padding: 50, fontSize: 10, fontFamily: "Helvetica", color: CI.text },
  tocTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: CI.primary,
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: CI.primary,
  },
  tocSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: CI.border,
  },
  tocNum: { width: 30, fontWeight: "bold", color: CI.primary },
  tocLabel: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: CI.primary,
  },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 8, color: CI.muted },
  headerRight: { alignItems: "flex-end" },
  headerBrand: { fontSize: 10, fontWeight: "bold", color: CI.primary },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: CI.primary,
    marginTop: 20,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: CI.primary,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: CI.dark,
    marginTop: 14,
    marginBottom: 6,
  },
  bodyText: { fontSize: 10, lineHeight: 1.6, marginBottom: 6 },
  bulletItem: { flexDirection: "row", marginBottom: 4, paddingLeft: 15 },
  bulletDot: { width: 15, fontSize: 10, color: CI.primary },
  bulletText: { flex: 1, fontSize: 10, lineHeight: 1.5 },
  table: { marginBottom: 12 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: CI.primary,
    color: CI.white,
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: CI.border,
    fontSize: 9,
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: CI.border,
    backgroundColor: CI.light,
    fontSize: 9,
  },
  callout: {
    backgroundColor: CI.light,
    borderLeftWidth: 3,
    borderLeftColor: CI.primary,
    padding: 10,
    marginBottom: 10,
    borderRadius: 3,
  },
  calloutTitle: { fontSize: 10, fontWeight: "bold", color: CI.primary, marginBottom: 4 },
  calloutText: { fontSize: 9, lineHeight: 1.5, color: CI.muted },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: CI.muted,
    borderTopWidth: 0.5,
    borderTopColor: CI.border,
    paddingTop: 8,
  },
  col1: { flex: 1 },
  col2: { flex: 2 },
  col3: { flex: 3 },
  bold: { fontWeight: "bold" },
  pageBreak: { marginTop: 0 },
});

const h = (page, num) =>
  React.createElement(
    View,
    { style: s.header, fixed: true },
    React.createElement(
      View,
      { style: s.headerLeft },
      React.createElement(Text, { style: s.headerTitle }, "EUNOIA ERB OS — Training Guide")
    ),
    React.createElement(
      View,
      { style: s.headerRight },
      React.createElement(Text, { style: s.headerBrand }, "EUNOIA ZONES AGENCY")
    )
  );

const f = (page, total) =>
  React.createElement(
    View,
    { style: s.footer, fixed: true },
    React.createElement(Text, null, `Page ${page}`),
    React.createElement(Text, null, "Confidential — EUNOIA ZONES AGENCY")
  );

const bullet = (text) =>
  React.createElement(View, { style: s.bulletItem, key: text.substring(0, 30) },
    React.createElement(Text, { style: s.bulletDot }, "\u2022"),
    React.createElement(Text, { style: s.bulletText }, text)
  );

const tableRow = (cols, i, widths) =>
  React.createElement(View, { style: i === 0 ? s.tableHeader : (i % 2 === 0 ? s.tableRowAlt : s.tableRow), key: i },
    cols.map((c, j) =>
      React.createElement(Text, {
        key: j,
        style: i === 0 ? { flex: widths[j], color: CI.white, fontWeight: "bold", fontSize: 9 } : { flex: widths[j], fontSize: 9 },
      }, c)
    )
  );

const callout = (title, text) =>
  React.createElement(View, { style: s.callout },
    React.createElement(Text, { style: s.calloutTitle }, title),
    React.createElement(Text, { style: s.calloutText }, text)
  );

let pageNum = 2;

function section(title, children) {
  return React.createElement(View, { key: title },
    React.createElement(Text, { style: s.sectionTitle }, title),
    ...children
  );
}

function subsection(title, children) {
  return React.createElement(View, { key: title },
    React.createElement(Text, { style: s.subsectionTitle }, title),
    ...children
  );
}

function p(text) {
  return React.createElement(Text, { style: s.bodyText, key: text.substring(0, 20) }, text);
}

// BUILD DOCUMENT
const children = [];

// COVER PAGE
children.push(
  React.createElement(Page, { size: "A4", style: s.coverPage, key: "cover" },
    React.createElement(View, { style: s.coverBg }),
    React.createElement(View, { style: s.coverAccent }),
    React.createElement(View, { style: s.coverContent },
      React.createElement(Text, { style: s.coverTitle }, "EUNOIA ZONES"),
      React.createElement(Text, { style: s.coverSubtitle }, "A G E N C Y"),
      React.createElement(Text, { style: s.coverSystem }, "ERB OS"),
      React.createElement(Text, { style: s.coverDocType }, "System Training & User Guide"),
      React.createElement(Text, { style: s.coverDate }, "Version 1.0 — September 2026")
    )
  )
);

// TABLE OF CONTENTS
const tocItems = [
  "System Overview",
  "Getting Started",
  "User Roles & Permissions",
  "Dashboard",
  "Employee Management",
  "Salary Profiles",
  "Work Schedules",
  "Attendance",
  "Fingerprint Excel Import",
  "Attendance Exceptions",
  "Leave Management",
  "Payroll",
  "Payroll Approval & Locking",
  "Payslips",
  "Client Management",
  "Services",
  "Invoicing",
  "Payment Schedules & Installments",
  "Reports",
  "Administration",
  "Troubleshooting",
  "Quick Reference",
  "Security & Data Handling",
];

children.push(
  React.createElement(Page, { size: "A4", style: s.tocPage, key: "toc" },
    h(1),
    React.createElement(Text, { style: s.tocTitle }, "Table of Contents"),
    tocItems.map((item, i) =>
      React.createElement(View, { style: s.tocSection, key: i },
        React.createElement(Text, { style: s.tocNum }, String(i + 1).padStart(2, "0")),
        React.createElement(Text, { style: s.tocLabel }, item)
      )
    ),
    f(1)
  )
);

// SECTION 1: System Overview
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s1" },
    h(2),
    section("1. System Overview", [
      p("EUNOIA ERB OS is the internal business operations system for EUNOIA ZONES AGENCY. It replaces fragmented manual workflows with a single integrated platform."),
      subsection("Major Modules", [
        bullet("Employee Management — records, salary profiles, work schedules"),
        bullet("Attendance — fingerprint Excel import, punch processing, exceptions"),
        bullet("Leave Management — leave types, requests, approvals"),
        bullet("Payroll — calculation, approval, locking, payslip generation"),
        bullet("Invoicing — clients, services, invoices, VAT, payment schedules"),
        bullet("Payments — payment recording, installment tracking"),
        bullet("Reports — attendance, payroll, invoice reports"),
        bullet("Administration — settings, schedules, holidays, audit logs"),
      ]),
      subsection("Key Business Rules", [
        bullet("Working days: Sunday\u2013Thursday (configurable)"),
        bullet("Working hours: 10:30\u201318:30 (configurable)"),
        bullet("Grace period: 15 minutes (configurable)"),
        bullet("Currency: SAR (Saudi Riyal)"),
        bullet("VAT: 15% default, configurable per invoice"),
        bullet("All financial calculations are server-side"),
      ]),
    ]),
    f(2)
  )
);

// SECTION 2: Getting Started
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s2" },
    h(3),
    section("2. Getting Started", [
      subsection("Login", [
        p("1. Open your web browser and navigate to the EUNOIA ERB OS URL."),
        p("2. Enter your email address and password."),
        p("3. Click Login. You will be redirected to the Dashboard."),
      ]),
      subsection("Navigation", [
        p("After login, the screen shows:"),
        bullet("Sidebar (left) \u2014 navigation menu with all modules"),
        bullet("Header (top) \u2014 user info and logout button"),
        bullet("Main Content \u2014 the current page"),
      ]),
      subsection("Sidebar Sections", [
        tableRow(["Section", "Items", ""], 0, [1, 2, 0]),
        tableRow(["Main", "Dashboard, Employees, Attendance, Payroll", ""], 1, [1, 2, 0]),
        tableRow(["Business", "Clients, Services, Invoices", ""], 2, [1, 2, 0]),
        tableRow(["Analytics", "Reports, Admin", ""], 3, [1, 2, 0]),
      ]),
    ]),
    f(3)
  )
);

// SECTION 3: User Roles
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s3" },
    h(4),
    section("3. User Roles & Permissions", [
      p("The system has six roles. Each role determines what you can see and do."),
      tableRow(["Role", "Purpose", "Key Access"], 0, [1.2, 2, 3]),
      tableRow(["ADMIN", "Full system access", "Everything"], 1, [1.2, 2, 3]),
      tableRow(["HR", "Employee management", "Employees, attendance, payroll (calculate)"], 2, [1.2, 2, 3]),
      tableRow(["FINANCE", "Financial operations", "Invoices, payments, payroll (approve/lock)"], 3, [1.2, 2, 3]),
      tableRow(["MANAGER", "Team oversight", "View employees, reports"], 4, [1.2, 2, 3]),
      tableRow(["EMPLOYEE", "Self-service", "Own attendance, payslips"], 5, [1.2, 2, 3]),
      tableRow(["VIEWER", "Read-only", "Dashboards, reports"], 6, [1.2, 2, 3]),
      callout("Important", "Only ADMIN can create new user accounts. Financial operations (invoices, payments, payroll approval) require ADMIN or FINANCE role."),
    ]),
    f(4)
  )
);

// SECTION 4: Dashboard
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s4" },
    h(5),
    section("4. Dashboard", [
      p("The Dashboard is the first screen after login. It shows key business metrics at a glance."),
      subsection("Key Metrics", [
        tableRow(["Metric", "Description"], 0, [2, 4]),
        tableRow(["Total Employees", "Number of employees in the system"], 1, [2, 4]),
        tableRow(["Active Employees", "Currently employed staff"], 2, [2, 4]),
        tableRow(["Today's Attendance", "Employees with attendance today"], 3, [2, 4]),
        tableRow(["Late Today", "Employees who arrived late"], 4, [2, 4]),
        tableRow(["Absent Today", "Employees marked absent"], 5, [2, 4]),
        tableRow(["Pending Exceptions", "Awaiting review"], 6, [2, 4]),
        tableRow(["Outstanding Invoices", "Invoices with pending payments"], 7, [2, 4]),
        tableRow(["Overdue Invoices", "Past their due date"], 8, [2, 4]),
      ]),
    ]),
    f(5)
  )
);

// SECTION 5: Employee Management
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s5" },
    h(6),
    section("5. Employee Management", [
      p("Navigate to: Sidebar \u2192 Employees"),
      subsection("Creating an Employee", [
        p("1. Click Add Employee."),
        p("2. Fill in required information:"),
        bullet("Personal: First/Last name, phone, national ID, gender, address"),
        bullet("Employment: Employee code, department, job title, join date"),
        bullet("Fingerprint ID: For matching fingerprint imports"),
        p("3. Click Save."),
      ]),
      subsection("Employment Status", [
        tableRow(["Status", "Meaning"], 0, [2, 4]),
        tableRow(["ACTIVE", "Currently employed, included in payroll"], 1, [2, 4]),
        tableRow(["ON_LEAVE", "Temporarily away"], 2, [2, 4]),
        tableRow(["TERMINATED", "No longer employed"], 3, [2, 4]),
        tableRow(["SUSPENDED", "Temporarily suspended"], 4, [2, 4]),
      ]),
      callout("Important", "When adding an employee, ensure the salary profile is also created with the correct base salary and components."),
    ]),
    f(6)
  )
);

// SECTION 6: Salary Profiles
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s6" },
    h(7),
    section("6. Salary Profiles", [
      p("Each employee has a salary profile with base salary and components."),
      subsection("Salary Components", [
        tableRow(["Type", "Example", "Effect"], 0, [1.5, 2.5, 2.5]),
        tableRow(["ALLOWANCE", "Housing Allowance", "Added to gross"], 1, [1.5, 2.5, 2.5]),
        tableRow(["BONUS", "Performance Bonus", "Added to gross"], 2, [1.5, 2.5, 2.5]),
        tableRow(["DEDUCTION", "Loan Repayment", "Deducted from net"], 3, [1.5, 2.5, 2.5]),
        tableRow(["ADVANCE", "Salary Advance", "Deducted from net"], 4, [1.5, 2.5, 2.5]),
      ]),
      subsection("Effective Dating", [
        p("Salary profiles have effective dates. When a salary is updated:"),
        bullet("The old profile gets an effectiveTo date"),
        bullet("The new profile starts from the effectiveFrom date"),
        bullet("Payroll uses the profile active for the pay period"),
        p("This preserves complete salary history."),
      ]),
    ]),
    f(7)
  )
);

// SECTION 7: Work Schedules
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s7" },
    h(8),
    section("7. Work Schedules", [
      p("Navigate to: Sidebar \u2192 Admin \u2192 Work Schedules"),
      p("A work schedule defines working days, start/end times, grace period, and overtime rules."),
      subsection("Default Schedule", [
        bullet("Working Days: Sunday, Monday, Tuesday, Wednesday, Thursday"),
        bullet("Rest Days: Friday, Saturday"),
        bullet("Start Time: 10:30"),
        bullet("End Time: 18:30"),
        bullet("Grace Period: 15 minutes"),
        bullet("Overtime: Enabled (30-min minimum, 180-min max)"),
      ]),
      callout("Note", "Work schedules are fully configurable. The system uses the assigned schedule to calculate attendance \u2014 it is not hardcoded to any specific day pattern."),
    ]),
    f(8)
  )
);

// SECTION 8: Attendance
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s8" },
    h(9),
    section("8. Attendance", [
      subsection("Attendance Lifecycle", [
        p("Fingerprint Device \u2192 Excel Export \u2192 Upload to System \u2192 Raw Records \u2192 Employee Matching \u2192 Punch Normalization \u2192 Attendance Day Calculation \u2192 Review Exceptions \u2192 Payroll"),
      ]),
      subsection("Key Concepts", [
        tableRow(["Term", "Definition"], 0, [2, 4.5]),
        tableRow(["Punch", "A single fingerprint scan (IN or OUT)"], 1, [2, 4.5]),
        tableRow(["Attendance Day", "Calculated summary for one employee on one day"], 2, [2, 4.5]),
        tableRow(["Late", "Check-in after grace period"], 3, [2, 4.5]),
        tableRow(["Early Departure", "Check-out before scheduled end time"], 4, [2, 4.5]),
        tableRow(["Overtime", "Work beyond scheduled hours (if enabled)"], 5, [2, 4.5]),
        tableRow(["Exception", "Special circumstance requiring review"], 6, [2, 4.5]),
      ]),
    ]),
    f(9)
  )
);

// SECTION 9: Fingerprint Import
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s9" },
    h(10),
    section("9. Fingerprint Excel Import", [
      p("Navigate to: Sidebar \u2192 Attendance"),
      subsection("Step-by-Step", [
        p("1. Obtain the fingerprint export from your device (.xls, .xlsx, or .csv)."),
        p("2. Go to Attendance \u2192 Import Fingerprint Data."),
        p("3. Upload the file (max 10MB)."),
        p("4. The system auto-detects columns (English and Arabic headers supported)."),
        p("5. Review results: total rows, valid, invalid, unmatched."),
      ]),
      subsection("Supported Column Formats", [
        tableRow(["Column", "Supported Names"], 0, [2, 4.5]),
        tableRow(["Employee ID", "Employee ID, ID, empNo, \u0631\u0642\u0645 \u0627\u0644\u0645\u0648\u0638\u0641"], 1, [2, 4.5]),
        tableRow(["Punch Time", "Punch Time, Time, Date, \u0627\u0644\u062a\u0627\u0631\u064a\u062e"], 2, [2, 4.5]),
        tableRow(["Employee Name", "Name, Employee Name, \u0627\u0644\u0627\u0633\u0645"], 3, [2, 4.5]),
      ]),
      subsection("Employee Matching", [
        p("The system matches records using:"),
        p("1. Employee Code \u2014 exact match to the employee code in the system."),
        p("2. Employee Name \u2014 fallback matching by first and last name."),
        callout("Tip", "If employees are not matched, verify the employee code in the fingerprint export matches the system. You may need to update the fingerprintId field."),
      ]),
    ]),
    f(10)
  )
);

// SECTION 10: Attendance Exceptions
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s10" },
    h(11),
    section("10. Attendance Exceptions", [
      p("An exception is a recorded deviation from normal attendance that needs review."),
      subsection("Exception Types", [
        tableRow(["Type", "Description"], 0, [2.5, 4]),
        tableRow(["LATE_ARRIVAL", "Arrived after grace period"], 1, [2.5, 4]),
        tableRow(["EARLY_DEPARTURE", "Left before scheduled end"], 2, [2.5, 4]),
        tableRow(["MISSED_FINGERPRINT", "Device malfunction"], 3, [2.5, 4]),
        tableRow(["FORGOTTEN_PUNCH", "Employee forgot to punch"], 4, [2.5, 4]),
        tableRow(["BUSINESS_TRIP", "Approved business trip"], 5, [2.5, 4]),
        tableRow(["WORK_FROM_HOME", "Working from home"], 6, [2.5, 4]),
        tableRow(["APPROVED_ABSENCE", "Pre-approved absence"], 7, [2.5, 4]),
      ]),
      subsection("Reviewing Exceptions", [
        p("1. Go to Attendance \u2192 Exceptions."),
        p("2. Review the employee name, date, type, and reason."),
        p("3. Click Approve or Reject."),
        p("Approved exceptions affect attendance and payroll calculations."),
      ]),
    ]),
    f(11)
  )
);

// SECTION 11: Leave Management
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s11" },
    h(12),
    section("11. Leave Management", [
      subsection("Leave Types", [
        tableRow(["Type", "Default Days", "Paid", "Affects Payroll"], 0, [2, 1.2, 0.8, 2.5]),
        tableRow(["Annual Leave", "21", "Yes", "Yes"], 1, [2, 1.2, 0.8, 2.5]),
        tableRow(["Sick Leave", "30", "Yes", "No"], 2, [2, 1.2, 0.8, 2.5]),
        tableRow(["Unpaid Leave", "0", "No", "Yes"], 3, [2, 1.2, 0.8, 2.5]),
      ]),
      subsection("Leave and Payroll", [
        bullet("Paid leave: Employee receives normal salary"),
        bullet("Unpaid leave: Salary is deducted for leave days"),
        bullet("Sick leave: Typically does not affect payroll"),
      ]),
    ]),
    f(12)
  )
);

// SECTION 12: Payroll
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s12" },
    h(13),
    section("12. Payroll", [
      p("Navigate to: Sidebar \u2192 Payroll"),
      subsection("Payroll Lifecycle", [
        p("DRAFT \u2192 CALCULATED \u2192 UNDER_REVIEW \u2192 APPROVED \u2192 LOCKED"),
        tableRow(["Status", "Description"], 0, [2, 4.5]),
        tableRow(["DRAFT", "Period created, not yet calculated"], 1, [2, 4.5]),
        tableRow(["CALCULATED", "Payroll calculated for all employees"], 2, [2, 4.5]),
        tableRow(["UNDER_REVIEW", "Being reviewed by management"], 3, [2, 4.5]),
        tableRow(["APPROVED", "Approved and ready for payment"], 4, [2, 4.5]),
        tableRow(["LOCKED", "Finalized, cannot be changed"], 5, [2, 4.5]),
      ]),
      subsection("Calculation Components", [
        tableRow(["Component", "Formula"], 0, [2.5, 4]),
        tableRow(["Daily Salary", "Base Salary \u00f7 30"], 1, [2.5, 4]),
        tableRow(["Hourly Rate", "Base Salary \u00f7 30 \u00f7 8"], 2, [2.5, 4]),
        tableRow(["Overtime", "OT minutes \u00f7 60 \u00d7 Hourly Rate \u00d7 1.5"], 3, [2.5, 4]),
        tableRow(["Late Deduction", "Late minutes \u00f7 60 \u00d7 Hourly Rate"], 4, [2.5, 4]),
        tableRow(["Absence Deduction", "Absent days \u00d7 Daily Salary"], 5, [2.5, 4]),
        tableRow(["Gross", "Base + Additions + Overtime"], 6, [2.5, 4]),
        tableRow(["Net", "Gross \u2212 Deductions \u2212 Attendance Deductions"], 7, [2.5, 4]),
      ]),
    ]),
    f(13)
  )
);

// SECTION 13: Payroll Approval & Locking
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s13" },
    h(14),
    section("13. Payroll Approval & Locking", [
      p("Once locked, payroll records cannot be modified. This protects historical payment data and is required for financial compliance."),
      subsection("Approval Rules", [
        tableRow(["Role", "Calculate", "Approve", "Lock"], 0, [1.5, 1.5, 1.5, 1.5]),
        tableRow(["ADMIN", "Yes", "Yes", "Yes"], 1, [1.5, 1.5, 1.5, 1.5]),
        tableRow(["HR", "Yes", "No", "No"], 2, [1.5, 1.5, 1.5, 1.5]),
        tableRow(["FINANCE", "Yes", "Yes", "Yes"], 3, [1.5, 1.5, 1.5, 1.5]),
        tableRow(["Others", "No", "No", "No"], 4, [1.5, 1.5, 1.5, 1.5]),
      ]),
    ]),
    f(14)
  )
);

// SECTION 14: Payslips
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s14" },
    h(15),
    section("14. Payslips", [
      p("After payroll is approved, payslips can be generated for each employee."),
      subsection("Payslip Contents", [
        bullet("Company information (name, address, phone)"),
        bullet("Employee details (name, code, job title, department)"),
        bullet("Payroll period (name, date range)"),
        bullet("Earnings breakdown (base salary, overtime, allowances)"),
        bullet("Deductions breakdown (attendance, advances, penalties)"),
        bullet("Net salary"),
        bullet("Attendance summary"),
      ]),
      subsection("Generating a Payslip PDF", [
        p("1. Go to Payroll \u2192 select the period."),
        p("2. Click on an employee to view their payslip."),
        p("3. Click Download PDF."),
      ]),
    ]),
    f(15)
  )
);

// SECTION 15: Client Management
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s15" },
    h(16),
    section("15. Client Management", [
      p("Navigate to: Sidebar \u2192 Clients"),
      subsection("Creating a Client", [
        p("1. Click Add Client."),
        p("2. Fill in: name, contact person, phone, email, address, payment terms."),
        p("3. Click Save."),
      ]),
      subsection("Client Status", [
        tableRow(["Status", "Meaning"], 0, [2, 4.5]),
        tableRow(["ACTIVE", "Can be invoiced"], 1, [2, 4.5]),
        tableRow(["INACTIVE", "Not currently active"], 2, [2, 4.5]),
        tableRow(["BLOCKED", "Cannot be invoiced"], 3, [2, 4.5]),
      ]),
    ]),
    f(16)
  )
);

// SECTION 16: Services
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s16" },
    h(17),
    section("16. Services", [
      p("Navigate to: Sidebar \u2192 Services"),
      p("The services catalog lists all services your company offers. Each service has a name, description, default price, unit, and tax setting."),
      subsection("Creating a Service", [
        p("1. Click Add Service."),
        p("2. Enter name, description, default price, unit."),
        p("3. Toggle Tax Enabled if VAT applies."),
        p("4. Click Save."),
      ]),
    ]),
    f(17)
  )
);

// SECTION 17: Invoicing
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s17" },
    h(18),
    section("17. Invoicing", [
      p("Navigate to: Sidebar \u2192 Invoices"),
      subsection("Invoice Lifecycle", [
        p("DRAFT \u2192 SENT \u2192 VIEWED \u2192 PARTIALLY_PAID \u2192 PAID (or OVERDUE \u2192 CANCELLED)"),
      ]),
      subsection("Creating an Invoice", [
        p("1. Click New Invoice."),
        p("2. Select the Client."),
        p("3. Add Line Items (select service or enter custom description, quantity, price)."),
        p("4. Set Discount (optional)."),
        p("5. Toggle VAT on/off."),
        p("6. Set Payment Terms."),
        p("7. Click Save (creates as DRAFT)."),
      ]),
      subsection("Invoice Totals", [
        bullet("Subtotal: Sum of all line items"),
        bullet("Discount: Fixed amount deducted"),
        bullet("VAT Amount: (Subtotal \u2212 Discount) \u00d7 VAT Rate"),
        bullet("Total: Subtotal \u2212 Discount + VAT Amount"),
      ]),
    ]),
    f(18)
  )
);

// SECTION 18: Payment Schedules
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s18" },
    h(19),
    section("18. Payment Schedules & Installments", [
      p("Payment schedules divide an invoice total into installments with due dates."),
      subsection("Installment Status", [
        tableRow(["Status", "Meaning"], 0, [2, 4.5]),
        tableRow(["PENDING", "Not yet due"], 1, [2, 4.5]),
        tableRow(["PAID", "Fully paid"], 2, [2, 4.5]),
        tableRow(["OVERDUE", "Past due date"], 3, [2, 4.5]),
      ]),
      subsection("Recording Payments", [
        p("1. Open the invoice."),
        p("2. Click Record Payment."),
        p("3. Enter amount, date, method, reference."),
        p("4. Click Save."),
        p("Invoice status updates automatically (PARTIALLY_PAID or PAID)."),
      ]),
    ]),
    f(19)
  )
);

// SECTION 19: Reports
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s19" },
    h(20),
    section("19. Reports", [
      p("Navigate to: Sidebar \u2192 Reports"),
      subsection("Available Reports", [
        tableRow(["Report", "Purpose"], 0, [2, 4.5]),
        tableRow(["Attendance Report", "Employee attendance summary (present, absent, late, OT)"], 1, [2, 4.5]),
        tableRow(["Payroll Report", "Payroll breakdown by period (base, additions, deductions, net)"], 2, [2, 4.5]),
        tableRow(["Invoice Report", "Invoice summary (total invoiced, paid, outstanding)"], 3, [2, 4.5]),
        tableRow(["Payment Report", "Payment history (amounts, methods, dates)"], 4, [2, 4.5]),
        tableRow(["Revenue Report", "Company revenue from invoices"], 5, [2, 4.5]),
      ]),
      subsection("Using Reports", [
        p("1. Go to Reports."),
        p("2. Click the report type."),
        p("3. Set date range (From / To)."),
        p("4. Click Update."),
        p("5. View summary and detailed breakdown."),
      ]),
    ]),
    f(20)
  )
);

// SECTION 20: Administration
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s20" },
    h(21),
    section("20. Administration", [
      p("Navigate to: Sidebar \u2192 Admin (ADMIN role only)"),
      subsection("Company Settings", [
        bullet("Company name (English and Arabic)"),
        bullet("Contact information (email, phone, address)"),
        bullet("Tax and VAT numbers"),
        bullet("VAT rate (default: 15%)"),
        bullet("Currency (default: SAR)"),
      ]),
      subsection("Work Schedules", [
        bullet("Create and manage work schedules"),
        bullet("Set working days and hours"),
        bullet("Configure grace period and overtime rules"),
      ]),
      subsection("Holidays", [
        bullet("Add official holidays with name and date"),
        bullet("Mark as recurring (annual)"),
      ]),
      subsection("Leave Types", [
        bullet("Configure leave types (annual, sick, unpaid)"),
        bullet("Set default days and payroll impact"),
      ]),
      subsection("Audit Log", [
        bullet("View all system operations"),
        bullet("Track who did what and when"),
        bullet("Review before/after values for changes"),
      ]),
    ]),
    f(21)
  )
);

// SECTION 21: Troubleshooting
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s21" },
    h(22),
    section("21. Troubleshooting", [
      tableRow(["Problem", "Likely Cause", "Action"], 0, [2, 2, 2.5]),
      tableRow(["Cannot log in", "Wrong credentials", "Verify email/password with admin"], 1, [2, 2, 2.5]),
      tableRow(["Employee not matched", "Code mismatch", "Verify employee code matches system"], 2, [2, 2, 2.5]),
      tableRow(["Missing punch", "Forgot to punch", "Create exception manually"], 3, [2, 2, 2.5]),
      tableRow(["Wrong payroll amount", "Attendance deductions", "Check attendance records"], 4, [2, 2, 2.5]),
      tableRow(["Wrong invoice total", "VAT/discount error", "Check settings and invoice details"], 5, [2, 2, 2.5]),
      tableRow(["Database unavailable", "Connection lost", "Check PostgreSQL, verify DATABASE_URL"], 6, [2, 2, 2.5]),
    ]),
    f(22)
  )
);

// SECTION 22: Quick Reference
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s22" },
    h(23),
    section("22. Quick Reference", [
      subsection("HR Workflow", [
        p("Employee \u2192 Schedule \u2192 Fingerprint Import \u2192 Attendance \u2192 Exceptions \u2192 Leave \u2192 Payroll"),
      ]),
      subsection("Finance Workflow", [
        p("Client \u2192 Service \u2192 Invoice \u2192 Payment Schedule \u2192 Payment \u2192 Reports"),
      ]),
      subsection("Management Workflow", [
        p("Dashboard \u2192 Reports \u2192 Approvals \u2192 Audit Review"),
      ]),
      subsection("Monthly Payroll Checklist", [
        bullet("\u2610 Verify all employees are ACTIVE"),
        bullet("\u2610 Verify salary profiles are current"),
        bullet("\u2610 Import fingerprint data for the month"),
        bullet("\u2610 Process attendance"),
        bullet("\u2610 Review and resolve all exceptions"),
        bullet("\u2610 Create payroll period"),
        bullet("\u2610 Calculate payroll"),
        bullet("\u2610 Review breakdown"),
        bullet("\u2610 Approve period"),
        bullet("\u2610 Generate payslips"),
        bullet("\u2610 Lock period"),
      ]),
    ]),
    f(23)
  )
);

// SECTION 23: Security
children.push(
  React.createElement(Page, { size: "A4", style: s.page, key: "s23" },
    h(24),
    section("23. Security & Data Handling", [
      subsection("Access Control", [
        bullet("Role-based access controls all operations"),
        bullet("Financial operations require ADMIN or FINANCE role"),
        bullet("Employee management requires ADMIN, HR, or MANAGER role"),
        bullet("All API routes verify authentication"),
      ]),
      subsection("Sensitive Data", [
        bullet("Employee salaries are confidential"),
        bullet("Financial records are confidential"),
        bullet("Client information is confidential"),
        bullet("Never share credentials"),
      ]),
      subsection("Data Protection Rules", [
        bullet("Never commit real business data to public repositories"),
        bullet("Preserve raw fingerprint exports"),
        bullet("Do not bypass approval workflows"),
        bullet("Do not modify locked payroll records"),
        bullet("Keep environment credentials (.env) secret"),
      ]),
      subsection("Audit Logging", [
        bullet("Every important operation is logged"),
        bullet("Logs include who, what, when, and before/after values"),
        bullet("Review audit logs regularly for security"),
      ]),
    ]),
    f(24)
  )
);

// BUILD THE DOCUMENT
const doc = React.createElement(
  Document,
  { title: "EUNOIA ERB OS Training Guide", author: "EUNOIA ZONES AGENCY" },
  ...children
);

async function main() {
  console.log("Generating training PDF...");
  const buffer = await renderToBuffer(doc);
  const outPath = path.join(__dirname, "..", "docs", "EUNOIA_ERB_OS_TRAINING_GUIDE.pdf");
  fs.writeFileSync(outPath, buffer);
  console.log(`PDF generated: ${outPath}`);
  console.log(`Size: ${(buffer.length / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error("Failed to generate PDF:", err);
  process.exit(1);
});
