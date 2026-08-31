import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatePayslipPdf } from "@/lib/pdf/payslip";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const payslip = await db.payslip.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: true,
          },
        },
        payrollPeriod: true,
        payrollRecord: {
          include: {
            componentsList: true,
          },
        },
      },
    });

    if (!payslip) {
      return NextResponse.json(
        { error: "Payslip not found" },
        { status: 404 }
      );
    }

    const company = await db.company.findFirst({
      where: { employees: { some: { id: payslip.employeeId } } },
    });

    const attendanceSummary = (payslip.payrollRecord.attendanceSummary as any) || {
      totalWorkDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      overtimeDays: 0,
    };

    const components = (payslip.payrollRecord.componentsList || []).map(
      (c) => ({
        type: c.type,
        name: c.name,
        amount: Number(c.amount),
      })
    );

    const pdfBuffer = await generatePayslipPdf({
      company: {
        name: company?.name || "EUNOIA",
        nameAr: company?.nameAr || undefined,
        address: company?.address || undefined,
        phone: company?.phone || undefined,
      },
      employee: {
        firstName: payslip.employee.firstName,
        lastName: payslip.employee.lastName,
        employeeCode: payslip.employee.employeeCode || undefined,
        jobTitle: payslip.employee.jobTitle || undefined,
        department: payslip.employee.department?.name || undefined,
      },
      period: {
        name: payslip.payrollPeriod.name,
        startDate: payslip.payrollPeriod.startDate.toISOString(),
        endDate: payslip.payrollPeriod.endDate.toISOString(),
      },
      payroll: {
        baseSalary: Number(payslip.payrollRecord.baseSalary),
        totalAdditions: Number(payslip.payrollRecord.totalAdditions),
        totalDeductions: Number(payslip.payrollRecord.totalDeductions),
        attendanceDeductions: Number(
          payslip.payrollRecord.attendanceDeductions
        ),
        overtime: Number(payslip.payrollRecord.overtime),
        gross: Number(payslip.payrollRecord.gross),
        net: Number(payslip.payrollRecord.net),
        components,
        attendanceSummary,
      },
      payslipNumber: payslip.payslipNumber,
      generatedAt: payslip.generatedAt.toISOString(),
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${payslip.payslipNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("GET /api/payslips/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
