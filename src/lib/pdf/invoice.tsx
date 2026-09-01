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
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#C41E4A",
    marginBottom: 2,
  },
  companyYear: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#C41E4A",
  },
  copyright: {
    fontSize: 7,
    color: "#666666",
    marginTop: 4,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  invoiceLabel: {
    fontSize: 8,
    color: "#666666",
  },
  invoiceNumber: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#333333",
  },
  dateLabel: {
    fontSize: 8,
    color: "#666666",
    marginTop: 4,
  },
  dateValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#333333",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#C41E4A",
    marginBottom: 12,
  },
  submittedTo: {
    fontSize: 9,
    color: "#333333",
    marginBottom: 8,
    lineHeight: 1.4,
  },
  fromLine: {
    fontSize: 9,
    color: "#333333",
    marginBottom: 12,
  },
  notesBox: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  noteLine: {
    fontSize: 8,
    color: "#333333",
    marginBottom: 4,
    lineHeight: 1.4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#C41E4A",
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
    width: 280,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  totalsLabel: {
    fontSize: 9,
    color: "#4a5568",
  },
  totalsValue: {
    fontSize: 9,
    fontWeight: "bold",
  },
  totalFinalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#C41E4A",
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 10,
    marginTop: 4,
    borderRadius: 3,
  },
  subjectedTo: {
    fontSize: 9,
    color: "#333333",
    marginTop: 20,
    fontWeight: "bold",
  },
  subjectedToName: {
    fontSize: 11,
    color: "#333333",
    fontWeight: "bold",
    marginTop: 4,
  },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#718096",
  },
});

const formatDateInvoice = (dateStr: string) => {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatMoney = (amount: number, currency: string = "EGP") => {
  return `${currency}${amount.toLocaleString("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

function parseNotes(noteText: string): string[] {
  if (!noteText) return [];
  return noteText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  const invoiceYear = new Date(data.invoice.date).getFullYear();
  const shortNumber = data.invoice.invoiceNumber.replace(/^INV-\d+-/, "N0.");

  const noteLines = parseNotes(data.invoice.notes || "");
  const hasNotes = noteLines.length > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text style={styles.companyName}>{data.company.name}</Text>
              <Text style={styles.companyYear}> INVOICE {invoiceYear}</Text>
            </View>
            <Text style={styles.copyright}>Copyright@{data.company.name}{invoiceYear}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceLabel}>INVOICE NO.:</Text>
            <Text style={styles.invoiceNumber}>{shortNumber}</Text>
            <Text style={styles.dateLabel}>DATE:</Text>
            <Text style={styles.dateValue}>{formatDateInvoice(data.invoice.date)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Submitted To */}
        <Text style={styles.submittedTo}>
          &quot;This Invoice is submitted to {data.client.contactPerson || data.client.name}
          {data.client.contactPerson && data.client.name ? ` - ${data.client.name}` : ""}
          {data.company.nameAr ? `          From/ ${data.company.nameAr}` : `          From/ ${data.company.name}`}&quot;
        </Text>

        {/* Notes / Payment Terms */}
        {hasNotes && (
          <View style={styles.notesBox}>
            {noteLines.map((line, idx) => (
              <Text key={idx} style={styles.noteLine}>* {line}</Text>
            ))}
          </View>
        )}

        {/* Line Items Table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.colDesc, { color: "#ffffff" }]}>INVOICE ITEM DESCRIPTION</Text>
          <Text style={[styles.colQty, { color: "#ffffff" }]}>QTY</Text>
          <Text style={[styles.colPrice, { color: "#ffffff" }]}>Price</Text>
          <Text style={[styles.colTotal, { color: "#ffffff" }]}>Total ( In {data.currency})</Text>
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

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>MARKETING AGENCY MARKUP</Text>
              <Text style={styles.totalsValue}>
                {formatMoney(data.discount, data.currency)}
              </Text>
            </View>
            {data.vatEnabled && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Taxes ({data.vatRate}%)</Text>
                <Text style={styles.totalsValue}>
                  {formatMoney(data.vatAmount, data.currency)}
                </Text>
              </View>
            )}
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>TOTAL (In {data.currency})</Text>
              <Text style={styles.totalsValue}>
                {formatMoney(data.subtotal, data.currency)}
              </Text>
            </View>
            <View style={styles.totalFinalRow}>
              <Text>TOTAL (In {data.currency})</Text>
              <Text>{formatMoney(data.total, data.currency)}</Text>
            </View>
          </View>
        </View>

        {/* Subjected To */}
        <Text style={styles.subjectedTo}>SUBJECTED TO:</Text>
        {data.company.nameAr && (
          <Text style={styles.subjectedToName}>{data.company.nameAr}</Text>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Copyright@{data.company.name}{invoiceYear}</Text>
          <Text>{shortNumber}</Text>
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
