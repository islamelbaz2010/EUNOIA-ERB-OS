# EUNOIA ERB OS
# System Training & User Guide

---

## 1. System Overview

EUNOIA ERB OS is the internal business operations system for EUNOIA. It replaces fragmented manual workflows with a single integrated platform for:

- **Employee Management** — employee records, salary profiles, work schedules
- **Attendance** — fingerprint Excel import, punch processing, exception handling
- **Leave Management** — leave types, requests, approvals
- **Payroll** — calculation, approval, locking, payslip generation
- **Invoicing** — client management, services, invoices, VAT, payment schedules
- **Payments** — payment recording, installment tracking
- **Reports** — attendance, payroll, invoice, and payment reports
- **Administration** — company settings, work schedules, holidays, leave types, audit logs

### Key Business Rules

- Working days: Sunday–Thursday (configurable per schedule)
- Working hours: 10:30–18:30 (configurable)
- Grace period: 15 minutes (configurable)
- Overtime: enabled by default, 30-minute minimum (configurable)
- Currency: SAR (Saudi Riyal)
- VAT: 15% default, configurable per invoice
- All financial calculations are performed server-side

---

## 2. Getting Started

### Opening the System

1. Open your web browser
2. Navigate to the EUNOIA ERB OS URL (provided by your administrator)
3. You will see the login page

### Login

1. Enter your **email address**
2. Enter your **password**
3. Click **Login**
4. You will be redirected to the Dashboard

If you forget your password, contact your system administrator.

### Main Navigation

After login, you will see:

- **Sidebar** (left side) — navigation menu with all modules
- **Header** (top) — user info and logout button
- **Main Content** — the current page

### Sidebar Sections

| Section | Items |
|---------|-------|
| Main | Dashboard, Employees, Attendance, Payroll |
| Business | Clients, Services, Invoices |
| Analytics | Reports, Admin |

---

## 3. User Roles & Permissions

The system has six roles. Each role determines what you can see and do.

### ADMIN

Full access to everything. Can:
- Manage all employees, salaries, schedules
- Process and approve payroll
- Create and manage invoices
- Access all reports
- Configure system settings
- Manage holidays, leave types, work schedules
- View audit logs
- Create new user accounts

### HR

Manages employee-related operations. Can:
- Create and edit employees
- Manage salary profiles
- Import attendance data
- Review attendance exceptions
- Process payroll (calculate, but not final approve)
- Manage leave requests
- View attendance and payroll reports

### FINANCE

Manages financial operations. Can:
- Create and edit invoices
- Record payments
- Manage payment schedules
- Approve and lock payroll
- View invoice and payment reports
- View payroll reports

### MANAGER

Team management. Can:
- View employee information
- Create employees (limited)
- View attendance and reports for their team

### EMPLOYEE

Self-service access. Can:
- View their own attendance
- View their own payslips
- View their own information

### VIEWER

Read-only access. Can:
- View dashboards and reports
- View employee information (read-only)

---

## 4. Dashboard

The Dashboard is the first screen after login. It shows key business metrics at a glance.

### What You See

| Metric | Description |
|--------|-------------|
| Total Employees | Number of employees in the system |
| Active Employees | Currently employed staff |
| Today's Attendance | Employees with attendance recorded today |
| Late Today | Employees who arrived late today |
| Absent Today | Employees marked absent today |
| Pending Exceptions | Attendance exceptions awaiting review |
| Current Payroll Period | The active payroll period (if any) |
| Outstanding Invoices | Invoices with pending payments |
| Overdue Invoices | Invoices past their due date |
| Recent Payments | Last 5 payments received |
| Upcoming Payments | Next 5 installment payments due |

### How Management Uses the Dashboard

- Check daily attendance status at a glance
- Monitor outstanding and overdue invoices
- Track pending payroll periods
- Review recent payment activity
- Identify issues requiring attention (late arrivals, absent employees, pending exceptions)

---

## 5. Employee Management

Navigate to: **Sidebar → Employees**

### Viewing Employees

1. Click **Employees** in the sidebar
2. You will see a list of all employees with their code, name, department, and status
3. Use search to find a specific employee
4. Click on an employee to view their full profile

### Creating a New Employee

1. Click **Add Employee** button
2. Fill in the required information:

