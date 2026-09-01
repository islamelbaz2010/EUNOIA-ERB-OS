# EUNOIA ERB OS

Internal business operations system for EUNOIA. Replaces fragmented manual workflows with a single integrated platform for employee management, attendance, payroll, invoicing, and payments.

## Features

- **Employee Management** — employee records, salary profiles, work schedules
- **Attendance** — fingerprint Excel import, punch processing, exception handling
- **Leave Management** — leave types, requests, approvals
- **Payroll** — calculation, approval, locking, payslip generation
- **Invoicing** — client management, services, invoices, VAT, payment schedules
- **Payments** — payment recording, installment tracking
- **Reports** — attendance, payroll, invoice, and payment reports
- **Administration** — company settings, work schedules, holidays, audit logs

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Database**: PostgreSQL with Prisma 5 ORM
- **Auth**: NextAuth.js v5 (Credentials provider, JWT sessions)
- **UI**: Tailwind CSS v4, Radix UI primitives
- **Charts**: Recharts
- **PDF**: @react-pdf/renderer
- **Testing**: Jest with ts-jest

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migration
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Seed Demo Data (Development Only)

```bash
curl -X POST http://localhost:3000/api/seed
```

This creates demo data including:
- Company: EUNOIA HR Solutions
- Admin: admin@eunoia.com / admin123
- 5 employees with salary profiles
- Leave types, holidays, clients

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm test` | Run tests (58 tests) |
| `npx prisma generate` | Generate Prisma client |
| `npx prisma migrate dev` | Create migration |
| `npx prisma migrate deploy` | Apply migrations |

## Project Structure

```
src/
  app/              Next.js App Router pages and API routes
  components/       UI components (ui/, shared/, layout/)
  lib/              Core libraries (db, auth, utils, engines, pdf)
  hooks/            React hooks
  types/            TypeScript types
  __tests__/        Automated tests
prisma/
  schema.prisma     Database schema (30 models)
  migrations/       Database migrations
```

## Documentation

- [Training & User Guide](docs/EUNOIA_ERB_OS_TRAINING_GUIDE.md) — operational manual for all roles
- [Architecture](ARCHITECTURE.md) — system design and data flows
- [Database](DATABASE.md) — schema and models
- [Business Rules](BUSINESS_RULES.md) — configurable business logic
- [Testing](TESTING.md) — test suite documentation
- [Project Status](PROJECT_STATUS.md) — implementation status

## User Roles

| Role | Purpose |
|------|---------|
| ADMIN | Full system access |
| HR | Employee and attendance management |
| FINANCE | Invoicing and financial operations |
| MANAGER | Team oversight |
| EMPLOYEE | Self-service access |
| VIEWER | Read-only access |

## License

Private — EUNOIA ZONES AGENCY
