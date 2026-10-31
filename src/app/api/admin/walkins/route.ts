import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { getPoolDate, getPoolTime } from "@/lib/timezone";
import { isTimeOverlapping, timeToMinutes } from "@/lib/booking-engine";

export const dynamic = "force-dynamic";

// GET: List active and past walk-ins
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // ACTIVE | CHECKED_OUT | all

  const whereClause: any = {};
  if (status && status !== "all") {
    whereClause.status = status;
  }

  const walkIns = await prisma.walkIn.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const activeCount = await prisma.walkIn.aggregate({
    where: { status: "ACTIVE" },
    _sum: { visitorCount: true },
  });

  return NextResponse.json({
    walkIns,
    currentActiveVisitors: activeCount._sum.visitorCount || 0,
  });
}

// POST: Create Walk-in (Quick-Entry or Full Check-In)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(user.role, user.permissions, PERMISSIONS.WALKIN_MANAGE)) {
    return NextResponse.json({ error: "Forbidden: Walk-in permission required" }, { status: 403 });
  }

  const body = await req.json();
  const {
    action, // "CHECK_IN" | "CHECK_OUT" | "QUICK_ENTRY"
    walkInId,
    visitorCount,
    durationHours,
    ratePerHour = 150,
    overrideCharge,
    overrideReason,
    collectedAmount,
    paymentMethod = "CASH",
    customerName,
    customerPhone,
  } = body;

  const count = Number(visitorCount) || 1;
  const duration = Number(durationHours) || 1;
  const rate = Number(ratePerHour) || 150;
  const calculatedCharge = Math.round(count * duration * rate * 100) / 100;

  // Charge override requires mandatory reason
  if (overrideCharge !== undefined && overrideCharge !== null && overrideCharge !== calculatedCharge) {
    if (!overrideReason || !overrideReason.trim()) {
      return NextResponse.json(
        { error: "Authorized charge overrides require a mandatory explanation reason." },
        { status: 400 }
      );
    }
  }

  const finalCharge = overrideCharge !== undefined && overrideCharge !== null ? Number(overrideCharge) : calculatedCharge;
  const collected = collectedAmount !== undefined && collectedAmount !== null ? Number(collectedAmount) : finalCharge;

  if (action === "QUICK_ENTRY" || action === "CHECK_IN") {
    // Check if pool is currently reserved for a private family booking
    const now = new Date();
    const todayStr = getPoolDate(now);
    const currentTimeStr = getPoolTime(now);
    const endMinutes = timeToMinutes(currentTimeStr) + duration * 60;
    const targetEndTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

    const activeFamilyBookings = await prisma.booking.findMany({
      where: {
        bookingDate: todayStr,
        type: "FAMILY",
        status: { in: ["CONFIRMED", "HOLD"] },
      },
    });

    for (const fb of activeFamilyBookings) {
      if (isTimeOverlapping(currentTimeStr, targetEndTime, fb.startTime, fb.endTime)) {
        return NextResponse.json(
          {
            error: `Cannot admit public walk-ins: The pool is exclusively reserved for a private family booking (${fb.startTime} – ${fb.endTime}).`,
          },
          { status: 400 }
        );
      }
    }

    const walkIn = await prisma.$transaction(async (tx) => {
      const entry = await tx.walkIn.create({
        data: {
          visitorCount: count,
          durationHours: duration,
          ratePerHour: rate,
          calculatedCharge,
          overrideCharge: overrideCharge !== undefined ? Number(overrideCharge) : null,
          overrideReason: overrideReason || null,
          collectedAmount: collected,
          paymentMethod,
          status: action === "QUICK_ENTRY" ? "CHECKED_OUT" : "ACTIVE",
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          staffUserId: user.userId,
        },
      });

      // Record payment
      if (collected > 0) {
        await tx.payment.create({
          data: {
            walkInId: entry.id,
            amount: collected,
            method: paymentMethod as "CASH" | "UPI",
            status: "SUCCESS",
            transactionRef: `WALKIN-PAY-${Date.now()}`,
            recordedByUserId: user.userId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          entityType: "PAYMENT",
          entityId: entry.id,
          action: "CREATE",
          performedByUserId: user.userId,
          userRole: user.role,
          details: `Walk-in ${action} created for ${count} visitor(s). Collected ₹${collected} via ${paymentMethod}.${overrideReason ? ` (Override: ${overrideReason})` : ""}`,
        },
      });

      return entry;
    });

    return NextResponse.json({ success: true, walkIn });
  }

  if (action === "CHECK_OUT") {
    if (!walkInId) {
      return NextResponse.json({ error: "walkInId is required for check out." }, { status: 400 });
    }

    const walkIn = await prisma.$transaction(async (tx) => {
      const existing = await tx.walkIn.findUnique({
        where: { id: walkInId },
      });
      if (!existing) throw new Error("Walk-in record not found.");

      const checkOutTime = new Date();
      const actualDurationHours = Math.max(
        0.5,
        Math.round(((checkOutTime.getTime() - existing.checkInTime.getTime()) / (1000 * 60 * 60)) * 10) / 10
      );

      const updated = await tx.walkIn.update({
        where: { id: walkInId },
        data: {
          status: "CHECKED_OUT",
          checkOutTime,
          durationHours: actualDurationHours,
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: "PAYMENT",
          entityId: updated.id,
          action: "UPDATE",
          performedByUserId: user.userId,
          userRole: user.role,
          details: `Walk-in checked out. Actual duration: ${actualDurationHours}h for ${existing.visitorCount} visitors.`,
        },
      });

      return updated;
    });

    return NextResponse.json({ success: true, walkIn });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