**Personal Information:**
- First Name (English)
- Last Name (English)
- Display Name
- First Name (Arabic) — optional
- Last Name (Arabic) — optional
- Phone Number
- Email — optional
- National ID
- Date of Birth
- Gender
- Marital Status
- Address
- City

**Employment Information:**
- Employee Code (unique identifier)
- Department
- Branch
- Job Title
- Join Date
- Employment Status (Active, On Leave, Terminated, Suspended)
- Fingerprint ID — for matching fingerprint imports

**Salary Information:**
- Base Salary (SAR)
- Overtime Rate
- Hourly Rate (auto-calculated: base salary ÷ 30 ÷ 8)

3. Click **Save**

### Employee Code

Each employee has a unique code (e.g., EMP0001, or a company-specific code like 411, 414). This code is used for:
- Fingerprint import matching
- Payslip references
- Report identification

### Employment Status

| Status | Meaning |
|--------|---------|
| ACTIVE | Currently employed, included in payroll |
| ON_LEAVE | Temporarily away, may affect payroll |
| TERMINATED | No longer employed |
| SUSPENDED | Temporarily suspended |

### Editing an Employee

1. Click on the employee in the list
2. Click **Edit**
3. Modify the necessary fields
4. Click **Save**

**Important:** Salary changes create a new salary profile with an effective date. Previous salary history is preserved.

---

## 6. Salary Profiles

Salary information is managed through salary profiles attached to each employee.

### Creating a Salary Profile

When creating or editing an employee:

1. Enter the **Base Salary** (SAR)
2. The **Hourly Rate** is auto-calculated (base salary ÷ 30 working days ÷ 8 hours)
3. Set the **Overtime Rate** (multiplier, typically 1.5x)
4. Add salary **Components** (additions and deductions)

### Salary Components

Each component has:
- **Type**: Allowance, Bonus, Overtime, Commission, Deduction, Advance, Penalty, Reimbursement, or Manual
- **Name**: Description (e.g., "Housing Allowance", "Transportation Allowance")
- **Amount**: Fixed amount in SAR
- **Is Percentage**: Whether the amount is a percentage of base salary
- **Recurring**: Whether it applies every month

### Example Salary Components

| Type | Name | Amount | Notes |
|------|------|--------|-------|
| ALLOWANCE | Housing Allowance | 25% of base | Recurring |
| ALLOWANCE | Transportation Allowance | 1,000 SAR | Recurring |
| DEDUCTION | Loan Repayment | 500 SAR | May be temporary |

### Effective Dating

Salary profiles have effective dates. When you update a salary:
- The old profile gets an `effectiveTo` date
- The new profile starts from the `effectiveFrom` date
- Payroll uses the profile active for the pay period

This preserves complete salary history.

---

## 7. Work Schedules

Navigate to: **Sidebar → Admin → Work Schedules**

### What is a Work Schedule?

A work schedule defines:
- Which days are working days
- Start and end times
- Grace period for late arrivals
- Overtime rules

### Default Schedule

The default schedule is:
- **Working Days**: Sunday, Monday, Tuesday, Wednesday, Thursday
- **Rest Days**: Friday, Saturday
- **Start Time**: 10:30
- **End Time**: 18:30
- **Grace Period**: 15 minutes
- **Overtime**: Enabled (30-minute minimum, 180-minute maximum)

### Creating a Work Schedule

1. Go to **Admin → Work Schedules**
2. Click **Add Schedule**
3. Enter the schedule name
4. Set start and end times
5. Toggle working days on/off
6. Click **Add**

### Schedule Assignment

Each employee is assigned a work schedule. The system uses this schedule to:
- Determine if a day is a working day
- Calculate expected check-in/check-out times
- Determine late arrivals and early departures
- Calculate overtime eligibility

### Configuring Schedule Rules

The following rules are configurable in Admin Settings:

| Setting | Default | Description |
|---------|---------|-------------|
| Grace Period | 15 minutes | Minutes after start time before marking as late |
| Overtime Enabled | Yes | Whether overtime is tracked |
| Overtime Min Minutes | 30 | Minimum minutes to qualify as overtime |
| Max Overtime Minutes | 180 | Maximum overtime per day |

---

## 8. Attendance

### Attendance Lifecycle

The complete attendance workflow is:

```
Fingerprint Device
    ↓
Excel Export
    ↓
Upload to System (Import)
    ↓
Raw Records Stored
    ↓
Employee Matching
    ↓
Punch Normalization (IN/OUT detection)
    ↓
Attendance Day Calculation
    ↓
Review Exceptions
    ↓
Apply Leave/Exceptions
    ↓
Payroll Processing
```

