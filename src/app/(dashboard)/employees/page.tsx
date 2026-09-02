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
  Trash2,
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
import { useLocale } from "@/hooks/use-locale";

interface Branch {
  id: string;
  name: string;
  nameAr?: string;
}

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
  department?: { name: string; nameAr?: string | null } | null;
  branch?: { name: string; nameAr?: string | null } | null;
  joinDate: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function EmployeesPage() {
  const { t, isRTL } = useLocale();
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
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [addForm, setAddForm] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
    branchId: "",
  });
  const [adding, setAdding] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Employee | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    fetchEmployees();
  }, [pagination.page, statusFilter, search]);

  React.useEffect(() => {
    fetch("/api/admin/branches")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setBranches(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

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
        body: JSON.stringify({
          ...addForm,
          branchId: addForm.branchId || undefined,
          email: addForm.email || undefined,
          displayName: `${addForm.firstName} ${addForm.lastName}`.trim(),
          joinDate: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        toast({ title: t("employees.added") });
        setShowAddDialog(false);
        setAddForm({ firstName: "", lastName: "", email: "", phone: "", jobTitle: "", branchId: "" });
        fetchEmployees();
      } else {
        const data = await res.json();
        toast({ title: t("common.error"), description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: t("common.error"), description: t("employees.added"), variant: "destructive" });
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
        toast({ title: t("employees.deactivated") });
        fetchEmployees();
      }
    } catch (error) {
      toast({ title: t("common.error"), description: t("employees.deactivated"), variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast({ title: t("common.success"), description: data.message });
        setDeleteTarget(null);
        fetchEmployees();
      } else {
        toast({ title: t("common.error"), description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  const statusBadge = (status: string) => {
    const variants: Record<string, "default" | "success" | "warning" | "destructive"> = {
      ACTIVE: "success",
      ON_LEAVE: "warning",
      TERMINATED: "destructive",
      SUSPENDED: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{t(`status.employee.${status}`) || status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("employees.title")}</h1>
          <p className="text-muted-foreground">{t("employees.subtitle")}</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="me-2 h-4 w-4" />
          {t("employees.add")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>{t("employees.list")}</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${isRTL ? "left-3" : "right-3"}`} />
                <Input
                  placeholder={t("common.search")}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={`${isRTL ? "pl-9" : "pr-9"} w-64`}
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
                  <SelectValue placeholder={t("common.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="ACTIVE">{t("status.employee.ACTIVE")}</SelectItem>
                  <SelectItem value="ON_LEAVE">{t("status.employee.ON_LEAVE")}</SelectItem>
                  <SelectItem value="TERMINATED">{t("status.employee.TERMINATED")}</SelectItem>
                  <SelectItem value="SUSPENDED">{t("status.employee.SUSPENDED")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("employees.code")}</TableHead>
                <TableHead>{t("employees.name")}</TableHead>
                <TableHead>{t("employees.department")}</TableHead>
                <TableHead>{t("employees.branch")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead className="text-start">{t("common.actions")}</TableHead>
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
                    {t("employees.noEmployees")}
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
                    <TableCell>{emp.department?.name || emp.department?.nameAr || "—"}</TableCell>
                    <TableCell>{emp.branch?.name || emp.branch?.nameAr || "—"}</TableCell>
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
                            <Link href={`/employees/${emp.id}`} className="flex items-center">
                              <Eye className="me-2 h-4 w-4" />
                              {t("common.view")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/employees/${emp.id}?tab=profile`} className="flex items-center">
                              <Pencil className="me-2 h-4 w-4" />
                              {t("common.edit")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeactivate(emp.id)}>
                            <UserX className="me-2 h-4 w-4" />
                            {t("employees.deactivate")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(emp)} className="text-destructive focus:text-destructive">
                            <Trash2 className="me-2 h-4 w-4" />
                            {t("employees.delete")}
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
                {t("common.total")}: {pagination.total} {t("employees.title").toLowerCase()}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                >
                  <ChevronLeft className="h-4 w-4" />
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
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("employees.add")}</DialogTitle>
            <DialogDescription>{t("employees.subtitle")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("common.firstName")}</Label>
                <Input
                  id="firstName"
                  value={addForm.firstName}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t("common.lastName")}</Label>
                <Input
                  id="lastName"
                  value={addForm.lastName}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
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
                <Label htmlFor="phone">{t("common.phone")}</Label>
                <Input
                  id="phone"
                  value={addForm.phone}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, phone: e.target.value }))}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">{t("common.jobTitle")}</Label>
                <Input
                  id="jobTitle"
                  value={addForm.jobTitle}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, jobTitle: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branchId">{t("employees.branch")}</Label>
              <Select
                value={addForm.branchId}
                onValueChange={(value) => setAddForm((prev) => ({ ...prev, branchId: value }))}
              >
                <SelectTrigger id="branchId">
                  <SelectValue placeholder={t("common.select")} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name || b.nameAr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={adding}>
                {adding ? t("common.loading") : t("common.add")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("employees.delete")}</DialogTitle>
            <DialogDescription>{t("employees.deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
            >
              {deleting ? t("common.loading") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
