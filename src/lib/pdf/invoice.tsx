import React from "react";
import path from "path";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  Font,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

Font.register({
  family: "NotoSansArabic",
  fonts: [
    { src: path.join(process.cwd(), "src/lib/pdf/fonts/NotoSansArabic-Regular.ttf"), fontWeight: "normal" },
    { src: path.join(process.cwd(), "src/lib/pdf/fonts/NotoSansArabic-Bold.ttf"), fontWeight: "bold" },
  ],
});

const LOGO_PATH = path.join(process.cwd(), "public/eunoia-logo.png");

type Locale = "en" | "ar";

interface InvoiceData {
  locale?: Locale;
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
    paymentPolicy?: string;
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
  markupIsPercentage: boolean;
  markupValue: number;
  markupAmount: number;
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

const LABELS: Record<Locale, Record<string, string>> = {
  en: {
    invoice: "INVOICE",
    invoiceNo: "INVOICE NO.:",
    date: "DATE:",
    subjectedTo: "SUBJECTED TO:",
    from: "From/",
    submittedTo: "This Invoice is submitted to",
    itemDescription: "ITEM DESCRIPTION",
    price: "Price",
    qty: "QTY",
    total: "Total",
    subtotalRow: "TOTAL (In {currency})",
    markup: "MARKETING AGENCY MARKUP",
    taxes: "Taxes",
    finalTotal: "TOTAL (In {currency})",
    paid: "PAID (In {currency})",
    outstanding: "OUTSTANDING (In {currency})",
    paymentPolicy: "PAYMENT POLICY",
    notVatIncluded: "The price is not including VAT",
  },
  ar: {
    invoice: "فاتورة",
    invoiceNo: "رقم الفاتورة:",
    date: "التاريخ:",
    subjectedTo: "موجهة إلى:",
    from: "من/",
    submittedTo: "هذه الفاتورة موجهة إلى",
    itemDescription: "وصف الصنف",
    price: "السعر",
    qty: "الكمية",
    total: "الإجمالي",
    subtotalRow: "الإجمالي ({currency})",
    markup: "نسبة الوكالة التسويقية",
    taxes: "الضرائب",
    finalTotal: "الإجمالي النهائي ({currency})",
    paid: "المدفوع ({currency})",
    outstanding: "المتبقي ({currency})",
    paymentPolicy: "سياسة الدفع",
    notVatIncluded: "السعر غير شامل ضريبة القيمة المضافة",
  },
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  pageAr: {
    padding: 40,
    fontSize: 10,
    fontFamily: "NotoSansArabic",
    direction: "rtl",
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
  logo: {
    width: 110,
    marginBottom: 6,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#C41E4A",
    marginBottom: 2,
  },
  copyright: {
    fontSize: 7,
    color: "#666666",
    marginTop: 4,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerRightAr: {
    alignItems: "flex-start",
  },
  invoiceTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#C41E4A",
    marginBottom: 6,
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
  subjectedToRow: {
    marginBottom: 10,
  },
  subjectedToLabel: {
    fontSize: 8,
    color: "#666666",
    marginBottom: 2,
  },
  subjectedToName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333333",
  },
  submittedTo: {
    fontSize: 9,
    color: "#333333",
    marginBottom: 8,
    lineHeight: 1.4,
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
  colPrice: { flex: 2, textAlign: "right" },
  colQty: { flex: 1, textAlign: "center" },
  colTotal: { flex: 2, textAlign: "right" },
  bigTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#C41E4A",
    marginTop: 8,
  },
  bigTotalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
  },
  bigTotalValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  breakdownLabel: {
    fontSize: 9,
    color: "#4a5568",
  },
  breakdownValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#333333",
  },
  paymentPolicyBox: {
    marginTop: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
  },
  paymentPolicyLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#C41E4A",
    marginBottom: 4,
  },
  paymentPolicyText: {
    fontSize: 8,
    color: "#333333",
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 24,
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
  const locale: Locale = data.locale === "ar" ? "ar" : "en";
  const L = LABELS[locale];
  const isAr = locale === "ar";

  const invoiceYear = new Date(data.invoice.date).getFullYear();
  const shortNumber = data.invoice.invoiceNumber.replace(/^INV-\d+-/, "N0.");

  const noteLines = parseNotes(data.invoice.notes || "");
  const hasNotes = noteLines.length > 0;
  const totalPaid = (data.payments || []).reduce((sum, p) => sum + p.amount, 0);

  const markupLabel = data.markupIsPercentage
    ? `${L.markup} (${Number(data.markupValue)}%)`
    : L.markup;

  return (
    <Document>
      <Page size="A4" style={isAr ? styles.pageAr : styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image src={LOGO_PATH} style={styles.logo} />
            <Text style={styles.copyright}>
              Copyright@{data.company.name} {invoiceYear}
            </Text>
          </View>
          <View style={isAr ? styles.headerRightAr : styles.headerRight}>
            <Text style={styles.invoiceTitle}>{L.invoice}</Text>
            <Text style={styles.invoiceLabel}>{L.invoiceNo}</Text>
            <Text style={styles.invoiceNumber}>{shortNumber}</Text>
            <Text style={styles.dateLabel}>{L.date}</Text>
            <Text style={styles.dateValue}>{formatDateInvoice(data.invoice.date)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Subjected To (the client the invoice is issued to) */}
        <View style={styles.subjectedToRow}>
          <Text style={styles.subjectedToLabel}>{L.subjectedTo}</Text>
          <Text style={styles.subjectedToName}>{data.client.name}</Text>
        </View>

        {/* Submitted To */}
        <Text style={styles.submittedTo}>
          &quot;{L.submittedTo} {data.client.contactPerson || data.client.name}
          {data.client.contactPerson && data.client.name ? ` - ${data.client.name}` : ""}
          {"   "}
          {L.from} {isAr && data.company.nameAr ? data.company.nameAr : data.company.name}&quot;
        </Text>

        {/* Notes / Contract Terms */}
        {hasNotes && (
          <View style={styles.notesBox}>
            {noteLines.map((line, idx) => (
              <Text key={idx} style={styles.noteLine}>
                * {line}
              </Text>
            ))}
          </View>
        )}

        {/* Line Items Table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.colDesc, { color: "#ffffff" }]}>{L.itemDescription}</Text>
          <Text style={[styles.colPrice, { color: "#ffffff" }]}>{L.price}</Text>
          <Text style={[styles.colQty, { color: "#ffffff" }]}>{L.qty}</Text>
          <Text style={[styles.colTotal, { color: "#ffffff" }]}>
            {L.total} ({data.currency})
          </Text>
        </View>
        {data.items.map((item, idx) => (
          <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colPrice}>{formatMoney(item.unitPrice, data.currency)}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colTotal}>{formatMoney(item.total, data.currency)}</Text>
          </View>
        ))}

        {/* Subtotal bar */}
        <View style={styles.bigTotalRow}>
          <Text style={styles.bigTotalLabel}>{L.subtotalRow.replace("{currency}", data.currency)}</Text>
          <Text style={styles.bigTotalValue}>{formatMoney(data.subtotal, data.currency)}</Text>
        </View>

        {/* Breakdown: markup + taxes */}
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>{markupLabel}</Text>
          <Text style={styles.breakdownValue}>{formatMoney(data.markupAmount, data.currency)}</Text>
        </View>
        {data.discount > 0 && (
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{isAr ? "الخصم" : "Discount"}</Text>
            <Text style={styles.breakdownValue}>-{formatMoney(data.discount, data.currency)}</Text>
          </View>
        )}
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>
            {L.taxes} {data.vatEnabled ? `(${Number(data.vatRate)}%)` : ""}
          </Text>
          <Text style={styles.breakdownValue}>
            {data.vatEnabled ? formatMoney(data.vatAmount, data.currency) : formatMoney(0, data.currency)}
          </Text>
        </View>

        {/* Final total bar */}
        <View style={styles.bigTotalRow}>
          <Text style={styles.bigTotalLabel}>{L.finalTotal.replace("{currency}", data.currency)}</Text>
          <Text style={styles.bigTotalValue}>{formatMoney(data.total, data.currency)}</Text>
        </View>

        {totalPaid > 0 && (
          <>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{L.paid.replace("{currency}", data.currency)}</Text>
              <Text style={styles.breakdownValue}>{formatMoney(totalPaid, data.currency)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{L.outstanding.replace("{currency}", data.currency)}</Text>
              <Text style={styles.breakdownValue}>
                {formatMoney(Math.max(0, data.total - totalPaid), data.currency)}
              </Text>
            </View>
          </>
        )}

        {!data.vatEnabled && (
          <Text style={[styles.noteLine, { marginTop: 8 }]}>* {L.notVatIncluded}</Text>
        )}

        {/* Payment Policy */}
        {data.invoice.paymentPolicy && (
          <View style={styles.paymentPolicyBox}>
            <Text style={styles.paymentPolicyLabel}>{L.paymentPolicy}</Text>
            <Text style={styles.paymentPolicyText}>{data.invoice.paymentPolicy}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {[data.company.email, data.company.phone].filter(Boolean).join("  |  ")}
          </Text>
          <Text>{data.company.address}</Text>
        </View>
        <View style={styles.footer}>
          <Text>Copyright@{data.company.name} {invoiceYear}</Text>
          <Text>{shortNumber}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  const buffer = await renderToBuffer(<InvoiceDocument data={data} />);
  return buffer;
}
