# EUNOIA ERB OS - Business Rules

All business rules are configurable via the Admin Settings module. Defaults are shown below.

---

## 1. Working Schedule

| Rule | Default | Configurable |
|------|---------|--------------|
| Working days | Sun, Mon, Tue, Wed, Thu | Yes (per schedule) |
| Start time | 10:30 | Yes (per schedule) |
| End time | 18:30 | Yes (per schedule) |
| Grace period | 15 minutes | Yes (per schedule) |
| Overtime enabled | true | Yes (per schedule) |
| Minimum overtime | 30 minutes | Yes (per schedule) |
| Maximum overtime | 180 minutes | Yes (per schedule) |

### Schedule Assignment
- Each employee has one active schedule assignment at a time
- Schedule changes use effective dating (effectiveFrom/effectiveTo)
- Schedule overrides allow temporary per-day changes (must be approved)

### Rest Days
- Friday and Saturday are rest days by default
- Rest days are not counted as absences
- Special working days can be configured for rest days

---

## 2. Overtime Rules

| Rule | Default | Configurable |
|------|---------|--------------|
| Overtime enabled | true | Yes |
| Minimum minutes to qualify | 30 | Yes |
| Maximum daily overtime | 180 minutes | Yes |
| Overtime rate | 0 (base hourly rate used) | Yes per employee |

### Overtime Calculation
```
overtimeMinutes = max(0, lastOut - scheduledEnd)
if overtimeMinutes < minimumOvertimeMinutes:
  overtimeMinutes = 0
overtimeMinutes = min(overtimeMinutes, maxOvertimeMinutes)
```

### Overtime Pay
```
hourlyRate = baseSalary / (workingDaysPerMonth × dailyHours)
overtimePay = (overtimeMinutes / 60) × hourlyRate × overtimeRate
```

---

## 3. Late Arrival Deduction

| Rule | Default | Configurable |
|------|---------|--------------|
| Grace period | 15 minutes | Yes (per schedule) |
| Deduction type | Proportional | Yes |

### Late Calculation
```
lateMinutes = max(0, firstIn - scheduledStart - gracePeriodMinutes)
```

### Late Deduction
```
dailyRate = baseSalary / workingDaysPerMonth
lateDeduction = (lateMinutes / dailyMinutes) × dailyRate
```

---

## 4. Early Departure

| Rule | Default | Configurable |
|------|---------|--------------|
| Detection | Automatic | Yes |
| Deduction type | Proportional | Yes |

### Early Departure Calculation
```
earlyDepartureMinutes = max(0, scheduledEnd - lastOut)
```

### Early Departure Deduction
```
dailyRate = baseSalary / workingDaysPerMonth
deduction = (earlyDepartureMinutes / dailyMinutes) × dailyRate
```

---

## 5. Absence Deduction

| Rule | Default | Configurable |
|------|---------|--------------|
| Full day absence | Deduct full daily rate | Yes |
| Unpaid leave | Deduct full daily rate | Yes |
| Holiday | No deduction | Yes |

### Absence Deduction
```
dailyRate = baseSalary / workingDaysPerMonth
absenceDeduction = dailyRate × absentDays
```

---

## 6. Leave Types and Policies

| Leave Type | Default Days | Paid | Affects Payroll | Requires Approval |
|------------|--------------|------|-----------------|-------------------|
| Annual Leave | 21 | Yes | Yes | Yes |
| Sick Leave | 30 | Yes | Yes | Yes |
| Unpaid Leave | 0 | No | Yes | Yes |
| Maternity Leave | 60 | Yes | Yes | Yes |
| Compassionate Leave | 5 | Yes | Yes | Yes |

### Leave Rules
- Leave is configured per company via Admin Settings
- Each leave type can be marked as paid/unpaid
- Paid leave types can optionally affect payroll
- Leave requests require approval workflow
- Leave days are deducted from attendance calculations
- Leave requests can span multiple days (startDate to endDate)

### Leave Calculation
```
totalDays = count of working days between startDate and endDate
if leaveType.isPaid AND leaveType.affectsPayroll:
  deduction = 0 (paid leave)
else:
  dailyRate = baseSalary / workingDaysPerMonth
  deduction = dailyRate × totalDays
```

---

## 7. Payroll Calculation

### Payroll Period State Machine
```
DRAFT → CALCULATED → UNDER_REVIEW → APPROVED → LOCKED
```

- **DRAFT**: Period created, no calculations yet
- **CALCULATED**: Engine has run, results pending review
- **UNDER_REVIEW**: Being reviewed by management
- **APPROVED**: Verified and ready for payment
- **LOCKED**: Finalized, no changes allowed

### Payroll Components

#### Additions
| Component | Calculation |
|-----------|-------------|
| Base Salary | Fixed amount from salary profile |
| Allowances | Fixed or percentage-based |
| Bonuses | Fixed or percentage-based |
| Overtime | Calculated from attendance |
| Commissions | Fixed or percentage-based |
| Reimbursements | Fixed amounts |

#### Deductions
| Component | Calculation |
|-----------|-------------|
| Late Deduction | Proportional based on late minutes |
| Absence Deduction | Full daily rate per absent day |
| Unpaid Leave | Full daily rate per unpaid leave day |
| Advances | Fixed amounts |
| Penalties | Fixed amounts |
| Other Deductions | Fixed amounts |

