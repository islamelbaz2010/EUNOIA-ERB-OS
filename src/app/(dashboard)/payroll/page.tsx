"use client";

import * as React from "react";
import {
  Calculator,
  Wallet,
  FileText,
  Play,
  CheckCircle,
  Lock,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatCurrency, formatNumber } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface PayrollPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  totalEmployees: number;
  totalGross: number;
  totalNet: number;
}

interface PayrollRecord {
  id: string;
  employee: { displayName: string; employeeCode: string };
  baseSalary: number;
  totalAdditions: number;
  totalDeductions: number;
  gross: number;
  net: number;
  status: string;
}

export default function PayrollPage() {
  const [periods, setPeriods] = React.useState<PayrollPeriod[]>([]);
  const [records, setRecords] = React.useState<PayrollRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedPeriod, setSelectedPeriod] = React.useState("");
  const [calculating, setCalculating] = React.useState(false);

  React.useEffect(() => {
    fetchPayrollData();
  }, []);

  async function fetchPayrollData() {
    setLoading(true);
    try {
      const res = await fetch("/api/payroll/periods");
      if (res.ok) {
        const data = await res.json();
        setPeriods(data.periods || []);
      }
    } catch (error) {
      console.error("Failed to fetch payroll data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecords(periodId: string) {
    setSelectedPeriod(periodId);
    try {
      const res = await fetch(`/api/payroll/periods/${periodId}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (error) {
      console.error("Failed to fetch records:", error);
    }
  }

  async function handleCalculate(periodId: string) {
    setCalculating(true);
    try {
      const res = await fetch("/api/payroll/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodId }),
      });
      if (res.ok) {
        toast({ title: "تم الحساب بنجاح" });
        fetchPayrollData();
        fetchRecords(periodId);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast({ title: "خطأ", description: errorData.error || "فشل في الحساب", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "خطأ", variant: "destructive" });
    } finally {
      setCalculating(false);
    }
  }

  async function handleApprove(periodId: string) {
    try {
      const res = await fetch(`/api/payroll/periods/${periodId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      if (res.ok) {
        toast({ title: "تمت الموافقة بنجاح" });
        fetchPayrollData();
      }
    } catch (error) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "success" | "warning" | "destructive"; label: string }> = {
      DRAFT: { variant: "default", label: "مسودة" },
      CALCULATED: { variant: "warning", label: "محسوب" },
      UNDER_REVIEW: { variant: "default", label: "قيد المراجعة" },
      APPROVED: { variant: "success", label: "موافق" },
      LOCKED: { variant: "destructive", label: "مقفل" },
    };
    const item = map[status] || { variant: "default" as const, label: status };
    return <Badge variant={item.variant}>{item.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الرواتب</h1>
        <p className="text-muted-foreground">إدارة فترات الرواتب والحسابات</p>
      </div>

      <Tabs defaultValue="periods">
        <TabsList>
          <TabsTrigger value="periods">
            <Wallet className="mr-2 h-4 w-4" />
            الفترات
          </TabsTrigger>
          <TabsTrigger value="calculate">
            <Calculator className="mr-2 h-4 w-4" />
            الحساب
          </TabsTrigger>
          <TabsTrigger value="records">
            <FileText className="mr-2 h-4 w-4" />
            السجلات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="periods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>فترات الرواتب</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>من</TableHead>
                    <TableHead>إلى</TableHead>
                    <TableHead>الموظفون</TableHead>
                    <TableHead>الإجمالي</TableHead>
                    <TableHead>الصافي</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : periods.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        لا توجد فترات رواتب
                      </TableCell>
                    </TableRow>
                  ) : (
                    periods.map((period) => (
                      <TableRow key={period.id}>
                        <TableCell className="font-medium">{period.name}</TableCell>
                        <TableCell>{formatDate(period.startDate)}</TableCell>
                        <TableCell>{formatDate(period.endDate)}</TableCell>
                        <TableCell>{formatNumber(period.totalEmployees)}</TableCell>
                        <TableCell>{formatCurrency(Number(period.totalGross))}</TableCell>
                        <TableCell>{formatCurrency(Number(period.totalNet))}</TableCell>
                        <TableCell>{statusBadge(period.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => fetchRecords(period.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {period.status === "DRAFT" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCalculate(period.id)}
                                disabled={calculating}
                              >
                                <Calculator className="h-4 w-4" />
                              </Button>
                            )}
                            {period.status === "CALCULATED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApprove(period.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>حساب الرواتب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="اختر الفترة" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods
                      .filter((p) => p.status === "DRAFT" || p.status === "CALCULATED")
                      .map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          {period.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => handleCalculate(selectedPeriod)}
                  disabled={!selectedPeriod || calculating}
                >
                  {calculating ? (
                    "جاري الحساب..."
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      بدء الحساب
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                سيتم حساب رواتب جميع الموظفين النشطين في الفترة المحددة
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>سجلات الرواتب</CardTitle>
                {selectedPeriod && (
                  <Badge variant="secondary">
                    {periods.find((p) => p.id === selectedPeriod)?.name}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedPeriod ? (
                <p className="text-center text-muted-foreground py-8">
                  اختر فترة لعرض السجلات
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الموظف</TableHead>
                      <TableHead>الراتب الأساسي</TableHead>
                      <TableHead>الإضافات</TableHead>
                      <TableHead>الخصومات</TableHead>
                      <TableHead>الإجمالي</TableHead>
                      <TableHead>الصافي</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          لا توجد سجلات
                        </TableCell>
                      </TableRow>
                    ) : (
                      records.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{record.employee.displayName}</p>
                              <p className="text-xs text-muted-foreground">{record.employee.employeeCode}</p>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(Number(record.baseSalary))}</TableCell>
                          <TableCell className="text-success">{formatCurrency(Number(record.totalAdditions))}</TableCell>
                          <TableCell className="text-destructive">{formatCurrency(Number(record.totalDeductions))}</TableCell>
                          <TableCell>{formatCurrency(Number(record.gross))}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(Number(record.net))}</TableCell>
                          <TableCell>{statusBadge(record.status)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
