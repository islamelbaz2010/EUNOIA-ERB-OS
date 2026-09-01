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

interface ReportCard {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const reportCards: ReportCard[] = [
  {
    id: "attendance",
    title: "Attendance Report",
    titleAr: "تقرير الحضور والانصراف",
    description: "تقرير شامل عن حضور وانصراف الموظفين",
    icon: Clock,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: "payroll",
    title: "Payroll Report",
    titleAr: "تقرير الرواتب",
    description: "تقرير تفصيلي عن رواتب الموظفين",
    icon: Wallet,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    id: "invoices",
    title: "Invoice Report",
    titleAr: "تقرير الفواتير",
    description: "تقرير عن الفواتير الصادرة",
    icon: Receipt,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    id: "payment",
    title: "Payment Report",
    titleAr: "تقرير المدفوعات",
    description: "تقرير عن المدفوعات المستلمة",
    icon: CreditCard,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    id: "revenue",
    title: "Revenue Report",
    titleAr: "تقرير الإيرادات",
    description: "تقرير عن إيرادات الشركة",
    icon: TrendingUp,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

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
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

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
        <h1 className="text-2xl font-bold">التقارير</h1>
        <p className="text-muted-foreground">عرض وتحميل التقارير المختلفة</p>
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
                      <h3 className="font-semibold">{report.titleAr}</h3>
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
                {reportCards.find((r) => r.id === selectedReport)?.titleAr}
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
                تحديث
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
                        <p className="text-sm text-muted-foreground">{key}</p>
                        <p className="text-2xl font-bold">
                          {typeof value === "number"
                            ? key.includes("amount") || key.includes("total")
                              ? formatCurrency(value)
                              : formatNumber(value)
                            : String(value)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {reportData.items && reportData.items.length > 0 && (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(reportData.items[0]).map((key) => (
                            <TableHead key={key}>{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.items.map((item: any, index: number) => (
                          <TableRow key={index}>
                            {Object.values(item).map((value, i) => (
                              <TableCell key={i}>
                                {typeof value === "number"
                                  ? formatCurrency(value)
                                  : String(value ?? "-")}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
          )}
        </div>
      )}
    </div>
  );
}