### Key Concepts

**Punch**: A single fingerprint scan (IN or OUT)

**Attendance Day**: A calculated summary for one employee on one day, including:
- First IN time
- Last OUT time
- Total work minutes
- Late minutes
- Early departure minutes
- Overtime minutes
- Status (Present, Absent, Half Day, Leave, Holiday, Rest Day)

**Attendance Exception**: A special circumstance that affects attendance calculation, such as:
- Late arrival with valid reason
- Early departure with approval
- Missed fingerprint punch
- Business trip
- Work from home

---

## 9. Fingerprint Excel Import

Navigate to: **Sidebar → Attendance**

### Step-by-Step Import

1. **Obtain the fingerprint export** from your fingerprint device
   - Export as Excel (.xls or .xlsx) format
   - The file should contain employee IDs, names, and punch times

2. **Open the Import function**
   - Go to Attendance page
   - Click **Import Fingerprint Data**

3. **Upload the Excel file**
   - Click **Choose File**
   - Select your fingerprint export file
   - Maximum file size: 10MB
   - Supported formats: .xls, .xlsx, .csv

4. **System processes the file**
   - The system detects column headers automatically
   - It supports both English and Arabic column names
   - It matches punch times to employees

5. **Review results**
   - Total rows found
   - Valid rows processed
   - Invalid rows (skipped)
   - Unmatched rows (employee not found)

### Supported Column Formats

The system automatically detects these column names:

**Employee ID columns:**
- Employee ID, ID, empNo, EMP NO
- رقم الموظف (Arabic)

**Punch Time columns:**
- Punch Time, Time, Date
- التاريخ (Arabic)
- Supports DD/MM/YYYY HH:MM AM/PM format

**Employee Name columns:**
- Name, Employee Name
- الاسم (Arabic)

### Employee Matching

The system matches fingerprint records to employees using:
1. **Employee Code** — exact match to the employee code in the system
2. **Employee Name** — fallback matching by first and last name

If an employee is not matched:
- Check that the employee code in the fingerprint export matches the system
- Verify the employee exists and is marked as ACTIVE
- You may need to update the employee's `fingerprintId` field

### Date Format Support

The system handles multiple date formats:
- `DD/MM/YYYY HH:MM AM/PM` (e.g., 22/2/2026 10:31 AM)
- `YYYY-MM-DDTHH:MM:SS` (ISO format)
- Excel serial date numbers

---

## 10. Attendance Exceptions

Navigate to: **Sidebar → Attendance → Exceptions**

### What is an Attendance Exception?

An exception is a recorded deviation from normal attendance that needs review. Examples:
- Employee arrived late but had a valid reason
- Employee left early for a medical appointment
- Fingerprint device malfunctioned
- Employee was on a business trip

### Types of Exceptions

| Type | Description |
|------|-------------|
| LATE_ARRIVAL | Employee arrived after the grace period |
| EARLY_DEPARTURE | Employee left before the scheduled end time |
| BUSINESS_TRIP | Employee was on an approved business trip |
| WORK_FROM_HOME | Employee worked from home |
| MISSED_FINGERPRINT | Fingerprint was not recorded (device issue) |
| FORGOTTEN_PUNCH | Employee forgot to punch in/out |
| APPROVED_ABSENCE | Absence was pre-approved |
| SPECIAL_WORKING_DAY | Working on a rest day or holiday |
| OVERTIME_APPROVAL | Overtime was pre-approved |
| SCHEDULE_OVERRIDE | Schedule was temporarily changed |

### Reviewing Exceptions

1. Go to **Attendance → Exceptions**
2. View the list of pending exceptions
3. For each exception:
   - Review the employee name, date, and type
   - Read the reason provided
   - Click **Approve** or **Reject**
4. Approved exceptions affect attendance and payroll calculations

### How Exceptions Affect Payroll

- **Approved late arrival** — may reduce the lateness deduction
- **Approved early departure** — may reduce the early departure deduction
- **Approved absence** — may be treated as paid leave
- **Business trip** — employee is marked as present
- **Work from home** — employee is marked as present

---

## 11. Leave Management

### Leave Types

Leave types are configured by the administrator. Common types include:

