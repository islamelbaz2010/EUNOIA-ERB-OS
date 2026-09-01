"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Upload,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { IMPORT_STATUS_LABELS, APPROVAL_STATUS_LABELS, EXCEPTION_TYPE_LABELS } from "@/lib/constants";

interface AttendanceRecord {
  id: string;
  employee: { displayName: string; employeeCode: string };
  date: string;
  firstIn: string;
  lastOut: string;
  workMinutes: number;
  lateMinutes: number;
  status: string;
}

interface ImportRecord {
  id: string;
  fileName: string;
  status: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  createdAt: string;
}

interface Exception {
  id: string;
  employee: { displayName: string };
  date: string;
  type: string;
  reason: string;
  status: string;
}

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "exceptions" ? "exceptions" : "records";
  const queryStatus = searchParams.get("status") || "all";
  const initialRecordStatus = initialTab === "records" ? queryStatus : "all";
  const initialExceptionStatus = initialTab === "exceptions" ? queryStatus : "all";

  const [records, setRecords] = React.useState<AttendanceRecord[]>([]);
  const [imports, setImports] = React.useState<ImportRecord[]>([]);
  const [exceptions, setExceptions] = React.useState<Exception[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState(initialRecordStatus);
  const [exceptionStatus, setExceptionStatus] = React.useState(initialExceptionStatus);

  React.useEffect(() => {
    fetchAttendanceData();
  }, [dateFrom, dateTo, statusFilter, exceptionStatus]);

  async function fetchAttendanceData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const [recordsRes, importsRes, exceptionsRes] = await Promise.all([
        fetch(`/api/attendance/records?${params}`),
        fetch("/api/attendance/import"),
        fetch(`/api/attendance/exceptions?status=${exceptionStatus}`),
      ]);

      if (recordsRes.ok) {
        const data = await recordsRes.json();
        setRecords(data.records || []);
      }
      if (importsRes.ok) {
        const data = await importsRes.json();
        setImports(data.imports || []);
      }
      if (exceptionsRes.ok) {
        const data = await exceptionsRes.json();
        setExceptions(data.exceptions || []);
      }
    } catch (error) {
      console.error("Failed to fetch attendance data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/attendance/import", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: "File uploaded successfully", description: `${data.validRows} valid rows out of ${data.totalRows}` });
        fetchAttendanceData();
      } else {
        toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
    }
  }

  async function handleMatch(importId: string) {
    try {
      const res = await fetch("/api/attendance/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.matched > 0) {
          toast({ title: "Matching completed", description: `${data.matched} matched, ${data.unmatched} unmatched` });
        } else {
          toast({
            title: "No records matched",
            description: `0 of ${data.totalProcessed} rows matched. Check that employees have a fingerprint ID, code, or name matching the import file.`,
            variant: "destructive",
          });
        }
        fetchAttendanceData();
      } else {
        toast({ title: "Error", description: "Matching failed", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Matching failed", variant: "destructive" });
    }
  }

  async function handleExceptionAction(id: string, action: "APPROVED" | "REJECTED") {
    try {
      const res = await fetch(`/api/attendance/exceptions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      if (res.ok) {
        toast({ title: action === "APPROVED" ? "Approved" : "Rejected" });
        fetchAttendanceData();
      }
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "success" | "destructive" | "warning" | "default"; label: string }> = {
      PRESENT: { variant: "success", label: "Present" },
      ABSENT: { variant: "destructive", label: "Absent" },
      LATE: { variant: "warning", label: "Late" },
      LEAVE: { variant: "default", label: "Leave" },
      HOLIDAY: { variant: "default", label: "Holiday" },
    };
    const item = map[status] || { variant: "default" as const, label: status };
    return <Badge variant={item.variant}>{item.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-muted-foreground">Manage attendance records and exceptions</p>
      </div>

      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="records">
            <Clock className="mr-2 h-4 w-4" />
            Records
          </TabsTrigger>
          <TabsTrigger value="import">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </TabsTrigger>
          <TabsTrigger value="exceptions">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Exceptions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Attendance Records</CardTitle>
                <div className="flex flex-col gap-2 sm:flex-row">
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
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="PRESENT">Present</SelectItem>
                      <SelectItem value="ABSENT">Absent</SelectItem>
                      <SelectItem value="LATE">Late</SelectItem>
                      <SelectItem value="LEAVE">Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time In</TableHead>
                    <TableHead>Time Out</TableHead>
                    <TableHead>Hours Worked</TableHead>
                    <TableHead>Late</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No attendance records found
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
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell>{record.firstIn ? new Date(record.firstIn).toLocaleTimeString("en-US") : "-"}</TableCell>
                        <TableCell>{record.lastOut ? new Date(record.lastOut).toLocaleTimeString("en-US") : "-"}</TableCell>
                        <TableCell>{Math.round(record.workMinutes / 60 * 10) / 10}h</TableCell>
                        <TableCell>{record.lateMinutes > 0 ? `${record.lateMinutes} min` : "-"}</TableCell>
                        <TableCell>{statusBadge(record.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Attendance Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border-2 border-dashed p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">
                  Drag an Excel file here or click to browse
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </label>
                </Button>
              </div>

              <div>
                <h3 className="font-medium mb-3">Import History</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total Rows</TableHead>
                      <TableHead>Valid</TableHead>
                      <TableHead>Invalid</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-left">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {imports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No import records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      imports.map((imp) => (
                        <TableRow key={imp.id}>
                          <TableCell className="font-medium">{imp.fileName}</TableCell>
                          <TableCell>
                            <Badge variant={imp.status === "COMPLETED" ? "success" : imp.status === "FAILED" ? "destructive" : "default"}>
                              {IMPORT_STATUS_LABELS[imp.status] || imp.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{imp.totalRows}</TableCell>
                          <TableCell>{imp.validRows}</TableCell>
                          <TableCell>{imp.invalidRows}</TableCell>
                          <TableCell>{formatDate(imp.createdAt)}</TableCell>
                          <TableCell>
                            {imp.status === "COMPLETED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMatch(imp.id)}
                              >
                                Match
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exceptions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Exceptions</CardTitle>
                <Select value={exceptionStatus} onValueChange={setExceptionStatus}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-left">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exceptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No exceptions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    exceptions.map((exc) => (
                      <TableRow key={exc.id}>
                        <TableCell>{exc.employee.displayName}</TableCell>
                        <TableCell>{formatDate(exc.date)}</TableCell>
                        <TableCell><Badge variant="outline">{EXCEPTION_TYPE_LABELS[exc.type] || exc.type}</Badge></TableCell>
                        <TableCell className="max-w-[200px] truncate">{exc.reason}</TableCell>
                        <TableCell>
                          <Badge variant={exc.status === "APPROVED" ? "success" : exc.status === "REJECTED" ? "destructive" : "warning"}>
                            {APPROVAL_STATUS_LABELS[exc.status] || exc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {exc.status === "PENDING" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExceptionAction(exc.id, "APPROVED")}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExceptionAction(exc.id, "REJECTED")}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
