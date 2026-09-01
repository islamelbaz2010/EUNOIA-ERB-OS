import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as XLSX from "xlsx";
import { requireRole } from "@/lib/authorization";

function parseExcelDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  if (typeof value === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;

    const match = trimmed.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i
    );
    if (match) {
      const [, day, month, year, hours, minutes, ampm] = match;
      let h = parseInt(hours, 10);
      if (ampm) {
        if (ampm.toUpperCase() === "PM" && h < 12) h += 12;
        if (ampm.toUpperCase() === "AM" && h === 12) h = 0;
      }
      const date = new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
        h,
        parseInt(minutes, 10)
      );
      return isNaN(date.getTime()) ? null : date;
    }
  }

  return null;
}

const EMPLOYEE_ID_ALIASES = [
  "Employee ID", "employeeId", "ID", "id",
  "رقم الموظف", "empNo", "EMP NO", "employee_code", "Employee Code",
  "ÑÞã ÇáÈÕãå",
];
const PUNCH_TIME_ALIASES = [
  "Punch Time", "punchTime", "Time", "time",
  "التاريخ", "Date", "date", "Clock Time",
  "ÇáãíÚÇÏ",
];
const EMPLOYEE_NAME_ALIASES = [
  "الاسم", "Name", "name", "Employee Name", "employeeName",
  "الاسмя", "English Name", "ENGLISH NAME",
  "ÇáÅÓã",
];
const DEVICE_ID_ALIASES = [
  "Device ID", "deviceId", "Device",
];

function findColumn(row: Record<string, any>, aliases: string[]): string {
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== null && row[alias] !== "") {
      return alias;
    }
  }
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const found = keys.find(
      (k) =>
        k.toLowerCase().includes(alias.toLowerCase()) ||
        alias.toLowerCase().includes(k.toLowerCase())
    );
    if (found && row[found] !== undefined && row[found] !== null && row[found] !== "") {
      return found;
    }
  }
  return "";
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(["ADMIN", "HR"]);
    if (authResult.error) return authResult.error;
    const session = authResult.session;

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xls", "xlsx", "csv"].includes(ext || "")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an Excel (.xls, .xlsx) or CSV file." },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

    if (jsonData.length === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    const firstRow = jsonData[0];
    const empIdCol = findColumn(firstRow, EMPLOYEE_ID_ALIASES);
    const punchTimeCol = findColumn(firstRow, PUNCH_TIME_ALIASES);
    const empNameCol = findColumn(firstRow, EMPLOYEE_NAME_ALIASES);
    const deviceIdCol = findColumn(firstRow, DEVICE_ID_ALIASES);

    if (!empIdCol && !empNameCol) {
      return NextResponse.json(
        {
          error: "Could not detect employee identifier column. Expected: Employee ID, رقم الموظف, or الاسم",
          detectedColumns: Object.keys(firstRow),
        },
        { status: 400 }
      );
    }

    if (!punchTimeCol) {
      return NextResponse.json(
        {
          error: "Could not detect punch time column. Expected: Punch Time, Time, or التاريخ",
          detectedColumns: Object.keys(firstRow),
        },
        { status: 400 }
      );
    }

    const importRecord = await db.attendanceImport.create({
      data: {
        companyId,
        importedById: (session.user as any).id,
        fileName: `${Date.now()}-${file.name}`,
        originalFileName: file.name,
        totalRows: jsonData.length,
        status: "PROCESSING",
      },
    });

    let validRows = 0;
    let invalidRows = 0;
    const rawRecords: any[] = [];

    for (const row of jsonData) {
      const employeeIdentifier =
        (empIdCol ? String(row[empIdCol] || "").trim() : "") ||
        (empNameCol ? String(row[empNameCol] || "").trim() : "");

      const punchTimeRaw = punchTimeCol ? row[punchTimeCol] : null;
      const rawDeviceId = deviceIdCol ? row[deviceIdCol] : null;
      const employeeName = empNameCol ? String(row[empNameCol] || "").trim() : "";

      if (!employeeIdentifier || !punchTimeRaw) {
        invalidRows++;
        continue;
      }

      const punchTime = parseExcelDate(punchTimeRaw);
      if (!punchTime) {
        invalidRows++;
        continue;
      }

      rawRecords.push({
        attendanceImportId: importRecord.id,
        employeeIdentifier,
        punchTime,
        rawDeviceId: rawDeviceId ? String(rawDeviceId) : null,
        rawRow: { ...row, _employeeName: employeeName },
        matchStatus: "UNMATCHED",
      });
      validRows++;
    }

    if (rawRecords.length > 0) {
      await db.attendanceRawRecord.createMany({ data: rawRecords });
    }

    await db.attendanceImport.update({
      where: { id: importRecord.id },
      data: {
        validRows,
        invalidRows,
        unmatchedRows: validRows,
        status: "COMPLETED",
        completedAt: new Date(),
        summary: {
          totalParsed: jsonData.length,
          validRows,
          invalidRows,
          columns: Object.keys(jsonData[0] || {}),
          columnMapping: {
            employeeId: empIdCol || null,
            employeeName: empNameCol || null,
            punchTime: punchTimeCol,
            deviceId: deviceIdCol || null,
          },
        },
      },
    });

    return NextResponse.json({
      importId: importRecord.id,
      fileName: file.name,
      totalRows: jsonData.length,
      validRows,
      invalidRows,
      unmatchedRows: validRows,
      status: "COMPLETED",
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/attendance/import error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const [imports, total] = await Promise.all([
      db.attendanceImport.findMany({
        where: { companyId },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      db.attendanceImport.count({ where: { companyId } }),
    ]);

    return NextResponse.json({
      imports,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("GET /api/attendance/import error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
