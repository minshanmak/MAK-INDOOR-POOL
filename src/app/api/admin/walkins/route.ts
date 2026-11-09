import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { getPoolDate, getPoolTime } from "@/lib/timezone";
import { isTimeOverlapping, timeToMinutes } from "@/lib/booking-engine";
import { autoCheckoutExpiredWalkIns, isWalkInOverlapping, getWalkInRemainingMinutes } from "@/lib/walkins";

export const dynamic = "force-dynamic";

// GET: List active and past walk-ins with live occupancy and countdowns
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Automatically release swimmers whose booked duration has finished
  await autoCheckoutExpiredWalkIns();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // ACTIVE | CHECKED_OUT | all

  const whereClause: any = {};
  if (status && status !== "all") {
    whereClause.status = status;
  }

  const [walkIns, activeCount, settings] = await Promise.all([
    prisma.walkIn.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    prisma.walkIn.aggregate({
      where: { status: "ACTIVE" },
      _sum: { visitorCount: true },
    }),
    prisma.poolSetting.findUnique({
      where: { id: "singleton_settings" },
    }),
  ]);

  const maxCapacity = settings?.maxCapacity || 25;
  const defaultRate = settings?.defaultPublicRate || 150;

  const now = new Date();
  const todayStr = getPoolDate(now);
  const currentTimeStr = getPoolTime(now);

  // Fetch today's confirmed bookings to detect sessions currently in the pool
  const activeBookings = await prisma.booking.findMany({
    where: {
      bookingDate: todayStr,
      status: "CONFIRMED",
    },
    include: {
      customer: true,
    },
  });

  const currentFamilyBooking = activeBookings.find(
    (b) => b.type === "FAMILY" && b.startTime <= currentTimeStr && currentTimeStr < b.endTime
  );

  const currentOnlinePublicGuests = activeBookings
    .filter((b) => b.type === "PUBLIC" && b.startTime <= currentTimeStr && currentTimeStr < b.endTime)
    .reduce((sum, b) => sum + b.guestCount, 0);

  const activeWalkInVisitors = activeCount._sum.visitorCount || 0;

  let isFamilySessionActive = false;
  let activeFamilyDetails = null;
  let currentActiveVisitors = 0;
  let remainingSpots = 0;

  if (currentFamilyBooking) {
    isFamilySessionActive = true;
    activeFamilyDetails = {
      customerName: currentFamilyBooking.customer?.name || "Private Family",
      customerPhone: currentFamilyBooking.customer?.phone || null,
      guestCount: currentFamilyBooking.guestCount,
      startTime: currentFamilyBooking.startTime,
      endTime: currentFamilyBooking.endTime,
    };
    currentActiveVisitors = currentFamilyBooking.guestCount;
    remainingSpots = 0; // Exclusively reserved!
  } else {
    currentActiveVisitors = activeWalkInVisitors + currentOnlinePublicGuests;
    remainingSpots = Math.max(0, maxCapacity - currentActiveVisitors);
  }

  const enrichedWalkIns = walkIns.map((w) => {
    const { remainingMinutes, isExpired, targetEndTime } = getWalkInRemainingMinutes(w, now);
    return {
      ...w,
      remainingMinutes,
      isExpired,
      targetCheckoutTime: targetEndTime.toISOString(),
    };
  });

  return NextResponse.json({
    walkIns: enrichedWalkIns,
    currentActiveVisitors,
    activeWalkInVisitors,
    onlinePublicVisitors: currentOnlinePublicGuests,
    isFamilySessionActive,
    activeFamilyDetails,
    maxCapacity,
    defaultRate,
    remainingSpots,
  });
}

