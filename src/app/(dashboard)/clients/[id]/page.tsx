"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  Save,
  Receipt,
  CreditCard,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EGYPT_GOVERNORATES = [
  "القاهرة", "الإسكندرية", "الإسماعيلية", "الجيزة", "قليوبية",
  "البحيرة", "الدقهلية", "الشرقية", "كفر الشيخ", "الغربية",
  "المنوفية", "الفيوم", "بني سويف", "المنيا", "أسيوط",
  "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر",
  "الوادي الجديد", "مطروح", "شمال سيناء", "جنوب سيناء", "بورسعيد", " السويس",
];

interface Client {
  id: string;
  name: string;
  nameAr?: string;
  contactPerson?: string;
  contactPersonAr?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  taxNumber?: string;
  vatNumber?: string;
  paymentTerms: number;
  notes?: string;
  status: string;
  invoices: Invoice[];
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  total: number;
  status: string;
  payments: Payment[];
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  method: string;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = React.useState<Client | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<Record<string, any>>({});

  React.useEffect(() => {
    fetchClient();
  }, [clientId]);

  async function fetchClient() {
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setClient(data);
        setForm(data);
      }
    } catch (error) {
      console.error("Failed to fetch client:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name: form.name || undefined,
        nameAr: form.nameAr || undefined,
        contactPerson: form.contactPerson || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        country: form.country || undefined,
        taxNumber: form.taxNumber || undefined,
        paymentTerms: form.paymentTerms || undefined,
        notes: form.notes || undefined,
      };
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({ title: "تم الحفظ بنجاح" });
        fetchClient();
      } else {
        const error = await res.json().catch(() => ({}));
        toast({ title: "خطأ", description: error.error || "فشل في حفظ البيانات", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في حفظ البيانات", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">لم يتم العثور على العميل</p>
      </div>
    );
  }

  const invoiceStatusBadge = (status: string) => {
    const map: Record<string, "default" | "success" | "warning" | "destructive"> = {
      DRAFT: "default",
      SENT: "default",
      PAID: "success",
      PARTIALLY_PAID: "warning",
      OVERDUE: "destructive",
    };
    return <Badge variant={map[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/clients")}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">{client.nameAr || client.email || ""}</p>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">
            <User className="mr-2 h-4 w-4" />
            المعلومات
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <Receipt className="mr-2 h-4 w-4" />
            الفواتير ({client.invoices.length})
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="mr-2 h-4 w-4" />
            المدفوعات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>بيانات العميل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>الاسم (إنجليزي)</Label>
                  <Input
                    value={form.name || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الاسم (عربي)</Label>
                  <Input
                    value={form.nameAr || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, nameAr: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>جهة الاتصال</Label>
                  <Input
                    value={form.contactPerson || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, contactPerson: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الهاتف</Label>
                  <Input
                    value={form.phone || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    value={form.email || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>المدينة</Label>
                  <Input
                    value={form.city || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>البلد</Label>
                  <Input
                    value={form.country || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>المحافظة</Label>
                  <Select
                    value={form.governorate || ""}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, governorate: value, city: value }))}
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
                  <Label>الرقم الضريبي</Label>
                  <Input
                    value={form.taxNumber || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, taxNumber: e.target.value }))}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>شروط الدفع (أيام)</Label>
                  <Input
                    type="number"
                    value={form.paymentTerms || 30}
                    onChange={(e) => setForm((prev) => ({ ...prev, paymentTerms: parseInt(e.target.value) }))}
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>العنوان</Label>
                <Input
                  value={form.address || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  حفظ
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>الفواتير</CardTitle>
              <Button asChild size="sm">
                <a href={`/invoices/new?clientId=${client.id}`}>إضافة فاتورة</a>
              </Button>
            </CardHeader>
            <CardContent>
              {client.invoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد فواتير</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الاستحقاق</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>المدفوع</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.invoices.map((inv) => {
                      const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
                      return (
                        <TableRow key={inv.id}>
                          <TableCell>
                            <a href={`/invoices/${inv.id}`} className="text-primary hover:underline">
                              {inv.invoiceNumber}
                            </a>
                          </TableCell>
                          <TableCell>{formatDate(inv.date)}</TableCell>
                          <TableCell>{formatDate(inv.dueDate)}</TableCell>
                          <TableCell>{formatCurrency(Number(inv.total))}</TableCell>
                          <TableCell>{formatCurrency(paid)}</TableCell>
                          <TableCell>{invoiceStatusBadge(inv.status)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>سجل المدفوعات</CardTitle>
            </CardHeader>
            <CardContent>
              {client.invoices.flatMap((inv) => inv.payments).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد مدفوعات</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الفاتورة</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الطريقة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.invoices.flatMap((inv) =>
                      inv.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{inv.invoiceNumber}</TableCell>
                          <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                          <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                          <TableCell><Badge variant="outline">{payment.method}</Badge></TableCell>
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
