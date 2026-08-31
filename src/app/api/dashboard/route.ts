import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalEmployees,
      activeEmployees,
      todayAttendance,
      lateToday,
      absentToday,
      pendingExceptions,
      currentPayrollPeriod,
      outstandingInvoices,
      overdueInvoices,
      recentPayments,
      upcomingPayments,
    ] = await Promise.all([
      db.employee.count({ where: { companyId } }),
      db.employee.count({ where: { companyId, employmentStatus: "ACTIVE" } }),
      db.attendanceDay.count({
        where: {
          employee: { companyId },
          date: { gte: today, lt: tomorrow },
        },
      }),
      db.attendanceDay.count({
        where: {
          employee: { companyId },
          date: { gte: today, lt: tomorrow },
          lateMinutes: { gt: 0 },
        },
      }),
      db.attendanceDay.count({
        where: {
          employee: { companyId },
          date: { gte: today, lt: tomorrow },
          status: "ABSENT",
        },
      }),
      db.attendanceException.count({
        where: {
          employee: { companyId },
          status: "PENDING",
        },
      }),
      db.payrollPeriod.findFirst({
        where: { companyId },
        orderBy: { startDate: "desc" },
        select: { id: true, name: true, status: true, startDate: true, endDate: true },
      }),
      db.invoice.aggregate({
        where: {
          companyId,
          status: { in: ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"] },
        },
        _sum: { total: true },
        _count: true,
      }),
      db.invoice.aggregate({
        where: {
          companyId,
          status: "OVERDUE",
        },
        _sum: { total: true },
        _count: true,
      }),
      db.payment.findMany({
        where: { invoice: { companyId } },
        include: { invoice: { select: { invoiceNumber: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.paymentInstallment.findMany({
        where: {
          paymentSchedule: { invoice: { companyId } },
          status: "PENDING",
        },
        include: { paymentSchedule: { include: { invoice: { select: { invoiceNumber: true } } } } },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      totalEmployees,
      activeEmployees,
      todayAttendance,
      lateToday,
      absentToday,
      pendingExceptions,
      currentPayrollPeriod,
      outstandingInvoices: {
        count: outstandingInvoices._count,
        total: Number(outstandingInvoices._sum.total || 0),
      },
      overdueInvoices: {
        count: overdueInvoices._count,
        total: Number(overdueInvoices._sum.total || 0),
      },
      recentPayments,
      upcomingPayments,
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
