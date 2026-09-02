"use client";

import * as React from "react";
import {
  Calculator,
  Wallet,
  FileText,
  Play,
  CheckCircle,
  ShieldCheck,
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
import { canCalculatePayrollPeriod, translatePayrollError } from "@/lib/payroll-workflow";
import { useLocale } from "@/hooks/use-locale";

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
  const { t } = useLocale();
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
        toast({ title: t("payroll.calculationCompleted") });
        fetchPayrollData();
        fetchRecords(periodId);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast({
          title: t("common.error"),
          description: translatePayrollError(errorData.error, t("payroll.calculationCompleted")),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setCalculating(false);
    }
  }

  async function handleTransition(periodId: string, status: string, successMessage: string) {
    try {
      const res = await fetch(`/api/payroll/periods/${periodId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast({ title: successMessage });
        fetchPayrollData();
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast({
          title: t("common.error"),
          description: translatePayrollError(errorData.error, t("common.error")),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  }

  const handleSendForReview = (periodId: string) =>
    handleTransition(periodId, "UNDER_REVIEW", t("payroll.periodSentReview"));
  const handleApprovePeriod = (periodId: string) =>
    handleTransition(periodId, "APPROVED", t("payroll.periodApproved"));
  const handleLockPeriod = (periodId: string) =>
    handleTransition(periodId, "LOCKED", t("payroll.periodLocked"));

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "success" | "warning" | "destructive"; label: string }> = {
      DRAFT: { variant: "default", label: t("status.payroll.DRAFT") },
      CALCULATED: { variant: "warning", label: t("status.payroll.CALCULATED") },
      UNDER_REVIEW: { variant: "default", label: t("status.payroll.UNDER_REVIEW") },
      APPROVED: { variant: "success", label: t("status.payroll.APPROVED") },
      LOCKED: { variant: "destructive", label: t("status.payroll.LOCKED") },
    };
    const item = map[status] || { variant: "default" as const, label: status };
    return <Badge variant={item.variant}>{item.label}</Badge>;
  };

  const recordStatusBadge = (status: string) => {
    const variant: "default" | "success" | "warning" | "destructive" =
      status === "PAID" || status === "APPROVED" ? "success" : status === "CALCULATED" ? "warning" : "default";
    return <Badge variant={variant}>{t(`status.payrollRecord.${status}`) || status}</Badge>;
  };

  const draftPeriods = periods.filter((p) => canCalculatePayrollPeriod(p.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("payroll.title")}</h1>
        <p className="text-muted-foreground">{t("payroll.subtitle")}</p>
      </div>

      <Tabs defaultValue="periods">
        <TabsList>
          <TabsTrigger value="periods">
            <Wallet className="me-2 h-4 w-4" />
            {t("payroll.periods")}
          </TabsTrigger>
          <TabsTrigger value="calculate">
            <Calculator className="me-2 h-4 w-4" />
            {t("payroll.calculate")}
          </TabsTrigger>
          <TabsTrigger value="records">
            <FileText className="me-2 h-4 w-4" />
            {t("payroll.records")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="periods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("payroll.periods")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("payroll.name")}</TableHead>
                    <TableHead>{t("payroll.from")}</TableHead>
                    <TableHead>{t("payroll.to")}</TableHead>
                    <TableHead>{t("payroll.employees")}</TableHead>
                    <TableHead>{t("payroll.gross")}</TableHead>
                    <TableHead>{t("payroll.net")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead className="text-start">{t("common.actions")}</TableHead>
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
                        {t("payroll.noPeriods")}
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
                              title={t("payroll.view")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canCalculatePayrollPeriod(period.status) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCalculate(period.id)}
                                disabled={calculating}
                                title={t("payroll.calculate")}
                              >
                                <Calculator className="h-4 w-4" />
                              </Button>
                            )}
                            {period.status === "CALCULATED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendForReview(period.id)}
                                title={t("payroll.sendReview")}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {period.status === "UNDER_REVIEW" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApprovePeriod(period.id)}
                                title={t("payroll.approve")}
                              >
                                <ShieldCheck className="h-4 w-4" />
                              </Button>
                            )}
                            {period.status === "APPROVED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleLockPeriod(period.id)}
                                title={t("payroll.lock")}
                              >
                                <Lock className="h-4 w-4" />
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
              <CardTitle>{t("payroll.calculate")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {draftPeriods.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t("payroll.noDraft")}
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder={t("payroll.selectPeriod")} />
                      </SelectTrigger>
                      <SelectContent>
                        {draftPeriods.map((period) => (
                          <SelectItem key={period.id} value={period.id}>
                            {period.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => handleCalculate(selectedPeriod)}
                      disabled={!selectedPeriod || calculating || !draftPeriods.some((p) => p.id === selectedPeriod)}
                    >
                      {calculating ? (
                        t("common.loading")
                      ) : (
                        <>
                          <Play className="me-2 h-4 w-4" />
                          {t("payroll.calculateAction")}
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("payroll.selectPeriod")}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("payroll.records")}</CardTitle>
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
                  {t("payroll.noRecords")}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("employees.name")}</TableHead>
                      <TableHead>{t("payroll.baseSalary")}</TableHead>
                      <TableHead>{t("payroll.additions")}</TableHead>
                      <TableHead>{t("payroll.deductions")}</TableHead>
                      <TableHead>{t("payroll.gross")}</TableHead>
                      <TableHead>{t("payroll.net")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          {t("common.noRecords")}
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
                          <TableCell>{recordStatusBadge(record.status)}</TableCell>
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