| Type | Default Days | Paid | Affects Payroll |
|------|-------------|------|-----------------|
| Annual Leave | 21 | Yes | Yes |
| Sick Leave | 30 | Yes | No |
| Unpaid Leave | 0 | No | Yes |

### Requesting Leave

1. Go to the leave request section
2. Select the employee
3. Select the leave type
4. Enter start date, end date, and total days
5. Provide a reason
6. Submit the request

### Approving Leave

1. HR/Admin reviews the leave request
2. Approves or rejects with notes
3. Approved leave is reflected in attendance records
4. Leave days are marked as "LEAVE" status in attendance

### Leave and Payroll

- **Paid leave**: Employee receives normal salary
- **Unpaid leave**: Salary is deducted for leave days
- **Sick leave**: Typically does not affect payroll (configurable)

---

## 12. Payroll

Navigate to: **Sidebar → Payroll**

### Payroll Lifecycle

```
DRAFT → CALCULATED → UNDER_REVIEW → APPROVED → LOCKED
```

| Status | Description |
|--------|-------------|
| DRAFT | Period created, not yet calculated |
| CALCULATED | Payroll has been calculated for all employees |
| UNDER_REVIEW | Being reviewed by management |
| APPROVED | Approved and ready for payment |
| LOCKED | Finalized, cannot be changed |

### Monthly Payroll Workflow

1. **Create a Payroll Period**
   - Go to Payroll → Create Period
   - Enter period name (e.g., "July 2026")
   - Set start and end dates
   - Status: DRAFT

2. **Verify Prerequisites**
   - All employees are ACTIVE
   - Salary profiles are up to date
   - Work schedules are assigned
   - Attendance has been imported and processed
   - Exceptions have been reviewed

3. **Calculate Payroll**
   - Click **Calculate** on the payroll period
   - The system processes all active employees
   - Calculates: base salary, overtime, lateness, absence, components
   - Status changes to: CALCULATED

4. **Review Payroll**
   - Review the breakdown for each employee
   - Check totals match expectations
   - Verify deductions are correct
   - Status changes to: UNDER_REVIEW

5. **Approve Payroll**
   - FINANCE or ADMIN approves the period
   - Status changes to: APPROVED

6. **Lock Payroll**
   - After payments are made, lock the period
   - Status changes to: LOCKED
   - **Locked payroll cannot be changed**

### Payroll Calculation Components

For each employee, the system calculates:

| Component | How It's Calculated |
|-----------|-------------------|
| Base Salary | From the active salary profile |
| Daily Salary | Base Salary ÷ 30 |
| Hourly Rate | Base Salary ÷ 30 ÷ 8 |
| Overtime | Overtime minutes ÷ 60 × Hourly Rate × 1.5 |
| Late Deduction | Late minutes ÷ 60 × Hourly Rate |
| Absence Deduction | Absent days × Daily Salary |
| Additions | Sum of all allowance/bonus components |
| Deductions | Sum of all deduction/advance/penalty components |
| Gross | Base Salary + Additions + Overtime |
| Net | Gross − Deductions − Attendance Deductions |

### Viewing Payslips

1. Go to **Payroll → Payslips**
2. Select the payroll period
3. Click on an employee to view their payslip
4. The payslip shows:
   - Employee information
   - Payroll period
   - Earnings breakdown
   - Deductions breakdown
   - Net salary

### Generating Payslip PDF

1. Open the payslip
2. Click **Download PDF**
3. The PDF includes:
   - Company information
   - Employee details
   - Period dates
   - Full earnings and deductions table
   - Net salary amount

---

## 13. Payroll Approval & Locking

### Why Approval Matters

- Ensures management has reviewed all calculations
- Prevents unauthorized payroll changes
- Creates an audit trail

### Why Locking Matters

- Once locked, payroll records cannot be modified
- Protects historical payment data
- Required for financial compliance
- Prevents accidental changes to processed payroll

### Approval Rules

| Role | Can Calculate | Can Approve | Can Lock |
|------|--------------|-------------|----------|
| ADMIN | Yes | Yes | Yes |
| HR | Yes | No | No |
| FINANCE | Yes | Yes | Yes |
| MANAGER | No | No | No |
| EMPLOYEE | No | No | No |

---

## 14. Client Management

Navigate to: **Sidebar → Clients**

### Creating a Client

1. Go to **Clients**
2. Click **Add Client**
3. Fill in the information:
   - Client Name
   - Contact Person
   - Phone
   - Email
   - Address, City, Country
   - Tax Number
   - VAT Number
   - Payment Terms (default: 30 days)