### Payroll Calculation Flow
```
1. Get active salary profile for employee
2. Calculate base salary (pro-rated if mid-month join/exit)
3. Sum all active allowances and bonuses
4. Calculate overtime from attendance days
5. Calculate deductions:
   a. Late deductions from attendance days
   b. Absence deductions
   c. Unpaid leave deductions
   d. Manual deductions (advances, penalties)
6. Compute totals:
   gross = base + additions + overtime
   net = gross - deductions
```

### Pro-Ration Formula
```
if employee joined mid-period:
  workingDaysInPeriod = count of working days from joinDate to periodEnd
  totalWorkingDays = count of working days from periodStart to periodEnd
  proRationFactor = workingDaysInPeriod / totalWorkingDays
  proRatedBase = baseSalary × proRationFactor
```

---

## 8. Attendance Processing

### Raw → Normalized → Approved

#### Layer 1: Raw Records
- Imported from Excel (fingerprint device export)
- Stored as-is with original timestamps
- Matched to employees by fingerprintId or employeeCode

#### Layer 2: Normalized Punches
- Raw records processed into AttendancePunch records
- Duplicate detection
- Employee matching validation
- Punch type inference (IN/OUT)

#### Layer 3: Approved Days
- AttendanceDay calculated from punches
- Status determined: PRESENT, ABSENT, HALF_DAY, LEAVE, HOLIDAY, REST_DAY, EXCEPTION
- Minutes calculated: work, overtime, late, early departure

### Day Calculation
```
1. Check if day is rest day → REST_DAY
2. Check if day is holiday → HOLIDAY
3. Check if leave request exists → LEAVE
4. Check if schedule override exists → apply override
5. Get punches for the day
6. If no punches → ABSENT
7. If only one punch (IN or OUT) → HALF_DAY or EXCEPTION
8. If IN + OUT:
   - firstIn = earliest IN punch
   - lastOut = latest OUT punch
   - workMinutes = lastOut - firstIn
   - lateMinutes = max(0, firstIn - scheduledStart - gracePeriod)
   - earlyDepartureMinutes = max(0, scheduledEnd - lastOut)
   - overtimeMinutes = max(0, lastOut - scheduledEnd)
   - status = PRESENT
```

---

## 9. Invoice Rules

### Invoice Status Flow
```
DRAFT → SENT → VIEWED → PARTIALLY_PAID → PAID
                                 ↓
                              OVERDUE
                                 ↓
                           CANCELLED
```

### VAT Behavior
| Rule | Default | Configurable |
|------|---------|--------------|
| VAT enabled | false | Yes (per invoice) |
| VAT rate | 15% | Yes (per company) |
| VAT calculation | On subtotal after discount | Fixed |

### VAT Calculation
```
subtotal = sum(item.quantity × item.unitPrice for all items)
discount = invoice.discount
afterDiscount = subtotal - discount
if vatEnabled:
  vatAmount = afterDiscount × (vatRate / 100)
else:
  vatAmount = 0
total = afterDiscount + vatAmount
```

### Invoice Totals
- **Frozen at creation time**: Invoice totals are calculated and stored when the invoice is saved
- Recalculating from current service prices is NOT done
- This preserves historical accuracy

### Payment Terms
- Default: 30 days from invoice date
- Configurable per client
- Used to calculate due date

---

## 10. Payment Terms and Schedules

### Payment Schedule
- One payment schedule per invoice
- Divides invoice total into installments
- Each installment has a due date and amount

### Installment Calculation
```
installmentAmount = totalAmount / numberOfInstallments
dueDate[i] = invoiceDate + (paymentTerms / numberOfInstallments) × (i + 1)
```

### Payment Recording
- Payments can be recorded against an invoice
- Payments can be linked to specific installments
- Payment methods: CASH, BANK_TRANSFER, CHECK, CREDIT_CARD, ONLINE, OTHER

### Overdue Detection
```
if installment.status == PENDING AND today > installment.dueDate:
  installment.status = OVERDUE
if any installment is OVERDUE:
  invoice.status = OVERDUE
```

---

## 11. Currency and Formatting

| Rule | Default | Configurable |
|------|---------|--------------|
| Currency | SAR (Saudi Riyal) | Yes (per company) |
| Decimal places | 2 | Yes |
| Date format | YYYY-MM-DD | System default |
| Time format | HH:MM (24h) | System default |
| Timezone | Asia/Riyadh | Yes (per company) |

---

## 12. Audit Logging

### What is Logged
- All CRUD operations on employee data
- Attendance imports and modifications
- Payroll state changes
- Invoice creation and status changes
- Payment recordings
- Settings changes
- Login/logout events

### Audit Log Entry
```
{
  userId: string,
  action: string,       // CREATE, UPDATE, DELETE, etc.
  entity: string,       // Employee, PayrollPeriod, Invoice, etc.
  entityId: string,
  before: JSON,         // previous state (for updates)
  after: JSON,          // new state
  ipAddress: string,
  userAgent: string,
  metadata: JSON        // additional context
}
```

---

## 13. Data Validation Rules

### Employee
- firstName, lastName: required
- joinDate: required, cannot be future
- nationalId: unique per company
- employeeCode: unique per company (if provided)
- email: valid format, unique per company (if provided)

### Salary Profile
- baseSalary: required, must be > 0
- effectiveFrom: required
- Only one active profile per employee at any time

### Invoice
- clientId: required
- items: at least one item required
- subtotal: auto-calculated
- total: auto-calculated

### Payroll Period
- startDate, endDate: required, endDate > startDate
- No overlapping periods per company
