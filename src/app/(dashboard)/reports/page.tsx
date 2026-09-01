"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Wallet,
  Receipt,
  CreditCard,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatCurrency, formatNumber } from "@/lib/utils";

function safeRenderValue(value: any): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") {
    if (value.name) return value.name;
    if (value.displayName) return value.displayName;
    return JSON.stringify(value);
  }
  return String(value);
}

const CURRENCY_KEY_HINTS = [
  "amount",
  "total",
  "salary",
  "gross",
  "net",
  "deduction",
  "overtime",
  "price",
  "paid",
  "outstanding",
];

// These summary/item keys contain "total"/"overtime" etc. but hold a plain
// count or a minute count, not a monetary amount — never currency-format them.
const NON_CURRENCY_KEYS = new Set([
  "totalEmployees",
  "totalPresent",
  "totalAbsent",
  "totalInvoices",
  "totalPayments",
  "lateMinutes",
  "overtimeMinutes",
  "presentDays",
  "absentDays",
  "leaveDays",
]);

function isCurrencyField(key: string, reportId?: string | null): boolean {
  if (NON_CURRENCY_KEYS.has(key)) return false;
  // In the attendance report specifically, totals are minute counts, not money.
  if (reportId === "attendance" && (key === "totalLate" || key === "totalOvertime")) return false;
  const k = key.toLowerCase();
  return CURRENCY_KEY_HINTS.some((hint) => k.includes(hint));
}

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const reportCards: ReportCard[] = [
  {
    id: "attendance",
    title: "Attendance Report",
    description: "A comprehensive report on employee attendance",
    icon: Clock,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: "payroll",
    title: "Payroll Report",
    description: "A detailed report on employee payroll",
    icon: Wallet,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    id: "invoices",
    title: "Invoice Report",
    description: "A report on invoices issued",
    icon: Receipt,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    id: "payment",
    title: "Payment Report",
    description: "A report on payments received",
    icon: CreditCard,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    id: "revenue",
    title: "Revenue Report",
    description: "A report on company revenue",
    icon: TrendingUp,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

const reportItemLabels: Record<string, string> = {
  id: "ID",
  employeeId: "Employee",
  employeeCode: "Employee Code",
  displayName: "Name",
  firstName: "First Name",
  lastName: "Last Name",
  baseSalary: "Base Salary",
  totalAdditions: "Additions",
  totalDeductions: "Deductions",
  overtime: "Overtime",
  overtimeMinutes: "Overtime (min)",
  gross: "Gross",
  net: "Net",
  status: "Status",
  period: "Period",
  invoiceNumber: "Invoice #",
  clientName: "Client",
  total: "Total",
  paid: "Paid",
  outstanding: "Outstanding",
  amount: "Amount",
  paymentDate: "Date",
  method: "Method",
  reference: "Reference",
  date: "Date",
  dueDate: "Due Date",
  workMinutes: "Hours Worked",
  workHours: "Hours Worked",
  lateMinutes: "Late (min)",
  presentDays: "Present Days",
  absentDays: "Absent Days",
  leaveDays: "Leave Days",
};

const summaryLabels: Record<string, string> = {
  totalEmployees: "Total Employees",
  totalPresent: "Present",
  totalAbsent: "Absent",
  totalLate: "Late",
  totalOvertime: "Overtime",
  averageAttendance: "Average Attendance",
  totalInvoices: "Total Invoices",
  totalSubtotal: "Subtotal",
  totalDiscount: "Discount",
  totalVat: "VAT",
  totalAmount: "Total",
  totalPaid: "Paid",
  totalBaseSalary: "Total Base Salary",
  totalGross: "Total Gross Salary",
  totalNet: "Total Net Salary",
  totalDeductions: "Total Deductions",
  totalLateMinutes: "Total Late (min)",
  totalOvertimeMinutes: "Total Overtime (min)",
  byStatus: "By Status",
  totalPayments: "Total Payments",
  byMethod: "By Payment Method",
  totalRevenue: "Total Revenue",
  totalOutstanding: "Outstanding",
};

export default function ReportsPage() {
  const router = useRouter();
  const [selectedReport, setSelectedReport] = React.useState<string | null>(null);
  const [reportData, setReportData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  async function fetchReport(reportId: string) {
    setLoading(true);
    setSelectedReport(reportId);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("startDate", dateFrom);
      if (dateTo) params.set("endDate", dateTo);

      const res = await fetch(`/api/reports/${reportId}?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (error) {
      console.error("Failed to fetch report:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">View and export the available reports</p>
      </div>

      {!selectedReport ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reportCards.map((report) => {
            const Icon = report.icon;
            return (
              <Card
                key={report.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => fetchReport(report.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg p-3 ${report.bgColor}`}>
                      <Icon className={`h-6 w-6 ${report.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{report.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {report.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => { setSelectedReport(null); setReportData(null); }}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-bold">
                {reportCards.find((r) => r.id === selectedReport)?.title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
              <Button onClick={() => fetchReport(selectedReport)}>
                Refresh
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-8 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          ) : reportData ? (
            <div className="space-y-6">
              {reportData.summary && (
                <div className="grid gap-4 sm:grid-cols-3">
                  {Object.entries(reportData.summary).map(([key, value]) => (
                    <Card key={key}>
                      <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">{summaryLabels[key] || key}</p>
                        <p className="text-2xl font-bold">
                          {typeof value === "number"
                            ? isCurrencyField(key, selectedReport)
                              ? formatCurrency(value)
                              : formatNumber(value)
                            : typeof value === "object" && value !== null
                              ? Object.entries(value as Record<string, number>)
                                  .map(([k, v]) => `${k}: ${key === "byMethod" ? formatCurrency(v) : formatNumber(v)}`)
                                  .join(", ")
                              : safeRenderValue(value)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {reportData.items && reportData.items.length > 0 ? (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(reportData.items[0]).map((key) => (
                            <TableHead key={key}>{reportItemLabels[key] || summaryLabels[key] || key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.items.map((item: any, index: number) => (
                          <TableRow key={index}>
                            {Object.entries(item).map(([key, value], i) => (
                              <TableCell key={i}>
                                {typeof value === "number"
                                  ? isCurrencyField(key, selectedReport)
                                    ? formatCurrency(value)
                                    : formatNumber(value)
                                  : safeRenderValue(value)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No data available</p>
          )}
        </div>
      )}
    </div>
  );
}
