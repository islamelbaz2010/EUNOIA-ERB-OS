# EUNOIA ERB OS - Database

## Engine: PostgreSQL
## ORM: Prisma 5

## Key Models
- Company, Branch, Department
- User, Employee
- SalaryProfile, SalaryComponent
- WorkSchedule, ScheduleAssignment, ScheduleOverride
- Holiday, LeaveType, LeaveRequest
- AttendanceImport, AttendanceRawRecord, AttendancePunch, AttendanceDay
- AttendanceException
- PayrollPeriod, PayrollRecord, PayrollComponent, Payslip
- Client, Service, Invoice, InvoiceItem
- PaymentSchedule, PaymentInstallment, Payment
- AuditLog

## Commands
- `npx prisma db push` - Sync schema to database
- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Create migration
- `npx prisma studio` - Browse data