// POST: Create Walk-in (Quick-Entry or Full Check-In) or Check-Out
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
    ratePerHour,
    overrideCharge,
    overrideReason,
    collectedAmount,
    paymentMethod = "CASH",
    customerName,
    customerPhone,
  } = body;

  if (action === "QUICK_ENTRY" || action === "CHECK_IN") {
    const count = Math.max(1, parseInt(String(visitorCount || 1), 10));
    const duration = Math.max(0.5, Math.min(12, parseFloat(String(durationHours || 1))));

    const settings = await prisma.poolSetting.findUnique({
      where: { id: "singleton_settings" },
    });

    if (settings?.maintenanceMode) {
      return NextResponse.json(
        { error: settings.maintenanceMessage || "Pool is temporarily closed for maintenance." },
        { status: 400 }
      );
    }

    const rate = Number(ratePerHour) || settings?.defaultPublicRate || 150;
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

    const now = new Date();
    const todayStr = getPoolDate(now);
    const currentTimeStr = getPoolTime(now);
    const startMinutes = timeToMinutes(currentTimeStr);
    const endMinutes = startMinutes + Math.round(duration * 60);
    const targetEndH = Math.floor(endMinutes / 60);
    const targetEndM = endMinutes % 60;
    const targetEndTime = `${String(targetEndH).padStart(2, "0")}:${String(targetEndM).padStart(2, "0")}`;

    const openHour = settings?.openHour ?? 9;
    const closeHour = settings?.closeHour ?? 23;
    const publicEndHour = settings?.publicEndHour ?? 16;
    const maxCapacity = settings?.maxCapacity ?? 25;

    // Check operating hours
    if (startMinutes < openHour * 60) {
      return NextResponse.json(
        { error: `Pool has not opened yet. Operating hours start at ${openHour}:00 AM.` },
        { status: 400 }
      );
    }
    if (startMinutes >= publicEndHour * 60) {
      return NextResponse.json(
        {
          error: `Public walk-ins are only permitted during public swimming hours (${openHour}:00 AM – ${publicEndHour > 12 ? publicEndHour - 12 : publicEndHour}:00 PM). Evening hours are reserved exclusively for private family bookings.`,
        },
        { status: 400 }
      );
    }
    if (endMinutes > closeHour * 60) {
      return NextResponse.json(
        { error: `Duration extends past pool closing time (${closeHour > 12 ? closeHour - 12 : closeHour}:00 PM).` },
        { status: 400 }
      );
    }

    // 1. Check if pool is reserved for a private family booking during this time
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

    // Check active unexpired private family holds
    const activeFamilyHolds = await prisma.slotHold.findMany({
      where: {
        date: todayStr,
        bookingType: "FAMILY",
        status: "ACTIVE",
        expiresAt: { gt: now },
      },
    });

    for (const hold of activeFamilyHolds) {
      if (isTimeOverlapping(currentTimeStr, targetEndTime, hold.startTime, hold.endTime)) {
        return NextResponse.json(
          {
            error: `Cannot admit public walk-ins: A private family checkout is currently in progress (${hold.startTime} – ${hold.endTime}).`,
          },
          { status: 400 }
        );
      }
    }

    // 2. Automatically release expired walk-ins before checking capacity
    await autoCheckoutExpiredWalkIns();

    // Check overlapping active walk-ins
    const activeWalkIns = await prisma.walkIn.findMany({
      where: { status: "ACTIVE" },
    });
    const overlappingActiveWalkIns = activeWalkIns
      .filter((w) => isWalkInOverlapping(w, todayStr, currentTimeStr, targetEndTime))
      .reduce((sum, w) => sum + w.visitorCount, 0);

    // Check overlapping confirmed public bookings
    const overlappingPublicBookings = await prisma.booking.findMany({
      where: {
        bookingDate: todayStr,
        type: "PUBLIC",
        status: "CONFIRMED",
      },
    });
    const overlappingPublicGuests = overlappingPublicBookings
      .filter((b) => isTimeOverlapping(currentTimeStr, targetEndTime, b.startTime, b.endTime))
      .reduce((sum, b) => sum + b.guestCount, 0);

    // Check active public slot holds
    const activePublicHolds = await prisma.slotHold.findMany({
      where: {
        date: todayStr,
        bookingType: "PUBLIC",
        status: "ACTIVE",
        expiresAt: { gt: now },
      },
    });
    const overlappingPublicHoldGuests = activePublicHolds
      .filter((h) => isTimeOverlapping(currentTimeStr, targetEndTime, h.startTime, h.endTime))
      .reduce((sum, h) => sum + h.guestCount, 0);

    const currentTotalOccupancy = overlappingActiveWalkIns + overlappingPublicGuests + overlappingPublicHoldGuests;

    if (currentTotalOccupancy + count > maxCapacity) {
      const remainingSpots = Math.max(0, maxCapacity - currentTotalOccupancy);
      return NextResponse.json(
        {
          error: `Capacity limit reached: Pool currently has ${currentTotalOccupancy} swimmers (${overlappingActiveWalkIns} active walk-ins + ${overlappingPublicGuests} online bookings${overlappingPublicHoldGuests > 0 ? ` + ${overlappingPublicHoldGuests} checkouts` : ""}) out of ${maxCapacity} maximum. Only ${remainingSpots} spot(s) remaining.`,
        },
        { status: 400 }
      );
    }

    const walkIn = await prisma.$transaction(async (tx) => {
      const entry = await tx.walkIn.create({
        data: {
          visitorCount: count,
          durationHours: duration,
          ratePerHour: rate,
          calculatedCharge,
          overrideCharge: overrideCharge !== undefined && overrideCharge !== null ? Number(overrideCharge) : null,
          overrideReason: overrideReason || null,
          collectedAmount: collected,
          paymentMethod,
          status: "ACTIVE",
          customerName: customerName?.trim() || null,
          customerPhone: customerPhone?.trim() || null,
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
          details: `Walk-in ${action} created for ${count} visitor(s) (${duration}h). Collected ₹${collected} via ${paymentMethod}.${overrideReason ? ` (Override: ${overrideReason})` : ""}`,
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
