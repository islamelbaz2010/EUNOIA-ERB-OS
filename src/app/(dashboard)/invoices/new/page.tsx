"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
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
import { useLocale } from "@/hooks/use-locale";

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
  const { t } = useLocale();
  const preselectedClientId = searchParams.get("clientId") || "";

  const [clients, setClients] = React.useState<Client[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);
  const [company, setCompany] = React.useState<any>(null);
  const [clientId, setClientId] = React.useState(preselectedClientId);
  const [items, setItems] = React.useState<InvoiceItem[]>([
    { serviceId: "", description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [invoiceDate, setInvoiceDate] = React.useState("");
  const [markupValue, setMarkupValue] = React.useState(0);
  const [markupIsPercentage, setMarkupIsPercentage] = React.useState(false);
  const [vatEnabled, setVatEnabled] = React.useState(false);
  const [vatRate, setVatRate] = React.useState(15);
  const [notes, setNotes] = React.useState("");
  const [paymentPolicy, setPaymentPolicy] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetchClientsAndServices();
    fetch("/api/admin/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setCompany(data);
          setVatRate(data.vatRate ?? 15);
          setPaymentPolicy(data.paymentPolicy ?? "");
        }
      })
      .catch(() => {});
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
  const markupAmount = markupIsPercentage
    ? (subtotal * markupValue) / 100
    : markupValue;
  const vatAmount = vatEnabled ? (subtotal + markupAmount) * (vatRate / 100) : 0;
  const total = subtotal + markupAmount + vatAmount;

  async function handleSave(status: "DRAFT" | "SENT") {
    if (!clientId) {
      toast({ title: t("common.error"), description: t("invoices.missingClient"), variant: "destructive" });
      return;
    }
    if (items.length === 0 || items.every((i) => !i.description)) {
      toast({ title: t("common.error"), description: t("invoices.missingLineItem"), variant: "destructive" });
      return;
    }
    if (!dueDate) {
      toast({ title: t("common.error"), description: t("invoices.missingDueDate"), variant: "destructive" });
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
          date: invoiceDate || undefined,
          markupIsPercentage,
          markupValue,
          vatEnabled,
          notes,
          paymentPolicy,
          dueDate: dueDate || undefined,
          status,
        }),
      });
      if (res.ok) {
        toast({ title: status === "DRAFT" ? t("invoices.saveDraft") : t("invoices.sendInvoice") });
        router.push("/invoices");
      } else {
        const data = await res.json();
        toast({ title: t("common.error"), description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/invoices")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{t("invoices.create")}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("invoices.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("invoices.client")} *</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("invoices.missingClient")} />
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
                  <Label>{t("invoices.dueDate")} *</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("invoices.date")}</Label>
                  <Input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("invoices.lineItems")}</CardTitle>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="me-2 h-4 w-4" />
                {t("invoices.addItem")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t("invoices.item")} {index + 1}</span>
                    {items.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("common.select")} {t("services.title")}</Label>
                      <Select
                        value={item.serviceId}
                        onValueChange={(value) => updateItem(index, "serviceId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("services.title")} />
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
                      <Label className="text-xs">{t("invoices.description")}</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        placeholder={t("invoices.description")}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("invoices.qty")}</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                        min="0"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("invoices.unitPrice")}</Label>
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                        min="0"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="text-start font-medium">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("invoices.notes")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("invoices.notes")}
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("invoices.paymentPolicy")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={paymentPolicy}
                onChange={(e) => setPaymentPolicy(e.target.value)}
                placeholder={t("admin.paymentPolicy")}
                rows={2}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>{t("invoices.financialSummary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("invoices.subtotal")}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("invoices.markup")}</span>
                  <span>{formatCurrency(markupAmount)}</span>
                </div>
                <div className="flex gap-2">
                  <Select value={markupIsPercentage ? "percentage" : "fixed"} onValueChange={(v) => setMarkupIsPercentage(v === "percentage")}>
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">{t("common.fixed")}</SelectItem>
                      <SelectItem value="percentage">%</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={markupValue}
                    onChange={(e) => setMarkupValue(parseFloat(e.target.value) || 0)}
                    min="0"
                    dir="ltr"
                    className="h-8"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={vatEnabled} onCheckedChange={setVatEnabled} />
                  <span className="text-sm">{t("invoices.vat")} ({vatRate}%)</span>
                </div>
                <span>{formatCurrency(vatAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>{t("invoices.total")}</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="space-y-2 pt-4">
                <Button className="w-full" onClick={() => handleSave("DRAFT")} disabled={saving}>
                  {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
                  {t("invoices.saveDraft")}
                </Button>
                <Button className="w-full" variant="outline" onClick={() => handleSave("SENT")} disabled={saving}>
                  <Send className="me-2 h-4 w-4" />
                  {t("invoices.sendInvoice")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
