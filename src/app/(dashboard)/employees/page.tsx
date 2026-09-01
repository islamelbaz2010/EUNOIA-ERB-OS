"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  UserX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  jobTitle: string;
  employmentStatus: string;
  department?: { name: string } | null;
  branch?: { name: string } | null;
  joinDate: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [pagination, setPagination] = React.useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [addForm, setAddForm] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
  });
  const [adding, setAdding] = React.useState(false);

  React.useEffect(() => {
    fetchEmployees();
  }, [pagination.page, statusFilter, search]);

  async function fetchEmployees() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/employees?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        toast({ title: "تم إضافة الموظف بنجاح" });
        setShowAddDialog(false);
        setAddForm({ firstName: "", lastName: "", email: "", phone: "", jobTitle: "" });
        fetchEmployees();
      } else {
        const data = await res.json();
        toast({ title: "خطأ", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في إضافة الموظف", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  }

  async function handleDeactivate(id: string) {
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employmentStatus: "TERMINATED" }),
      });
      if (res.ok) {
        toast({ title: "تم تعطيل الموظف بنجاح" });
        fetchEmployees();
      }
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في تعطيل الموظف", variant: "destructive" });
    }
  }

  const statusBadge = (status: string) => {
    const variants: Record<string, "default" | "success" | "warning" | "destructive"> = {
      ACTIVE: "success",
      ON_LEAVE: "warning",
      TERMINATED: "destructive",
      SUSPENDED: "destructive",
    };
    const labels: Record<string, string> = {
      ACTIVE: "نشط",
      ON_LEAVE: "في إجازة",
      TERMINATED: "منتهي",
      SUSPENDED: "معلق",
    };
    return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الموظفون</h1>
          <p className="text-muted-foreground">إدارة بيانات الموظفين</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          إضافة موظف
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>قائمة الموظفين</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="pr-9 w-64"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="ACTIVE">نشط</SelectItem>
                  <SelectItem value="ON_LEAVE">في إجازة</SelectItem>
                  <SelectItem value="TERMINATED">منتهي</SelectItem>
                  <SelectItem value="SUSPENDED">معلق</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الكود</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>القسم</TableHead>
                <TableHead>الفرع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    لا توجد بيانات
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-mono text-sm">{emp.employeeCode}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{emp.displayName}</p>
                        <p className="text-xs text-muted-foreground">{emp.jobTitle}</p>
                      </div>
                    </TableCell>
                    <TableCell>{emp.department?.name || "-"}</TableCell>
                    <TableCell>{emp.branch?.name || "-"}</TableCell>
                    <TableCell>{statusBadge(emp.employmentStatus)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/employees/${emp.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              عرض
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/employees/${emp.id}?tab=profile`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              تعديل
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeactivate(emp.id)}
                            className="text-destructive"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            تعطيل
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                إجمالي: {pagination.total} موظف
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة موظف جديد</DialogTitle>
            <DialogDescription>أدخل بيانات الموظف الجديد</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">الاسم الأول</Label>
                <Input
                  id="firstName"
                  value={addForm.firstName}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">اسم العائلة</Label>
                <Input
                  id="lastName"
                  value={addForm.lastName}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm((prev) => ({ ...prev, email: e.target.value }))}
                dir="ltr"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">الهاتف</Label>
                <Input
                  id="phone"
                  value={addForm.phone}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, phone: e.target.value }))}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">المسمى الوظيفي</Label>
                <Input
                  id="jobTitle"
                  value={addForm.jobTitle}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, jobTitle: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={adding}>
                {adding ? "جاري الإضافة..." : "إضافة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
