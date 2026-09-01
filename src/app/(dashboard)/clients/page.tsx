"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { EGYPT_GOVERNORATES, DEFAULT_COUNTRY } from "@/lib/constants";

interface Client {
  id: string;
  name: string;
  nameAr?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  city?: string;
  status: string;
  _count?: { invoices: number };
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function ClientsPage() {
  const [clients, setClients] = React.useState<Client[]>([]);
  const [pagination, setPagination] = React.useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [addForm, setAddForm] = React.useState({
    name: "",
    nameAr: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    country: DEFAULT_COUNTRY,
    governorate: "",
    taxNumber: "",
  });
  const [adding, setAdding] = React.useState(false);

  React.useEffect(() => {
    fetchClients();
  }, [pagination.page, search]);

  async function fetchClients() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/clients?${params}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        toast({ title: "تم إضافة العميل بنجاح" });
        setShowAddDialog(false);
        setAddForm({ name: "", nameAr: "", contactPerson: "", phone: "", email: "", address: "", city: "", country: DEFAULT_COUNTRY, governorate: "", taxNumber: "" });
        fetchClients();
      } else {
        const data = await res.json();
        toast({ title: "خطأ", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "خطأ", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">العملاء</h1>
          <p className="text-muted-foreground">إدارة بيانات العملاء</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          إضافة عميل
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>قائمة العملاء</CardTitle>
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
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>جهة الاتصال</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>المدينة</TableHead>
                <TableHead>الفواتير</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
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
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    لا توجد بيانات
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        {client.nameAr && (
                          <p className="text-xs text-muted-foreground">{client.nameAr}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{client.contactPerson || "-"}</TableCell>
                    <TableCell dir="ltr">{client.phone || "-"}</TableCell>
                    <TableCell>{client.city || "-"}</TableCell>
                    <TableCell>{client._count?.invoices || 0}</TableCell>
                    <TableCell>
                      <Badge variant={client.status === "ACTIVE" ? "success" : "default"}>
                        {client.status === "ACTIVE" ? "نشط" : client.status === "BLOCKED" ? "محظور" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/clients/${client.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              عرض
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/clients/${client.id}?tab=info`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              تعديل
                            </Link>
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
                إجمالي: {pagination.total} عميل
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>إضافة عميل جديد</DialogTitle>
            <DialogDescription>أدخل بيانات العميل</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddClient} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم (إنجليزي)</Label>
                <Input
                  value={addForm.name}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم (عربي)</Label>
                <Input
                  value={addForm.nameAr}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, nameAr: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>جهة الاتصال</Label>
                <Input
                  value={addForm.contactPerson}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, contactPerson: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>الهاتف</Label>
                <Input
                  value={addForm.phone}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, phone: e.target.value }))}
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm((prev) => ({ ...prev, email: e.target.value }))}
                dir="ltr"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المحافظة</Label>
                <Select
                  value={addForm.governorate}
                  onValueChange={(value) => setAddForm((prev) => ({ ...prev, governorate: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المحافظة" />
                  </SelectTrigger>
                  <SelectContent>
                    {EGYPT_GOVERNORATES.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المدينة</Label>
                <Input
                  value={addForm.city}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, city: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الرقم الضريبي</Label>
              <Input
                value={addForm.taxNumber}
                onChange={(e) => setAddForm((prev) => ({ ...prev, taxNumber: e.target.value }))}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input
                value={addForm.address}
                onChange={(e) => setAddForm((prev) => ({ ...prev, address: e.target.value }))}
              />
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
