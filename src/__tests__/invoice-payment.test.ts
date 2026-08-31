function determineInvoiceStatus(
  totalPaid: number,
  invoiceTotal: number,
  dueDate: Date,
  currentStatus?: string
): string {
  if (totalPaid >= invoiceTotal) return 'PAID';
  if (totalPaid > 0) return 'PARTIALLY_PAID';
  if (new Date() > dueDate && currentStatus !== 'DRAFT') return 'OVERDUE';
  if (currentStatus === 'DRAFT' || currentStatus === 'SENT' || currentStatus === 'VIEWED') {
    return currentStatus;
  }
  return 'SENT';
}

describe('Invoice Payment Status', () => {
  describe('determineInvoiceStatus', () => {
    const futureDate = new Date(2027, 0, 1);
    const pastDate = new Date(2025, 0, 1);

    it('no payments, not overdue → SENT', () => {
      expect(determineInvoiceStatus(0, 500, futureDate)).toBe('SENT');
    });

    it('no payments, overdue → OVERDUE', () => {
      expect(determineInvoiceStatus(0, 500, pastDate)).toBe('OVERDUE');
    });

    it('no payments, overdue but DRAFT → DRAFT', () => {
      expect(determineInvoiceStatus(0, 500, pastDate, 'DRAFT')).toBe('DRAFT');
    });

    it('partial payment → PARTIALLY_PAID', () => {
      expect(determineInvoiceStatus(200, 500, futureDate)).toBe('PARTIALLY_PAID');
    });

    it('full payment → PAID', () => {
      expect(determineInvoiceStatus(500, 500, futureDate)).toBe('PAID');
    });

    it('overpayment → PAID', () => {
      expect(determineInvoiceStatus(600, 500, futureDate)).toBe('PAID');
    });

    it('keeps VIEWED status when not overdue and no payment', () => {
      expect(determineInvoiceStatus(0, 500, futureDate, 'VIEWED')).toBe('VIEWED');
    });

    it('partial payment ignores previous status', () => {
      expect(determineInvoiceStatus(100, 500, futureDate, 'OVERDUE')).toBe('PARTIALLY_PAID');
    });
  });
});