4. Click **Save**

### Client Status

| Status | Meaning |
|--------|---------|
| ACTIVE | Can be invoiced |
| INACTIVE | Not currently active |
| BLOCKED | Cannot be invoiced |

### Viewing Client Details

1. Click on a client in the list
2. View their information
3. See all invoices for this client
4. Track payment history

---

## 15. Services

Navigate to: **Sidebar → Services**

### Service Catalog

The services catalog lists all services your company offers. Each service has:
- Name (English and Arabic)
- Description
- Default Price (SAR)
- Unit (e.g., "unit", "hour", "month")
- Tax Enabled (whether VAT applies)
- Active status

### Creating a Service

1. Go to **Services**
2. Click **Add Service**
3. Enter the service details:
   - Name
   - Description
   - Default Price
   - Unit
   - Tax Enabled toggle
4. Click **Save**

### Using Services in Invoices

When creating an invoice, you can:
1. Select a service from the catalog
2. The price auto-fills from the service default
3. Adjust quantity and price as needed
4. The system calculates line totals automatically

---

## 16. Invoicing

Navigate to: **Sidebar → Invoices**

### Invoice Lifecycle

```
DRAFT → SENT → VIEWED → PARTIALLY_PAID → PAID
                                   ↓
                              OVERDUE
                                   ↓
                            CANCELLED
```

### Creating an Invoice

1. Go to **Invoices**
2. Click **New Invoice**
3. Select the **Client**
4. Add **Line Items**:
   - Select a service or enter a custom description
   - Enter quantity
   - Enter unit price
   - The system calculates the line total
5. Set **Discount** (optional)
6. Toggle **VAT** on/off
7. Set **Payment Terms** (days)
8. Add **Notes** (optional)
9. Click **Save** (creates as DRAFT)

### Invoice Totals

The system calculates:
- **Subtotal**: Sum of all line items
- **Discount**: Fixed amount deducted
- **VAT Amount**: (Subtotal − Discount) × VAT Rate
- **Total**: Subtotal − Discount + VAT Amount

### Invoice Numbering

Invoices are numbered automatically: `INV-YYYY-MM-NNNN`
- Example: INV-2026-07-0001

### Sending an Invoice

1. Open the invoice
2. Click **Send**
3. Status changes to: SENT

### Recording Payments

1. Open the invoice
2. Click **Record Payment**
3. Enter:
   - Amount
   - Payment Date
   - Payment Method (Cash, Bank Transfer, Check, Credit Card, Online)
   - Reference number
4. Click **Save**

The invoice status updates automatically:
- Full payment → PAID
- Partial payment → PARTIALLY_PAID

### Invoice PDF

1. Open the invoice
2. Click **Download PDF**
3. The PDF includes:
   - Company information
   - Client information
   - Invoice number and date
   - Line items with descriptions and amounts
   - Subtotal, discount, VAT, total
   - Payment terms
   - Payment history

---

## 17. Payment Schedules & Installments

### Creating a Payment Schedule

When creating an invoice, you can set up a payment schedule:

1. Create or open an invoice
2. Set the number of **installments**
3. The system divides the total amount equally
4. Each installment has a due date

### Installment Tracking

| Status | Meaning |
|--------|---------|
| PENDING | Not yet due |
| PAID | Fully paid |
| OVERDUE | Past due date |

### Recording Installment Payments

1. Open the invoice
2. View the payment schedule
3. Click **Pay** on an installment
4. Enter payment details
5. The installment status updates to PAID

---

## 18. Reports

Navigate to: **Sidebar → Reports**

### Available Reports

| Report | Description | Key Information |
|--------|-------------|-----------------|
| Attendance Report | Employee attendance summary | Present days, absent days, late minutes, overtime |
| Payroll Report | Payroll breakdown by period | Base salary, additions, deductions, net |
| Invoice Report | Invoice summary | Total invoiced, paid, outstanding, by status |
| Payment Report | Payment history | Payments received, methods, dates |
| Revenue Report | Company revenue | Income from invoices |

### Attendance Report

**Purpose**: Summarize employee attendance for a period

**Information Shown**:
- Employee name and code
- Total working days
- Present days
- Absent days
- Leave days
- Half days
- Total late minutes
- Total overtime minutes
- Average attendance percentage

