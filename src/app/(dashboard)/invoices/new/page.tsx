"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Plus,
  Trash2,
  Loader2,
  Save,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Client {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  defaultPrice: number;
}

interface InvoiceItem {
  serviceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("clientId") || "";

  const [clients, setClients] = React.useState<Client[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);
  const [clientId, setClientId] = React.useState(preselectedClientId);
  const [items, setItems] = React.useState<InvoiceItem[]>([
    { serviceId: "", description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [discount, setDiscount] = React.useState(0);
  const [vatEnabled, setVatEnabled] = React.useState(false);
  const [notes, setNotes] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetchClientsAndServices();
  }, []);

  async function fetchClientsAndServices() {
    try {
      const [clientsRes, servicesRes] = await Promise.all([
        fetch("/api/clients?pageSize=100"),
        fetch("/api/services"),
      ]);
      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data.clients || []);
      }
      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServices(Array.isArray(data) ? data : data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { serviceId: "", description: "", quantity: 1, unitPrice: 0 },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof InvoiceItem, value: any) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === "serviceId") {
          const service = services.find((s) => s.id === value);
          if (service) {
            updated.description = service.name;
            updated.unitPrice = Number(service.defaultPrice);
          }
        }
        return updated;
      })
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const vatRate = 15;
  const vatAmount = vatEnabled ? (subtotal - discount) * (vatRate / 100) : 0;
  const total = subtotal - discount + vatAmount;

  async function handleSave(status: "DRAFT" | "SENT") {
    if (!clientId) {
      toast({ title: "خطأ", description: "اختر العميل", variant: "destructive" });
      return;
    }
    if (items.length === 0 || items.every((i) => !i.description)) {
      toast({ title: "خطأ", description: "أضف صفاً واحداً على الأقل", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          items: items.filter((i) => i.description),
          discount,
          vatEnabled,
          notes,
          dueDate: dueDate || undefined,
          status,
        }),
      });
      if (res.ok) {
        toast({ title: status === "DRAFT" ? "تم الحفظ كمسودة" : "تم الإرسال بنجاح" });
        router.push("/invoices");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/invoices")}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">إنشاء فاتورة جديدة</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>بيانات الفاتورة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>العميل *</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العميل" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>تاريخ الاستحقاق</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>الأصناف</CardTitle>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                إضافة صنف
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">صنف {index + 1}</span>
                    {items.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">الخدمة</Label>
                      <Select
                        value={item.serviceId}
                        onValueChange={(value) => updateItem(index, "serviceId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر خدمة" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">الوصف</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        placeholder="وصف الصنف"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">الكمية</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                        min="0"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">سعر الوحدة</Label>
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                        min="0"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="text-left font-medium">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ملاحظات</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظات إضافية..."
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>الملخص المالي</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">المجموع الفرعي</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الخصم</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  min="0"
                  dir="ltr"
                  className="h-8"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={vatEnabled} onCheckedChange={setVatEnabled} />
                  <span className="text-sm">ضريبة القيمة المضافة ({vatRate}%)</span>
                </div>
                <span>{formatCurrency(vatAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>الإجمالي</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="space-y-2 pt-4">
                <Button className="w-full" onClick={() => handleSave("DRAFT")} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  حفظ كمسودة
                </Button>
                <Button className="w-full" variant="outline" onClick={() => handleSave("SENT")} disabled={saving}>
                  <Send className="mr-2 h-4 w-4" />
                  إرسال الفاتورة
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
