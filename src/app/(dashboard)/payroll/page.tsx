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
import { PAYROLL_RECORD_STATUS_LABELS } from "@/lib/constants";

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
        toast({ title: "Calculation completed successfully" });
        fetchPayrollData();
        fetchRecords(periodId);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast({
          title: "Error",
          description: translatePayrollError(errorData.error, "Calculation failed"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setCalculating(false);
    }
  }

  // Shared handler for every PayrollPeriod status transition (send for
  // review / approve / lock). The backend independently re-validates the
  // transition (see src/lib/payroll-workflow.ts) regardless of what the UI
  // offers, so this is purely "ask for the next valid state and report the
  // result" — it can never itself skip a state.
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
          title: "Error",
          description: translatePayrollError(errorData.error, "This action could not be completed"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  }

  const handleSendForReview = (periodId: string) =>
    handleTransition(periodId, "UNDER_REVIEW", "Period sent for review");
  const handleApprovePeriod = (periodId: string) =>
    handleTransition(periodId, "APPROVED", "Period approved");
  const handleLockPeriod = (periodId: string) =>
    handleTransition(periodId, "LOCKED", "Period locked permanently");

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "success" | "warning" | "destructive"; label: string }> = {
      DRAFT: { variant: "default", label: "Draft" },
      CALCULATED: { variant: "warning", label: "Calculated" },
      UNDER_REVIEW: { variant: "default", label: "Under Review" },
      APPROVED: { variant: "success", label: "Approved" },
      LOCKED: { variant: "destructive", label: "Locked" },
    };
    const item = map[status] || { variant: "default" as const, label: status };
    return <Badge variant={item.variant}>{item.label}</Badge>;
  };

  // PayrollRecord has its own status enum (DRAFT/CALCULATED/REVIEWED/
  // APPROVED/PAID) — distinct from PayrollPeriod's — so it must not be run
  // through statusBadge above, which would silently fall back to a raw
  // English value for REVIEWED/APPROVED/PAID.
  const recordStatusBadge = (status: string) => {
    const variant: "default" | "success" | "warning" | "destructive" =
      status === "PAID" || status === "APPROVED" ? "success" : status === "CALCULATED" ? "warning" : "default";
    return <Badge variant={variant}>{PAYROLL_RECORD_STATUS_LABELS[status] || status}</Badge>;
  };

  // Calculation is only ever valid for a DRAFT period (enforced by the
  // backend). Only offer those here so the button can never be clicked
  // for a period the API will reject.
  const draftPeriods = periods.filter((p) => canCalculatePayrollPeriod(p.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payroll</h1>
        <p className="text-muted-foreground">Manage payroll periods and calculations</p>
      </div>

      <Tabs defaultValue="periods">
        <TabsList>
          <TabsTrigger value="periods">
            <Wallet className="mr-2 h-4 w-4" />
            Periods
          </TabsTrigger>
          <TabsTrigger value="calculate">
            <Calculator className="mr-2 h-4 w-4" />
            Calculate
          </TabsTrigger>
          <TabsTrigger value="records">
            <FileText className="mr-2 h-4 w-4" />
            Records
          </TabsTrigger>
        </TabsList>

        <TabsContent value="periods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Periods</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-left">Actions</TableHead>
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
                        No payroll periods found
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
                            {canCalculatePayrollPeriod(period.status) && (
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
                                onClick={() => handleSendForReview(period.id)}
                                title="Send for review"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {period.status === "UNDER_REVIEW" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApprovePeriod(period.id)}
                                title="Approve"
                              >
                                <ShieldCheck className="h-4 w-4" />
                              </Button>
                            )}
                            {period.status === "APPROVED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleLockPeriod(period.id)}
                                title="Lock permanently"
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
              <CardTitle>Calculate Payroll</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {draftPeriods.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  There are no Draft payroll periods ready to calculate. Periods that have already been calculated can be tracked from the "Periods" or "Records" tab.
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select period" />
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
                        "Calculating..."
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Start Calculation
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This will calculate payroll for all active employees in the selected period
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
                <CardTitle>Payroll Records</CardTitle>
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
                  Select a period to view its records
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead>Additions</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Gross</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No records found
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
