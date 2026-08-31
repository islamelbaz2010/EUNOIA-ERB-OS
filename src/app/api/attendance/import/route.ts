import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

    if (jsonData.length === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
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
      const employeeIdentifier = row["Employee ID"] || row["employeeId"] || row["ID"] || "";
      const punchTimeRaw = row["Punch Time"] || row["punchTime"] || row["Time"] || "";
      const rawDeviceId = row["Device ID"] || row["deviceId"] || "";

      if (!employeeIdentifier || !punchTimeRaw) {
        invalidRows++;
        continue;
      }

      let punchTime: Date;
      try {
        punchTime = new Date(punchTimeRaw);
        if (isNaN(punchTime.getTime())) {
          invalidRows++;
          continue;
        }
      } catch {
        invalidRows++;
        continue;
      }

      rawRecords.push({
        attendanceImportId: importRecord.id,
        employeeIdentifier: String(employeeIdentifier),
        punchTime,
        rawDeviceId: rawDeviceId ? String(rawDeviceId) : null,
        rawRow: row,
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

    const [imports, total] = await Promise.all([
      db.attendanceImport.findMany({
        include: {},
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      db.attendanceImport.count(),
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
