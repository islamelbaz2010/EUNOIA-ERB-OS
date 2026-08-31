import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

interface PayslipData {
  company: {
    name: string;
    nameAr?: string;
    address?: string;
    phone?: string;
  };
  employee: {
    firstName: string;
    lastName: string;
    employeeCode?: string;
    jobTitle?: string;
    department?: string;
  };
  period: {
    name: string;
    startDate: string;
    endDate: string;
  };
  payroll: {
    baseSalary: number;
    totalAdditions: number;
    totalDeductions: number;
    attendanceDeductions: number;
    overtime: number;
    gross: number;
    net: number;
    components: Array<{
      type: string;
      name: string;
      amount: number;
    }>;
    attendanceSummary: {
      totalWorkDays: number;
      presentDays: number;
      absentDays: number;
      lateDays: number;
      overtimeDays: number;
    };
  };
  payslipNumber: string;
  generatedAt: string;
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
  payslipTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a365d",
    textAlign: "right",
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
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  infoLabel: {
    color: "#4a5568",
    fontSize: 9,
  },
  infoValue: {
    fontWeight: "bold",
    fontSize: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
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
  colDesc: {
    flex: 3,
  },
  colAmount: {
    flex: 2,
    textAlign: "right",
  },
  colLabel: {
    flex: 3,
    fontSize: 9,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  summaryLabel: {
    fontSize: 10,
    color: "#4a5568",
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#1a365d",
    color: "#ffffff",
    fontWeight: "bold",
  },
  attendanceGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  attendanceItem: {
    alignItems: "center",
    flex: 1,
  },
  attendanceValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a365d",
  },
  attendanceLabel: {
    fontSize: 8,
    color: "#4a5568",
    marginTop: 2,
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
  amountPositive: {
    color: "#276749",
  },
  amountNegative: {
    color: "#c53030",
  },
  sectionSpacing: {
    marginBottom: 16,
  },
});

const formatDateShort = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMoney = (amount: number) => {
  return `SAR ${amount.toLocaleString("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export function PayslipDocument({ data }: { data: PayslipData }) {
  const additions = data.payroll.components.filter(
    (c) =>
      c.type !== "DEDUCTION" &&
      c.type !== "ADVANCE" &&
      c.type !== "PENALTY" &&
      c.type !== "ATTENDANCE_DEDUCTION" &&
      c.type !== "LATE_DEDUCTION" &&
      c.type !== "ABSENCE_DEDUCTION" &&
      c.type !== "UNPAID_LEAVE"
  );

  const deductions = data.payroll.components.filter(
    (c) =>
      c.type === "DEDUCTION" ||
      c.type === "ADVANCE" ||
      c.type === "PENALTY"
  );

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
          </View>
          <Text style={styles.payslipTitle}>PAYSLIP</Text>
        </View>

        {/* Employee & Period Info */}
        <View style={[styles.card, styles.sectionSpacing]}>
          <View style={styles.infoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Employee Name</Text>
              <Text style={styles.infoValue}>
                {data.employee.firstName} {data.employee.lastName}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Payroll Period</Text>
              <Text style={styles.infoValue}>{data.period.name}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Employee Code</Text>
              <Text style={styles.infoValue}>
                {data.employee.employeeCode || "N/A"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Period Range</Text>
              <Text style={styles.infoValue}>
                {formatDateShort(data.period.startDate)} -{" "}
                {formatDateShort(data.period.endDate)}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Job Title</Text>
              <Text style={styles.infoValue}>
                {data.employee.jobTitle || "N/A"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>
                {data.employee.department || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Earnings */}
        <View style={styles.sectionSpacing}>
          <Text style={styles.sectionTitle}>Earnings</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, { color: "#ffffff" }]}>Description</Text>
            <Text style={[styles.colAmount, { color: "#ffffff" }]}>Amount</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.colDesc}>Basic Salary</Text>
            <Text style={[styles.colAmount, styles.amountPositive]}>
              {formatMoney(data.payroll.baseSalary)}
            </Text>
          </View>
          {data.payroll.overtime > 0 && (
            <View style={styles.tableRowAlt}>
              <Text style={styles.colDesc}>Overtime</Text>
              <Text style={[styles.colAmount, styles.amountPositive]}>
                {formatMoney(data.payroll.overtime)}
              </Text>
            </View>
          )}
          {additions.map((item, idx) => (
            <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={styles.colDesc}>{item.name}</Text>
              <Text style={[styles.colAmount, styles.amountPositive]}>
                {formatMoney(Number(item.amount))}
              </Text>
            </View>
          ))}
        </View>

        {/* Deductions */}
        <View style={styles.sectionSpacing}>
          <Text style={styles.sectionTitle}>Deductions</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, { color: "#ffffff" }]}>Description</Text>
            <Text style={[styles.colAmount, { color: "#ffffff" }]}>Amount</Text>
          </View>
          {data.payroll.attendanceDeductions > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.colDesc}>Attendance Deductions</Text>
              <Text style={[styles.colAmount, styles.amountNegative]}>
                {formatMoney(data.payroll.attendanceDeductions)}
              </Text>
            </View>
          )}
          {deductions.length === 0 && data.payroll.attendanceDeductions === 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.colDesc, { color: "#718096" }]}>
                No deductions
              </Text>
              <Text style={[styles.colAmount, { color: "#718096" }]}>-</Text>
            </View>
          )}
          {deductions.map((item, idx) => (
            <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={styles.colDesc}>{item.name}</Text>
              <Text style={[styles.colAmount, styles.amountNegative]}>
                {formatMoney(Number(item.amount))}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gross Salary</Text>
            <Text style={styles.summaryValue}>
              {formatMoney(data.payroll.gross)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Deductions</Text>
            <Text style={[styles.summaryValue, { color: "#c53030" }]}>
              -{formatMoney(data.payroll.totalDeductions)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Net Salary</Text>
            <Text>{formatMoney(data.payroll.net)}</Text>
          </View>
        </View>

        {/* Attendance Summary */}
        {data.payroll.attendanceSummary && (
          <View style={[styles.card, styles.sectionSpacing]}>
            <Text style={styles.sectionTitle}>Attendance Summary</Text>
            <View style={styles.attendanceGrid}>
              <View style={styles.attendanceItem}>
                <Text style={styles.attendanceValue}>
                  {data.payroll.attendanceSummary.totalWorkDays}
                </Text>
                <Text style={styles.attendanceLabel}>Work Days</Text>
              </View>
              <View style={styles.attendanceItem}>
                <Text style={styles.attendanceValue}>
                  {data.payroll.attendanceSummary.presentDays}
                </Text>
                <Text style={styles.attendanceLabel}>Present</Text>
              </View>
              <View style={styles.attendanceItem}>
                <Text style={[styles.attendanceValue, { color: "#c53030" }]}>
                  {data.payroll.attendanceSummary.absentDays}
                </Text>
                <Text style={styles.attendanceLabel}>Absent</Text>
              </View>
              <View style={styles.attendanceItem}>
                <Text style={[styles.attendanceValue, { color: "#d69e2e" }]}>
                  {data.payroll.attendanceSummary.lateDays}
                </Text>
                <Text style={styles.attendanceLabel}>Late</Text>
              </View>
              <View style={styles.attendanceItem}>
                <Text style={[styles.attendanceValue, { color: "#276749" }]}>
                  {data.payroll.attendanceSummary.overtimeDays}
                </Text>
                <Text style={styles.attendanceLabel}>Overtime</Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Payslip: {data.payslipNumber}</Text>
          <Text>
            Generated:{" "}
            {new Date(data.generatedAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generatePayslipPdf(
  data: PayslipData
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <PayslipDocument data={data} />
  );
  return buffer;
}