**Filters**: Date range, employee, status

**How to Use**:
1. Go to Reports
2. Click **Attendance Report**
3. Set date range (From / To)
4. Click **Update**
5. View the summary and employee details

### Payroll Report

**Purpose**: Detailed payroll breakdown for a period

**Information Shown**:
- Period name and dates
- Total employees
- Total base salary
- Total gross
- Total net
- Total deductions
- Total overtime
- Per-employee breakdown

**How to Use**:
1. Go to Reports
2. Click **Payroll Report**
3. Select the payroll period
4. View the summary and per-employee details

### Invoice Report

**Purpose**: Overview of all invoices

**Information Shown**:
- Total invoices
- Total invoiced amount
- Total discount
- Total VAT
- Total amount
- Total paid
- Breakdown by status (Draft, Sent, Paid, etc.)

**Filters**: Date range, status, client

---

## 19. Admin Settings

Navigate to: **Sidebar → Admin**

**Access**: ADMIN only

### Company Settings

Configure your company information:
- Company name (English and Arabic)
- Email, phone
- Address, city, country
- Tax number
- VAT number
- VAT rate (default: 15%)
- Currency (default: SAR)
- Timezone (default: Asia/Riyadh)

### Work Schedules

Manage work schedules:
- View all schedules
- Create new schedules
- Set working days and hours
- Configure grace period and overtime rules

### Holidays

Manage official holidays:
- Add holidays with name and date
- Mark as recurring (annual)
- Holidays are excluded from attendance calculations

### Leave Types

Manage leave types:
- Add new leave types
- Set default days
- Configure whether paid/unpaid
- Configure payroll impact

### Audit Log

View system activity:
- Who performed what action
- When it happened
- What entity was affected
- Before/after values for changes

---

## 20. Roles & Permissions Matrix

| Module | ADMIN | HR | FINANCE | MANAGER | EMPLOYEE | VIEWER |
|--------|-------|----|---------|---------|----------|--------|
| Dashboard | Full | Full | Full | Full | Own | Read |
| Employees | Full | Full | Read | Read | Own | Read |
| Create Employee | Yes | Yes | No | Yes | No | No |
| Edit Employee | Yes | Yes | No | No | No | No |
| Salary Profiles | Full | Full | Read | No | No | No |
| Attendance | Full | Full | Read | Read | Own | Read |
| Import Fingerprint | Yes | Yes | No | No | No | No |
| Exceptions | Full | Full | Read | Read | Submit | Read |
| Leave | Full | Full | Read | Read | Submit | Read |
| Payroll | Full | Calculate | Approve | Read | Read | Read |
| Clients | Full | Read | Full | Read | No | Read |
| Services | Full | Read | Full | Read | No | Read |
| Invoices | Full | Read | Full | Read | No | Read |
| Payments | Full | Read | Full | Read | No | Read |
| Reports | Full | Full | Full | Read | Own | Read |
| Admin Settings | Full | No | No | No | No | No |
| Work Schedules | Full | No | No | No | No | No |
| Holidays | Full | No | No | No | No | No |
| Leave Types | Full | No | No | No | No | No |
| Audit Log | Full | No | No | No | No | No |
| User Registration | ADMIN only | No | No | No | No | No |

---

## 21. Audit Logs

Navigate to: **Sidebar → Admin → Audit Log**

### What is Logged

Every important operation is recorded:
- Employee creation and updates
- Payroll calculations, approvals, and locks
- Invoice creation, updates, and payments
- Attendance imports
- Exception approvals
- Settings changes

### What is Recorded

Each audit log entry includes:
- **User**: Who performed the action
- **Action**: What was done (CREATE, UPDATE, DELETE, CALCULATE, APPROVE, LOCK)
- **Entity**: What was affected (Employee, PayrollPeriod, Invoice, etc.)
- **Entity ID**: The specific record
- **Before**: Previous values (for updates)
- **After**: New values
- **Timestamp**: When it happened

### Why It Matters

- Accountability — track who did what
- Compliance — financial audit trail
- Troubleshooting — identify when issues started
- Security — detect unauthorized changes

### Who Should Review

- ADMIN: Regular review of all operations
- FINANCE: Review payroll and invoice operations
- HR: Review attendance and employee changes

---

## 22. Daily HR Workflow

### Morning Checklist

