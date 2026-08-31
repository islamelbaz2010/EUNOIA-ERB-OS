# EUNOIA ERB OS - Testing

## Status: 58 Tests Passing

## Test Suites

### 1. Invoice Engine Tests (12 tests)
- `src/__tests__/invoice-engine.test.ts`
- Tests: calculateInvoiceTotals, calculatePaymentSchedule
- Covers: single item, multiple items, VAT disabled/enabled, discount, precision

### 2. Payroll Engine Tests (12 tests)
- `src/__tests__/payroll-engine.test.ts`
- Tests: late deduction, absence deduction, overtime, daily salary
- Covers: boundary values, precision, edge cases

### 3. Attendance Engine Tests (17 tests)
- `src/__tests__/attendance-engine.test.ts`
- Tests: late, early departure, overtime, time parsing
- Covers: grace period, normal day, overtime scenarios

### 4. Invoice Payment Tests (8 tests)
- `src/__tests__/invoice-payment.test.ts`
- Tests: invoice status determination
- Covers: no payment, partial, full, overdue

## Running Tests
```bash
npm test
```

## Build Verification
```bash
npm run build
```

## Type Checking
TypeScript compilation is verified during build.
