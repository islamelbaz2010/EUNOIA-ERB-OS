"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  AlertTriangle,
  UserX,
  FileWarning,
  Receipt,
  Clock3,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { useLocale } from "@/hooks/use-locale";
import { tReplace } from "@/lib/i18n";

interface DashboardStats {
  totalEmployees: number;
  todayAttendance: number;
  lateToday: number;
  absentToday: number;
  pendingExceptions: number;
  outstandingInvoices: number;
  overdueInvoices: number;
}

interface Activity {
  id: string;
  type: string;
  amount: number;
  invoiceNumber: string;
  timestamp: string;
}

export default function DashboardPage() {
  const { t, locale } = useLocale();
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalEmployees: data.totalEmployees ?? 0,
          todayAttendance: data.todayAttendance ?? 0,
          lateToday: data.lateToday ?? 0,
          absentToday: data.absentToday ?? 0,
          pendingExceptions: data.pendingExceptions ?? 0,
          outstandingInvoices: data.outstandingInvoices?.count ?? 0,
          overdueInvoices: data.overdueInvoices?.count ?? 0,
        });
        setActivities(data.recentPayments?.map((p: any) => ({
          id: p.id,
          type: "payment",
          amount: Number(p.amount),
          invoiceNumber: p.invoice?.invoiceNumber ?? "",
          timestamp: p.createdAt,
        })) || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      title: t("dashboard.totalEmployees"),
      value: stats?.totalEmployees ?? 0,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      href: "/employees",
    },
    {
      title: t("dashboard.todayAttendance"),
      value: stats?.todayAttendance ?? 0,
      icon: Clock,
      color: "text-success",
      bgColor: "bg-success/10",
      href: "/attendance",
    },
    {
      title: t("dashboard.lateToday"),
      value: stats?.lateToday ?? 0,
      icon: AlertTriangle,
      color: "text-warning",
      bgColor: "bg-warning/10",
      href: "/attendance?status=LATE",
    },
    {
      title: t("dashboard.absentToday"),
      value: stats?.absentToday ?? 0,
      icon: UserX,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      href: "/attendance?status=ABSENT",
    },
    {
      title: t("dashboard.pendingExceptions"),
      value: stats?.pendingExceptions ?? 0,
      icon: FileWarning,
      color: "text-warning",
      bgColor: "bg-warning/10",
      href: "/attendance?tab=exceptions&status=PENDING",
    },
    {
      title: t("dashboard.outstandingInvoices"),
      value: stats?.outstandingInvoices ?? 0,
      icon: Receipt,
      color: "text-primary",
      bgColor: "bg-primary/10",
      href: "/invoices?status=OUTSTANDING",
    },
    {
      title: t("dashboard.overdueInvoices"),
      value: stats?.overdueInvoices ?? 0,
      icon: Clock3,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      href: "/invoices?status=OVERDUE",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">{t("dashboard.welcome")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 7 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            ))
          : statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.title} href={card.href} className="block">
                <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{card.title}</p>
                        <p className="text-2xl font-bold">{formatNumber(card.value, locale)}</p>
                      </div>
                      <div className={`rounded-lg p-2 ${card.bgColor}`}>
                        <Icon className={`h-5 w-5 ${card.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              );
            })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t("dashboard.recentActivity")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">{t("dashboard.noRecentActivity")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 rounded-lg border p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      {tReplace("dashboard.paymentMessage", {
                        amount: formatCurrency(activity.amount, "EGP", locale),
                        invoiceNumber: activity.invoiceNumber,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(activity.timestamp, locale)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {t("dashboard.payment")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