```
□ Check dashboard for today's attendance status
□ Review any pending attendance exceptions
□ Check for new leave requests
□ Verify fingerprint import for yesterday (if not automated)
```

### During the Day

```
□ Process new employee requests
□ Handle attendance exception submissions
□ Review and approve/reject leave requests
□ Update employee information as needed
```

### End of Day

```
□ Ensure all attendance data is imported
□ Review any unmatched fingerprint records
□ Check pending exceptions are addressed
```

---

## 23. Monthly Payroll Workflow

### Pre-Payroll Checklist

```
□ Verify all employees are ACTIVE
□ Verify salary profiles are current
□ Verify work schedules are assigned
□ Import fingerprint data for the month
□ Process attendance (normalize punches)
□ Review and resolve all attendance exceptions
□ Process leave requests
□ Verify no missing attendance records
```

### Payroll Processing

```
□ Create payroll period (name, start/end dates)
□ Click Calculate
□ Review total gross, net, deductions
□ Review individual employee breakdowns
□ Verify overtime calculations
□ Verify lateness deductions
□ Verify absence deductions
□ Verify salary components
□ If correct: Approve the period
□ Generate payslips
□ Download payslip PDFs
□ Lock the period after payments are confirmed
```

### Post-Payroll

```
□ Distribute payslips to employees
□ Archive payroll documentation
□ Update financial records
□ Verify locked period cannot be modified
```

---

## 24. Finance Workflow

### Invoice Workflow

```
□ Receive service agreement/request
□ Create or verify client in system
□ Verify services are in the catalog
□ Create invoice with line items
□ Apply VAT if applicable
□ Set payment terms
□ Save as DRAFT
□ Review invoice details
□ Send invoice (status: SENT)
□ Set up payment schedule (if installments)
□ Record payments as received
□ Monitor overdue invoices
□ Generate invoice PDFs for records
```

### Payment Tracking

```
□ Check upcoming installments daily
□ Record payments when received
□ Follow up on overdue payments
□ Update payment schedules
□ Generate payment reports
```

---

## 25. Management Workflow

### Daily

```
□ Review dashboard metrics
□ Check attendance summary
□ Monitor pending exceptions
□ Review outstanding invoices
```

### Weekly

```
□ Review attendance trends
□ Check payroll preparation status
□ Review invoice pipeline
□ Approve pending items
```

### Monthly

```
□ Review payroll report before approval
□ Approve payroll period
□ Review financial reports
□ Check audit logs for unusual activity
□ Review employee headcount and changes
```

---

## 26. Common Problems & Solutions

### Cannot Log In

| Symptom | Likely Cause | Action |
|---------|-------------|--------|
| "Invalid credentials" | Wrong email or password | Verify email and password with admin |
| "Account inactive" | Account is disabled | Contact administrator |
| Page keeps loading | Server issue | Check if the server is running |

### Employee Not Matched in Fingerprint Import

| Symptom | Likely Cause | Action |
|---------|-------------|--------|
| Employee shows as UNMATCHED | Employee code doesn't match | Verify the employee code in the system matches the fingerprint export |
| Name not found | Name spelling differs | Update the employee's fingerprintId field or verify name spelling |

### Missing Fingerprint Punch

| Symptom | Likely Cause | Action |
|---------|-------------|--------|
| No IN punch recorded | Employee forgot to punch | Create a manual attendance exception |
| No OUT punch recorded | Employee forgot to punch | Create a manual attendance exception |
| Only one punch per day | Device malfunction | Create an exception and manually set attendance |

### Incorrect Attendance Calculation

| Symptom | Likely Cause | Action |
|---------|-------------|--------|
| Employee marked absent but was present | Missing punches | Create a FORGOTTEN_PUNCH exception |
| Late deduction seems wrong | Grace period not applied | Check the work schedule grace period setting |
| Overtime not calculated | Overtime disabled or below minimum | Check schedule overtime settings |

### Unexpected Payroll Amount

| Symptom | Likely Cause | Action |
|---------|-------------|--------|
| Net salary is lower than expected | Attendance deductions | Check attendance records for absences/lateness |
| Overtime not included | No overtime recorded | Verify attendance has overtime minutes |
| Component missing | Salary profile incomplete | Check employee's salary profile components |

### Invoice Total Seems Wrong

| Symptom | Likely Cause | Action |
|---------|-------------|--------|
| VAT is incorrect | VAT rate setting | Check company VAT rate in Admin Settings |
| Discount not applied | Discount field empty | Verify discount amount on the invoice |
| Line item total wrong | Quantity × price error | Review line item quantities and prices |

