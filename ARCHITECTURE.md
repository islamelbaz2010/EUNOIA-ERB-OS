# EUNOIA ERB OS - Architecture

## Overview
Single Next.js application with server-side rendering and API routes. PostgreSQL database via Prisma ORM.

## Layers
1. **Presentation**: React components with Tailwind CSS
2. **API Routes**: Next.js App Router API endpoints
3. **Business Logic**: Attendance engine, payroll engine, invoice engine
4. **Data Access**: Prisma ORM with PostgreSQL
5. **Authentication**: NextAuth.js with JWT sessions

## Key Design Decisions
- One application, not microservices
- Server-side calculations for financial data
- Salary history via effective dating
- Attendance: raw → normalized → approved
- Payroll: state machine (DRAFT → LOCKED)
- Configurable business rules (no hard-coding)
- Audit logging on all important operations

## Data Flow
### Attendance
Upload Excel → Parse → Store Raw → Match Employee → Normalize Punches → Calculate Day → Review → Lock

### Payroll
Open Period → Calculate (base + attendance + components) → Review → Approve → Lock → Generate Payslips

### Invoicing
Select Client → Add Items → Calculate (subtotal + VAT) → Save Draft → Send → Record Payments
