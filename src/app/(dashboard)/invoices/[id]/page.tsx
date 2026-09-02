"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useLocale } from "@/hooks/use-locale";

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  subtotal: number;
  markupAmount: number;
  discount: number;
  vatEnabled: boolean;
  vatRate: number;
  vatAmount: number;
  total: number;
  status: string;
  notes?: string;
  paymentPolicy?: string;
  client: { id: string; name: string; nameAr?: string; email?: string; phone?: string; address?: string };
  items: { id: string; description: string; quantity: number; unitPrice: number; total: number }[];
  payments: { id: string; amount: number; paymentDate: string; method: string; reference?: string }[];
}

export default function InvoiceDetailPage() {
  const { t, locale } = useLocale();
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = React.useState<Invoice | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = React.useState(false);
  const [paymentForm, setPaymentForm] = React.useState({
    amount: 0,
    method: "BANK_TRANSFER",
    reference: "",
    notes: "",
  });
  const [recording, setRecording] = React.useState(false);

  React.useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  async function fetchInvoice() {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
        setPaymentForm((prev) => ({
          ...prev,
          amount: Number(data.total) - data.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0),
        }));
      }
    } catch (error) {
      console.error("Failed to fetch invoice:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRecordPayment() {
    setRecording(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...paymentForm, invoiceId }),
      });
      if (res.ok) {
        toast({ title: t("invoices.paymentRecorded") });
        setShowPaymentDialog(false);
        fetchInvoice();
      } else {
        toast({ title: t("common.error"), variant: "destructive" });
      }
    } catch (error) {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setRecording(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">{t("common.noRecords")}</p>
      </div>
    );
  }

  const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Number(invoice.total) - paid;

  const statusBadge = (status: string) => {
    const map: Record<string, "default" | "success" | "warning" | "destructive"> = {
      DRAFT: "default",
      SENT: "default",
      PAID: "success",
      PARTIALLY_PAID: "warning",
      OVERDUE: "destructive",
      CANCELLED: "destructive",
      VIEWED: "default",
    };
    return <Badge variant={map[status] || "default"}>{t(`status.invoice.${status}`) || status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/invoices")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
              {statusBadge(invoice.status)}
            </div>
            <p className="text-muted-foreground">{invoice.client.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(`/api/invoices/${invoiceId}/pdf?locale=${locale}`, "_blank")}>
            <Download className="me-2 h-4 w-4" />
            {t("invoices.downloadPdf")}
          </Button>
          {remaining > 0 && (
            <Button onClick={() => setShowPaymentDialog(true)}>
              <CreditCard className="me-2 h-4 w-4" />
              {t("invoices.recordPayment")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("invoices.lineItems")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("invoices.description")}</TableHead>
                    <TableHead className="text-center">{t("invoices.qty")}</TableHead>
                    <TableHead className="text-start">{t("invoices.unitPrice")}</TableHead>
                    <TableHead className="text-start">{t("invoices.amount")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-start">{formatCurrency(Number(item.unitPrice))}</TableCell>
                      <TableCell className="text-start">{formatCurrency(Number(item.total))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {invoice.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("invoices.paid")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.date")}</TableHead>
                      <TableHead>{t("common.amount")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead>{t("common.reference")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                        <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                        <TableCell><Badge variant="outline">{t(`status.paymentMethod.${payment.method}`) || payment.method}</Badge></TableCell>
                        <TableCell>{payment.reference || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("invoices.financialSummary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("invoices.subtotal")}</span>
                <span>{formatCurrency(Number(invoice.subtotal))}</span>
              </div>
              {Number(invoice.markupAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("invoices.markup")}</span>
                  <span>{formatCurrency(Number(invoice.markupAmount))}</span>
                </div>
              )}
              {Number(invoice.discount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("invoices.discount")}</span>
                  <span>-{formatCurrency(Number(invoice.discount))}</span>
                </div>
              )}
              {invoice.vatEnabled && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("invoices.vat")} ({invoice.vatRate}%)</span>
                  <span>{formatCurrency(Number(invoice.vatAmount))}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>{t("invoices.total")}</span>
                <span>{formatCurrency(Number(invoice.total))}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-success">
                <span>{t("invoices.paid")}</span>
                <span>{formatCurrency(paid)}</span>
              </div>
              <div className="flex justify-between text-destructive font-medium">
                <span>{t("invoices.outstanding")}</span>
                <span>{formatCurrency(remaining)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("invoices.client")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{invoice.client.name}</p>
              {invoice.client.email && <p className="text-muted-foreground">{invoice.client.email}</p>}
              {invoice.client.phone && <p className="text-muted-foreground" dir="ltr">{invoice.client.phone}</p>}
              {invoice.client.address && <p className="text-muted-foreground">{invoice.client.address}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("invoices.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("invoices.issueDate")}</span>
                <span>{formatDate(invoice.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("invoices.dueDate")}</span>
                <span>{formatDate(invoice.dueDate)}</span>
              </div>
              {invoice.paymentPolicy && (
                <div className="pt-2">
                  <p className="text-muted-foreground mb-1">{t("invoices.paymentPolicy")}</p>
                  <p className="whitespace-pre-wrap">{invoice.paymentPolicy}</p>
                </div>
              )}
              {invoice.notes && (
                <div className="pt-2">
                  <p className="text-muted-foreground mb-1">{t("invoices.notes")}</p>
                  <p className="whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("invoices.recordPayment")}</DialogTitle>
            <DialogDescription>{t("invoices.outstanding")}: {formatCurrency(remaining)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("common.amount")}</Label>
              <Input
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("common.status")}</Label>
              <Select value={paymentForm.method} onValueChange={(value) => setPaymentForm((prev) => ({ ...prev, method: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">{t("status.paymentMethod.CASH")}</SelectItem>
                  <SelectItem value="BANK_TRANSFER">{t("status.paymentMethod.BANK_TRANSFER")}</SelectItem>
                  <SelectItem value="CHECK">{t("status.paymentMethod.CHECK")}</SelectItem>
                  <SelectItem value="CREDIT_CARD">{t("status.paymentMethod.CREDIT_CARD")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("common.reference")}</Label>
              <Input
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, reference: e.target.value }))}
                placeholder="Transfer / check number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleRecordPayment} disabled={recording}>
              {recording ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
              {t("invoices.recordPayment")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
