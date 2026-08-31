import { calculateInvoiceTotals, calculatePaymentSchedule } from '@/lib/invoice-engine';

describe('calculateInvoiceTotals', () => {
  it('single item, no discount, no VAT', () => {
    const result = calculateInvoiceTotals(
      [{ quantity: 2, unitPrice: 100 }],
      {}
    );
    expect(result.subtotal).toBe(200);
    expect(result.discount).toBe(0);
    expect(result.taxableAmount).toBe(200);
    expect(result.vatEnabled).toBe(false);
    expect(result.vatAmount).toBe(0);
    expect(result.total).toBe(200);
  });

  it('multiple items, no discount, no VAT', () => {
    const result = calculateInvoiceTotals(
      [
        { quantity: 3, unitPrice: 50 },
        { quantity: 2, unitPrice: 100 },
      ],
      {}
    );
    expect(result.subtotal).toBe(350);
    expect(result.total).toBe(350);
  });

  it('VAT disabled', () => {
    const result = calculateInvoiceTotals(
      [{ quantity: 1, unitPrice: 500 }],
      { vatEnabled: false, vatRate: 15 }
    );
    expect(result.vatEnabled).toBe(false);
    expect(result.vatAmount).toBe(0);
    expect(result.total).toBe(500);
  });

  it('VAT enabled at 15%', () => {
    const result = calculateInvoiceTotals(
      [{ quantity: 1, unitPrice: 200 }],
      { vatEnabled: true, vatRate: 15 }
    );
    expect(result.taxableAmount).toBe(200);
    expect(result.vatAmount).toBe(30);
    expect(result.total).toBe(230);
  });

  it('discount applied', () => {
    const result = calculateInvoiceTotals(
      [{ quantity: 1, unitPrice: 1000 }],
      { discount: 100 }
    );
    expect(result.subtotal).toBe(1000);
    expect(result.discount).toBe(100);
    expect(result.taxableAmount).toBe(900);
    expect(result.total).toBe(900);
  });

  it('discount + VAT', () => {
    const result = calculateInvoiceTotals(
      [{ quantity: 1, unitPrice: 1000 }],
      { discount: 200, vatEnabled: true, vatRate: 15 }
    );
    expect(result.subtotal).toBe(1000);
    expect(result.discount).toBe(200);
    expect(result.taxableAmount).toBe(800);
    expect(result.vatAmount).toBe(120);
    expect(result.total).toBe(920);
  });

  it('zero discount', () => {
    const result = calculateInvoiceTotals(
      [{ quantity: 1, unitPrice: 500 }],
      { discount: 0 }
    );
    expect(result.discount).toBe(0);
    expect(result.taxableAmount).toBe(500);
    expect(result.total).toBe(500);
  });

  it('large amounts round to 2 decimal places', () => {
    const result = calculateInvoiceTotals(
      [{ quantity: 10000, unitPrice: 99.99 }],
      { discount: 123.45, vatEnabled: true, vatRate: 15 }
    );
    expect(result.subtotal).toBe(999900);
    expect(result.discount).toBe(123.45);
    expect(result.taxableAmount).toBe(999776.55);
    expect(result.vatAmount).toBe(149966.48);
    expect(result.total).toBe(1149743.03);
  });
});

describe('calculatePaymentSchedule', () => {
  it('single installment', () => {
    const start = new Date(2026, 0, 1);
    const schedule = calculatePaymentSchedule(1000, 1, start, 30);
    expect(schedule).toHaveLength(1);
    expect(schedule[0].amount).toBe(1000);
    expect(schedule[0].installmentNumber).toBe(1);
    expect(schedule[0].dueDate).toEqual(new Date(2026, 0, 31));
  });

  it('multiple installments sum to total', () => {
    const start = new Date(2026, 0, 1);
    const schedule = calculatePaymentSchedule(1000, 3, start, 30);
    expect(schedule).toHaveLength(3);

    const totalAmount = schedule.reduce((sum, s) => sum + s.amount, 0);
    expect(totalAmount).toBeCloseTo(1000, 2);
  });

  it('remainder goes to last installment', () => {
    const start = new Date(2026, 0, 1);
    const schedule = calculatePaymentSchedule(1000, 3, start, 30);
    // 1000/3 = 333.33, remainder = 1000 - 333.33*3 = 0.01
    expect(schedule[0].amount).toBe(333.33);
    expect(schedule[1].amount).toBe(333.33);
    expect(schedule[2].amount).toBe(333.34);
  });

  it('due dates are evenly spaced', () => {
    const start = new Date(2026, 0, 1);
    const schedule = calculatePaymentSchedule(600, 3, start, 30);
    expect(schedule[0].dueDate).toEqual(new Date(2026, 0, 31));
    expect(schedule[1].dueDate).toEqual(new Date(2026, 2, 2));
    expect(schedule[2].dueDate).toEqual(new Date(2026, 3, 1));
  });

  it('zero installments returns empty', () => {
    const schedule = calculatePaymentSchedule(1000, 0, new Date(), 30);
    expect(schedule).toHaveLength(0);
  });
});
