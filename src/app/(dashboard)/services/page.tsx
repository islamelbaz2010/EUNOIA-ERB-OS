"use client";

import * as React from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Service {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  defaultPrice: number;
  unit: string;
  taxEnabled: boolean;
  isActive: boolean;
}

export default function ServicesPage() {
  const [services, setServices] = React.useState<Service[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [showDialog, setShowDialog] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    nameAr: "",
    description: "",
    defaultPrice: 0,
    unit: "unit",
    taxEnabled: false,
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    setLoading(true);
    try {
      const res = await fetch("/api/services");
      if (res.ok) {
        const data = await res.json();
        setServices(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);
    } finally {
      setLoading(false);
    }
  }

  function openAddDialog() {
    setEditingId(null);
    setForm({ name: "", nameAr: "", description: "", defaultPrice: 0, unit: "unit", taxEnabled: false });
    setShowDialog(true);
  }

  function openEditDialog(service: Service) {
    setEditingId(service.id);
    setForm({
      name: service.name,
      nameAr: service.nameAr || "",
      description: service.description || "",
      defaultPrice: Number(service.defaultPrice),
      unit: service.unit,
      taxEnabled: service.taxEnabled,
    });
    setShowDialog(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/services/${editingId}` : "/api/services";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: editingId ? "تم التحديث بنجاح" : "تمت الإضافة بنجاح" });
        setShowDialog(false);
        fetchServices();
      } else {
        const data = await res.json();
        toast({ title: "خطأ", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "خطأ", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "تم الحذف بنجاح" });
        fetchServices();
      }
    } catch (error) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  }

  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.nameAr?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الخدمات</h1>
          <p className="text-muted-foreground">إدارة الخدمات المقدمة</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          إضافة خدمة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>قائمة الخدمات</CardTitle>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                <TableHead>الاسم (عربي)</TableHead>
                <TableHead>السعر الافتراضي</TableHead>
                <TableHead>الوحدة</TableHead>
                <TableHead>ضريبة</TableHead>
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
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    لا توجد خدمات
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{service.nameAr || "-"}</TableCell>
                    <TableCell>{formatCurrency(Number(service.defaultPrice))}</TableCell>
                    <TableCell>{service.unit}</TableCell>
                    <TableCell>
                      {service.taxEnabled ? (
                        <Badge variant="success">نعم</Badge>
                      ) : (
                        <Badge variant="secondary">لا</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={service.isActive ? "success" : "destructive"}>
                        {service.isActive ? "نشط" : "غير نشط"}
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
                          <DropdownMenuItem onClick={() => openEditDialog(service)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(service.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "تعديل الخدمة" : "إضافة خدمة جديدة"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم (إنجليزي)</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم (عربي)</Label>
                <Input
                  value={form.nameAr}
                  onChange={(e) => setForm((prev) => ({ ...prev, nameAr: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>السعر الافتراضي</Label>
                <Input
                  type="number"
                  value={form.defaultPrice}
                  onChange={(e) => setForm((prev) => ({ ...prev, defaultPrice: parseFloat(e.target.value) || 0 }))}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>الوحدة</Label>
                <Input
                  value={form.unit}
                  onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.taxEnabled}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, taxEnabled: checked }))}
              />
              <Label>خاضع للضريبة</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