### PDF Generation Issue

| Symptom | Likely Cause | Action |
|---------|-------------|--------|
| PDF not downloading | Server error | Check server logs, verify the record exists |
| PDF is blank | Rendering issue | Ensure @react-pdf/renderer is installed |

### Database Unavailable

| Symptom | Likely Cause | Action |
|---------|-------------|--------|
| "Internal server error" on all pages | Database connection lost | Check PostgreSQL is running, verify DATABASE_URL in .env |
| Migration error | Schema mismatch | Run `npx prisma migrate deploy` |

---

## 27. Data Safety Rules

### Password Security

- Never share your password with anyone
- Use a strong, unique password
- Change your password if you suspect it has been compromised
- Do not reuse passwords from other systems

### Confidential Data

- Employee salaries are confidential — do not share
- Financial records are confidential — do not share
- Client information is confidential — do not share
- Access only the data you need for your role

### Data Protection

- Never upload real business data to public repositories
- Preserve raw fingerprint exports — do not delete them
- Do not bypass approval workflows
- Do not modify locked payroll records
- Keep environment credentials (.env) secret

### Backup

- Regular database backups are essential
- Test backup restoration periodically
- Store backups in a secure location
- Never store backups in the same location as the live database

---

## 28. Administrator Checklist

### Initial Setup

```
□ Install PostgreSQL
□ Configure database connection in .env
□ Run database migration: npx prisma migrate deploy
□ Start the application: npm run start
□ Seed initial data: POST /api/seed (development only)
□ Create admin account
□ Configure company settings (name, address, tax numbers)
□ Set up work schedules
□ Configure holidays
□ Set up leave types
```

### Ongoing Maintenance

```
□ Monitor database performance
□ Review audit logs weekly
□ Backup database daily
□ Verify user accounts are properly role-assigned
□ Update work schedules as needed
□ Add new holidays annually
□ Review and update leave types as needed
```

### Security

```
□ Never commit .env to version control
□ Use strong passwords for all accounts
□ Regularly review user access
□ Remove accounts for terminated employees
□ Monitor audit logs for suspicious activity
□ Keep the application and dependencies updated
```

---

## 29. New User Training Checklist

### For Trainers

```
□ Demonstrate login process
□ Walk through the dashboard
□ Show sidebar navigation
□ Create a test employee together
□ Add a salary profile
□ Assign a work schedule
□ Import sample fingerprint data
□ Show attendance calculation results
□ Demonstrate exception review
□ Create a sample leave request
□ Process a payroll period step by step
□ Generate a payslip PDF
□ Create a sample invoice
□ Record a sample payment
□ Show report generation
□ Explain role differences
□ Review data safety rules
```

### For New Users

```
□ Receive login credentials
□ Log in successfully
□ Navigate to your role's main screens
□ Understand your permissions
□ Know who to contact for support
□ Understand data safety rules
```

---

## 30. Quick Reference

### HR Workflow

```
Employee → Schedule → Fingerprint Import → Attendance → Exceptions → Leave → Payroll
```

### Finance Workflow

```
Client → Service → Invoice → Payment Schedule → Payment → Reports
```

### Management Workflow

```
Dashboard → Reports → Approvals → Audit Review
```

### Key Navigation

| Go To | Path |
|-------|------|
| Dashboard | Sidebar → Dashboard |
| Employees | Sidebar → Employees |
| Attendance | Sidebar → Attendance |
| Payroll | Sidebar → Payroll |
| Clients | Sidebar → Clients |
| Services | Sidebar → Services |
| Invoices | Sidebar → Invoices |
| Reports | Sidebar → Reports |
| Admin | Sidebar → Admin |

### Key Actions

| Action | How |
|--------|-----|
| Create employee | Employees → Add Employee |
| Import fingerprint | Attendance → Import |
| Calculate payroll | Payroll → Period → Calculate |
| Create invoice | Invoices → New Invoice |
| Record payment | Invoices → Invoice → Record Payment |
| View report | Reports → Select Report → Set Dates → Update |
| Generate PDF | Open record → Download PDF |

---

*This guide describes the EUNOIA ERB OS as implemented. For technical documentation, see ARCHITECTURE.md, DATABASE.md, BUSINESS_RULES.md, and TESTING.md.*
