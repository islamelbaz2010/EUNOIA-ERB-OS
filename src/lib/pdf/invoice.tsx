import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

interface InvoiceData {
  company: {
    name: string;
    nameAr?: string;
    address?: string;
    phone?: string;
    email?: string;
    vatNumber?: string;
  };
  invoice: {
    invoiceNumber: string;
    date: string;
    dueDate: string;
    status: string;
    notes?: string;
    paymentTerms?: number;
  };
  client: {
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  vatEnabled: boolean;
  vatRate: number;
  vatAmount: number;
  total: number;
  currency: string;
  payments?: Array<{
    amount: number;
    date: string;
    method: string;
  }>;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    direction: "ltr",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#1a365d",
    paddingBottom: 15,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 9,
    color: "#4a5568",
    marginBottom: 2,
  },
  invoiceHeaderRight: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a365d",
  },
  invoiceNumber: {
    fontSize: 10,
    color: "#4a5568",
    marginTop: 4,
  },
  statusBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
  },
  statusPaid: {
    backgroundColor: "#c6f6d5",
    color: "#276749",
  },
  statusSent: {
    backgroundColor: "#bee3f8",
    color: "#2b6cb0",
  },
  statusDraft: {
    backgroundColor: "#e2e8f0",
    color: "#4a5568",
  },
  statusOverdue: {
    backgroundColor: "#fed7d7",
    color: "#c53030",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  twoCol: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  billToCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 12,
    marginRight: 8,
  },
  detailsCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 12,
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 9,
    color: "#4a5568",
  },
  detailValue: {
    fontSize: 9,
    fontWeight: "bold",
  },
  clientName: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 9,
    color: "#4a5568",
    marginBottom: 2,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1a365d",
    color: "#ffffff",
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#f7fafc",
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colPrice: { flex: 2, textAlign: "right" },
  colTotal: { flex: 2, textAlign: "right" },
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  totalsBox: {
    width: 250,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  totalsLabel: {
    fontSize: 10,
    color: "#4a5568",
  },
  totalsValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  totalsRowDiscount: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  totalFinalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#1a365d",
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 11,
    marginTop: 4,
    borderRadius: 3,
  },
  paymentSection: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    fontWeight: "bold",
  },
  notesSection: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 9,
    color: "#4a5568",
    lineHeight: 1.5,
  },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#718096",
  },
  amountPositive: { color: "#276749" },
  amountNegative: { color: "#c53030" },
  sectionSpacing: { marginBottom: 16 },
});

