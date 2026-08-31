# EUNOIA ERB OS - Project Instructions

## Purpose
Internal business operating system for EUNOIA ZONES AGENCY. Replaces fragmented manual workflows for employee management, attendance, payroll, invoicing, and payments.

## Architecture
- **Framework**: Next.js 16 (App Router) with TypeScript
- **Database**: PostgreSQL with Prisma 5 ORM
- **Auth**: NextAuth.js v5 (Credentials provider, JWT sessions)
- **UI**: Tailwind CSS v4, Radix UI primitives
- **Charts**: Recharts
- **PDF**: @react-pdf/renderer
- **Testing**: Jest with ts-jest

## Key Commands
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm test` - Run tests (58 tests)
- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Create migration
- `npx prisma migrate deploy` - Apply migrations to production
- `npx prisma studio` - Open Prisma Studio

## Project Structure
```
src/
  app/           - Next.js App Router pages and API routes
  components/    - UI components (ui/, shared/, layout/)
  lib/           - Core libraries (db, auth, utils, engines, pdf)
  hooks/         - React hooks
  types/         - TypeScript types
  __tests__/     - Automated tests
prisma/
  schema.prisma  - Database schema (30 models)
  migrations/    - Database migrations
```

## Business Rules
- Working days: Sun-Thu (default, configurable per schedule)
- Working hours: 10:30-18:30 (default, configurable)
- Grace period: 15 minutes (configurable)
- Overtime: enabled by default (configurable)
- VAT: applied only when configured per invoice
- Currency: SAR (Saudi Riyal)
- All business rules are configurable via Admin Settings

## Data Protection
- NEVER commit real employee data, salaries, or fingerprints
- Use synthetic data for development/seeding
- Database credentials in .env only (never commit .env)
- Financial calculations done server-side only
- Audit logging on all important operations

## Financial Principles
- All calculations server-side (never trust client totals)
- Use Decimal type for all financial fields
- Round to 2 decimal places
- Preserve salary history (never overwrite)
- Payroll periods have state machine (DRAFT → CALCULATED → UNDER_REVIEW → APPROVED → LOCKED)
- Invoice totals stored at creation time (not recalculated from current prices)

## Authorization
Roles: ADMIN, HR, FINANCE, MANAGER, EMPLOYEE, VIEWER
- Write operations require specific roles (see src/lib/authorization.ts)
- Read operations: any authenticated user
- Financial operations: ADMIN, FINANCE only
- Employee management: ADMIN, HR, MANAGER

## PDF Generation
- Payslip: GET /api/payslips/[id] → PDF
- Invoice: GET /api/invoices/[id]/pdf → PDF
- Uses @react-pdf/renderer for server-side PDF generation

## Testing
- Run: `npm test`
- 58 tests covering invoice, payroll, attendance calculations
- Test files in src/__tests__/
