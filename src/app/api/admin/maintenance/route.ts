import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStr = new Date().toISOString().split("T")[0];

  const readings = await prisma.waterReading.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { staffUser: { select: { name: true } } },
  });

  const checklists = await prisma.maintenanceChecklist.findMany({
    orderBy: { createdAt: "desc" },
    take: 14,
    include: { staffUser: { select: { name: true } } },
  });

  const issues = await prisma.maintenanceIssue.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reportedByUser: { select: { name: true } },
      resolvedByUser: { select: { name: true } },
    },
  });

  return NextResponse.json({
    readings,
    checklists,
    issues,
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(user.role, user.permissions, PERMISSIONS.MAINTENANCE_LOG)) {
    return NextResponse.json({ error: "Forbidden: You lack maintenance logging permission." }, { status: 403 });
  }

  const body = await req.json();
  const { type } = body;

  const todayStr = new Date().toISOString().split("T")[0];
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // 1. WATER READING
  if (type === "WATER_READING") {
    const { chlorinePpm, phLevel, waterClarity = "CLEAR", remarks } = body;
    const cl = Number(chlorinePpm);
    const ph = Number(phLevel);

    // Determine status based on standard pool thresholds
    let status = "OPTIMAL";
    if (cl < 1.0 || cl > 4.0 || ph < 7.0 || ph > 7.8 || waterClarity === "HAZY") {
      status = "WARNING";
    }
    if (cl < 0.5 || cl > 5.0 || ph < 6.8 || ph > 8.0 || waterClarity === "TURBID") {
      status = "CRITICAL";
    }

    const reading = await prisma.waterReading.create({
      data: {
        date: todayStr,
        time: timeStr,
        chlorinePpm: cl,
        phLevel: ph,
        waterClarity,
        status,
        remarks: remarks || null,
        staffUserId: user.userId,
      },
    });

    return NextResponse.json({ success: true, reading });
  }

  // 2. CHECKLIST
  if (type === "CHECKLIST") {
    const {
      shift = "MORNING",
      poolCleaned = false,
      surroundingsCleaned = false,
      deckSanitized = false,
      skimmerCleaned = false,
      filtersChecked = false,
      safetyGearChecked = false,
      notes,
    } = body;

    const checklist = await prisma.maintenanceChecklist.create({
      data: {
        date: todayStr,
        shift,
        poolCleaned,
        surroundingsCleaned,
        deckSanitized,
        skimmerCleaned,
        filtersChecked,
        safetyGearChecked,
        notes: notes || null,
        staffUserId: user.userId,
      },
    });

    return NextResponse.json({ success: true, checklist });
  }

  // 3. REPORT ISSUE
  if (type === "REPORT_ISSUE") {
    const { title, description, severity = "MEDIUM" } = body;
    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
    }

    const issue = await prisma.maintenanceIssue.create({
      data: {
        title,
        description,
        severity,
        status: "OPEN",
        reportedByUserId: user.userId,
      },
    });

    return NextResponse.json({ success: true, issue });
  }

  // 4. RESOLVE ISSUE
  if (type === "RESOLVE_ISSUE") {
    const { issueId, resolutionNotes } = body;
    const updated = await prisma.maintenanceIssue.update({
      where: { id: issueId },
      data: {
        status: "RESOLVED",
        resolvedByUserId: user.userId,
        resolutionNotes,
        resolvedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true, issue: updated });
  }

  return NextResponse.json({ error: "Invalid maintenance type." }, { status: 400 });
}