const formatDateShort = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMoney = (amount: number, currency: string = "SAR") => {
  return `${currency} ${amount.toLocaleString("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const statusStyleMap: Record<string, typeof styles.statusPaid> = {
  PAID: styles.statusPaid,
  PARTIALLY_PAID: styles.statusSent,
  SENT: styles.statusSent,
  VIEWED: styles.statusSent,
  DRAFT: styles.statusDraft,
  OVERDUE: styles.statusOverdue,
  CANCELLED: styles.statusOverdue,
};

const statusLabelMap: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  VIEWED: "Viewed",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
};

const paymentMethodLabels: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  CHECK: "Check",
  CREDIT_CARD: "Credit Card",
  ONLINE: "Online",
  OTHER: "Other",
};

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  const paidAmount =
    data.payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
  const outstanding = data.total - paidAmount;
  const statusKey = data.invoice.status;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{data.company.name}</Text>
            {data.company.nameAr && (
              <Text style={styles.companyDetail}>{data.company.nameAr}</Text>
            )}
            {data.company.address && (
              <Text style={styles.companyDetail}>{data.company.address}</Text>
            )}
            {data.company.phone && (
              <Text style={styles.companyDetail}>{data.company.phone}</Text>
            )}
            {data.company.email && (
              <Text style={styles.companyDetail}>{data.company.email}</Text>
            )}
            {data.company.vatNumber && (
              <Text style={styles.companyDetail}>
                VAT: {data.company.vatNumber}
              </Text>
            )}
          </View>
          <View style={styles.invoiceHeaderRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>
              {data.invoice.invoiceNumber}
            </Text>
            <View
              style={[
                styles.statusBadge,
                statusStyleMap[statusKey] || styles.statusDraft,
              ]}
            >
              <Text>{statusLabelMap[statusKey] || statusKey}</Text>
            </View>
          </View>
        </View>

        {/* Bill To & Details */}
        <View style={styles.twoCol}>
          <View style={styles.billToCard}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.clientName}>{data.client.name}</Text>
            {data.client.contactPerson && (
              <Text style={styles.clientDetail}>
                {data.client.contactPerson}
              </Text>
            )}
            {data.client.address && (
              <Text style={styles.clientDetail}>{data.client.address}</Text>
            )}
            {data.client.phone && (
              <Text style={styles.clientDetail}>{data.client.phone}</Text>
            )}
            {data.client.email && (
              <Text style={styles.clientDetail}>{data.client.email}</Text>
            )}
          </View>
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Invoice Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {formatDateShort(data.invoice.date)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Due Date</Text>
              <Text style={styles.detailValue}>
                {formatDateShort(data.invoice.dueDate)}
              </Text>
            </View>
            {data.invoice.paymentTerms && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Terms</Text>
                <Text style={styles.detailValue}>
                  {data.invoice.paymentTerms} days
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Line Items */}
        <View style={styles.sectionSpacing}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, { color: "#ffffff" }]}>
              Description
            </Text>
            <Text style={[styles.colQty, { color: "#ffffff" }]}>Qty</Text>
            <Text style={[styles.colPrice, { color: "#ffffff" }]}>
              Unit Price
            </Text>
            <Text style={[styles.colTotal, { color: "#ffffff" }]}>Total</Text>
          </View>
          {data.items.map((item, idx) => (
            <View
              key={idx}
              style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>
                {formatMoney(item.unitPrice, data.currency)}
              </Text>
              <Text style={styles.colTotal}>
                {formatMoney(item.total, data.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>
                {formatMoney(data.subtotal, data.currency)}
              </Text>
            </View>
            {data.discount > 0 && (
              <View style={styles.totalsRowDiscount}>
                <Text style={styles.totalsLabel}>Discount</Text>
                <Text style={[styles.totalsValue, styles.amountNegative]}>
                  -{formatMoney(data.discount, data.currency)}
                </Text>
              </View>
            )}
            {data.vatEnabled && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>VAT ({data.vatRate}%)</Text>
                <Text style={styles.totalsValue}>
                  {formatMoney(data.vatAmount, data.currency)}
                </Text>
              </View>
            )}
            <View style={styles.totalFinalRow}>
              <Text>Total</Text>
              <Text>{formatMoney(data.total, data.currency)}</Text>
            </View>
          </View>
        </View>

        {/* Payments */}
        {data.payments && data.payments.length > 0 && (
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payments Received</Text>
            {data.payments.map((payment, idx) => (
              <View key={idx} style={styles.paymentRow}>
                <Text style={{ fontSize: 9, color: "#4a5568" }}>
                  {formatDateShort(payment.date)} -{" "}
                  {paymentMethodLabels[payment.method] || payment.method}
                </Text>
                <Text style={{ fontSize: 9, fontWeight: "bold" }}>
                  {formatMoney(payment.amount, data.currency)}
                </Text>
              </View>
            ))}
            <View style={styles.balanceRow}>
              <Text style={{ fontSize: 10, color: "#4a5568" }}>
                Outstanding Balance
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "bold",
                  color: outstanding > 0 ? "#c53030" : "#276749",
                }}
              >
                {formatMoney(outstanding, data.currency)}
              </Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {data.invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{data.invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{data.company.name}</Text>
          <Text>{data.invoice.invoiceNumber}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateInvoicePdf(
  data: InvoiceData
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <InvoiceDocument data={data} />
  );
  return buffer;
}
