import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

// GET: Current day collection totals vs submitted closing records
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  // Fetch all payments recorded today
  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay = new Date(`${date}T23:59:59.999Z`);

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: startOfDay, lte: endOfDay },
      status: "SUCCESS",
    },
  });

  const expectedCash = payments.filter((p) => p.method === "CASH").reduce((s, p) => s + p.amount, 0);
  const expectedUpi = payments.filter((p) => p.method === "UPI").reduce((s, p) => s + p.amount, 0);
  const expectedGateway = payments.filter((p) => p.method === "GATEWAY").reduce((s, p) => s + p.amount, 0);
  const totalExpected = expectedCash + expectedUpi + expectedGateway;

  // Total guests from bookings and walk-ins today
  const bookings = await prisma.booking.findMany({
    where: { bookingDate: date, status: { not: "CANCELLED" } },
  });
  const walkIns = await prisma.walkIn.findMany({
    where: { createdAt: { gte: startOfDay, lte: endOfDay } },
  });

  const totalGuests =
    bookings.reduce((s, b) => s + b.guestCount, 0) +
    walkIns.reduce((s, w) => s + w.visitorCount, 0);

  // Check if closing already submitted for this date
  const closingRecord = await prisma.endOfDayClosing.findUnique({
    where: { date },
    include: { closedByUser: { select: { name: true } } },
  });

  // Recent closings
  const recentClosings = await prisma.endOfDayClosing.findMany({
    orderBy: { date: "desc" },
    take: 10,
    include: { closedByUser: { select: { name: true } } },
  });

  return NextResponse.json({
    date,
    expectedCollections: {
      cash: expectedCash,
      upi: expectedUpi,
      gateway: expectedGateway,
      total: totalExpected,
    },
    totalGuests,
    bookingsCount: bookings.length,
    walkInsCount: walkIns.length,
    closingRecord,
    recentClosings,
  });
}

// POST: Submit daily closing
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(user.role, user.permissions, PERMISSIONS.CLOSING_SUBMIT)) {
    return NextResponse.json({ error: "Forbidden: You cannot submit closing reconciliation." }, { status: 403 });
  }

  const body = await req.json();
  const { date, actualCash, actualUpi, notes, varianceReason } = body;

  const targetDate = date || new Date().toISOString().split("T")[0];

  const startOfDay = new Date(`${targetDate}T00:00:00.000Z`);
  const endOfDay = new Date(`${targetDate}T23:59:59.999Z`);

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: startOfDay, lte: endOfDay },
      status: "SUCCESS",
    },
  });

  const expectedCash = payments.filter((p) => p.method === "CASH").reduce((s, p) => s + p.amount, 0);
  const expectedUpi = payments.filter((p) => p.method === "UPI").reduce((s, p) => s + p.amount, 0);
  const expectedGateway = payments.filter((p) => p.method === "GATEWAY").reduce((s, p) => s + p.amount, 0);

  const actCash = Number(actualCash) || 0;
  const actUpi = Number(actualUpi) || 0;
  const cashVariance = Math.round((actCash - expectedCash) * 100) / 100;
  const upiVariance = Math.round((actUpi - expectedUpi) * 100) / 100;

  // If variance exists, reason is required
  if ((cashVariance !== 0 || upiVariance !== 0) && (!varianceReason || !varianceReason.trim())) {
    return NextResponse.json(
      { error: "A discrepancy note/reason is required whenever actual collection does not match expected." },
      { status: 400 }
    );
  }

  const closing = await prisma.endOfDayClosing.upsert({
    where: { date: targetDate },
    create: {
      date: targetDate,
      expectedCash,
      actualCash: actCash,
      cashVariance,
      expectedUpi,
      actualUpi: actUpi,
      upiVariance,
      expectedGateway,
      actualGateway: expectedGateway,
      totalCollections: actCash + actUpi + expectedGateway,
      closedByUserId: user.userId,
      status: "SUBMITTED",
      notes,
      varianceReason,
    },
    update: {
      expectedCash,
      actualCash: actCash,
      cashVariance,
      expectedUpi,
      actualUpi: actUpi,
      upiVariance,
      expectedGateway,
      actualGateway: expectedGateway,
      totalCollections: actCash + actUpi + expectedGateway,
      closedByUserId: user.userId,
      status: "SUBMITTED",
      notes,
      varianceReason,
    },
  });

  await prisma.auditLog.create({
    data: {
      entityType: "CLOSING",
      entityId: closing.id,
      action: "CREATE",
      performedByUserId: user.userId,
      userRole: user.role,
      details: `Daily Closing submitted for ${targetDate}. Actual Cash: ₹${actCash} (Variance: ₹${cashVariance}), Actual UPI: ₹${actUpi} (Variance: ₹${upiVariance})`,
    },
  });

  return NextResponse.json({ success: true, closing });
}
