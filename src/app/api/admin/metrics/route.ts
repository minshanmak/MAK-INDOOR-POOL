import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getPoolDate, getPoolTime, getPoolHour, getPoolDayBounds } from "@/lib/timezone";
import { autoCheckoutExpiredWalkIns, getWalkInRemainingMinutes } from "@/lib/walkins";
import { calculatePublicOverstay, calculatePrivateOverstay, checkPublicCapacity } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStr = getPoolDate(now);
  const currentTimeStr = getPoolTime(now);
  const currentHour = getPoolHour(now);
  const { startOfDay: todayStart, endOfDay: todayEnd } = getPoolDayBounds(todayStr);

  // 1. Settings & Operating Hours
  const settings = await prisma.poolSetting.findUnique({
    where: { id: "singleton_settings" },
  });
  const openHour = settings?.openHour ?? 9;
  const closeHour = settings?.closeHour ?? 23;
  const publicEndHour = settings?.publicEndHour ?? 16;
  const maxCapacity = settings?.maxCapacity ?? 25;
  const bufferMinutes = 15; // 15-minute standard turnover buffer

  // Mode detection: PUBLIC (09:00 - 16:00), PRIVATE (16:00 - 23:00), CLOSED (<09:00 or >=23:00)
  let currentMode: "PUBLIC" | "PRIVATE" | "CLOSED" = "CLOSED";
  let modeChangeInfo = "Opens at 9:00 AM (Public session)";

  if (currentHour >= openHour && currentHour < publicEndHour) {
    currentMode = "PUBLIC";
    modeChangeInfo = "Private sessions begin at 4:00 PM";
  } else if (currentHour >= publicEndHour && currentHour < closeHour) {
    currentMode = "PRIVATE";
    modeChangeInfo = "Pool closes at 11:00 PM";
  } else {
    currentMode = "CLOSED";
    modeChangeInfo = currentHour >= closeHour ? "Opens tomorrow at 9:00 AM" : "Opens at 9:00 AM";
  }

  // 3:45 PM pool clearing notice: Prompt front desk to clear pool before 4:00 PM private sessions
  const turnoverWarning = {
    active: currentTimeStr >= "15:45" && currentTimeStr < "16:00",
    message: "Public swimming ends at 4:00 PM. Please clear the pool now for 15-minute filtration & sanitization turnover.",
  };

  // 2. Fetch today's confirmed bookings
  const todayBookings = await prisma.booking.findMany({
    where: { bookingDate: todayStr },
    orderBy: { startTime: "asc" },
  });

  // 3. Today's collections
  const todayPayments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: todayStart, lte: todayEnd },
      status: "SUCCESS",
    },
  });

  const todayCollections = {
    cash: todayPayments.filter((p) => p.method === "CASH").reduce((s, p) => s + p.amount, 0),
    upi: todayPayments.filter((p) => p.method === "UPI").reduce((s, p) => s + p.amount, 0),
    gateway: todayPayments.filter((p) => p.method === "GATEWAY").reduce((s, p) => s + p.amount, 0),
    total: todayPayments.reduce((s, p) => s + p.amount, 0),
  };

  // 4. Active Walk-ins and Live Swimmers
  await autoCheckoutExpiredWalkIns();
  const activeWalkIns = await prisma.walkIn.findMany({
    where: { status: "ACTIVE" },
  });
  const activeWalkInGuests = activeWalkIns.reduce((s, w) => s + w.visitorCount, 0);

  const ongoingBookings = todayBookings.filter(
    (b) =>
      b.status === "CONFIRMED" &&
      (b.checkInStatus === "CHECKED_IN" || (currentTimeStr >= b.startTime && currentTimeStr < b.endTime))
  );

  const ongoingPublicGuests = ongoingBookings
    .filter((b) => b.type === "PUBLIC")
    .reduce((s, b) => s + b.guestCount, 0);

  const currentPublicSwimmers = activeWalkInGuests + ongoingPublicGuests;

  // 25-cell Segmented Gauge Representation
  // Cells 0-18: Sky (#0284C7), Cells 19-22: Amber, Cells 23-24: Red
  const segmentedGaugeCells = Array.from({ length: maxCapacity }, (_, i) => {
    const isOccupied = i < currentPublicSwimmers;
    let colorTier: "sky" | "amber" | "red" = "sky";
    if (i >= 23) colorTier = "red";
    else if (i >= 19) colorTier = "amber";

    return {
      index: i + 1,
      isOccupied,
      colorTier,
    };
  });

  // 5. Construct Active Sessions List with Urgency Sorting
  const activeSessions: any[] = [];

  // Add active walk-ins
  for (const w of activeWalkIns) {
    const { remainingMinutes, isExpired, targetEndTime } = getWalkInRemainingMinutes(w, now);
    const elapsedMinutes = Math.round((now.getTime() - targetEndTime.getTime()) / 60000);
    const overdueMinutes = Math.max(0, elapsedMinutes);
    const overstay = calculatePublicOverstay(overdueMinutes, w.visitorCount);
    const isOverdue = overdueMinutes > 5; // 5-minute grace period

    let urgency: "OVERDUE" | "EXPIRING_SOON" | "ACTIVE" = "ACTIVE";
    if (isOverdue) urgency = "OVERDUE";
    else if (remainingMinutes <= 10) urgency = "EXPIRING_SOON";

    activeSessions.push({
      sessionId: `walkin-${w.id}`,
      id: w.id,
      customerName: w.customerName || `Walk-in (${w.visitorCount} Guests)`,
      customerPhone: w.customerPhone || "Counter visitor",
      guests: w.visitorCount,
      sessionType: "PUBLIC",
      source: "WALKIN",
      startTime: w.checkInTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }),
      plannedEndTime: targetEndTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }),
      durationHours: w.durationHours,
      paymentMethod: w.paymentMethod,
      totalAmount: w.collectedAmount,
      totalPaid: w.collectedAmount,
      balanceAmount: 0,
      paymentStatus: "PAID",
      remainingMinutes: Math.max(0, remainingMinutes),
      isOverdue,
      overdueMinutes,
      projectedOverstayCharge: overstay.projectedCharge,
      urgency,
      canExtend: true,
    });
  }

  // Add ongoing / checked-in bookings
  for (const b of ongoingBookings) {
    const plannedEnd = new Date(`${todayStr}T${b.endTime}:00+05:30`);
    const diffMs = plannedEnd.getTime() - now.getTime();
    const remainingMinutes = Math.round(diffMs / 60000);
    const elapsedMinutes = Math.round((now.getTime() - plannedEnd.getTime()) / 60000);
    const overdueMinutes = Math.max(0, elapsedMinutes);

    const isPublic = b.type === "PUBLIC";
    let isOverdue = false;
    let projectedCharge = 0;

    if (isPublic) {
      const overstay = calculatePublicOverstay(overdueMinutes, b.guestCount);
      isOverdue = overdueMinutes > 5; // 5-min grace
      projectedCharge = overstay.projectedCharge;
    } else {
      const overstay = calculatePrivateOverstay(overdueMinutes, b.guestCount);
      isOverdue = overdueMinutes > 0; // Private bills immediately in 15-min increments
      projectedCharge = overstay.projectedCharge;
    }

    let urgency: "OVERDUE" | "EXPIRING_SOON" | "ACTIVE" = "ACTIVE";
    if (isOverdue) urgency = "OVERDUE";
    else if (remainingMinutes <= 10) urgency = "EXPIRING_SOON";

    activeSessions.push({
      sessionId: `booking-${b.id}`,
      id: b.id,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      guests: b.guestCount,
      sessionType: b.type,
      source: "ONLINE",
      startTime: b.startTime,
      plannedEndTime: b.endTime,
      durationHours: b.durationHours,
      paymentMethod: "GATEWAY",
      totalAmount: b.totalAmount,
      totalPaid: b.totalPaid,
      balanceAmount: b.balanceAmount,
      paymentStatus: b.balanceAmount > 0 ? "BALANCE_DUE" : "PAID",
      remainingMinutes: Math.max(0, remainingMinutes),
      isOverdue,
      overdueMinutes,
      projectedOverstayCharge: projectedCharge,
      urgency,
      canExtend: true,
    });
  }

  // Sort active sessions: OVERDUE first (highest overtime first), then EXPIRING_SOON, then ACTIVE
  activeSessions.sort((a, b) => {
    const urgencyOrder = { OVERDUE: 0, EXPIRING_SOON: 1, ACTIVE: 2 };
    if (urgencyOrder[a.urgency as keyof typeof urgencyOrder] !== urgencyOrder[b.urgency as keyof typeof urgencyOrder]) {
      return urgencyOrder[a.urgency as keyof typeof urgencyOrder] - urgencyOrder[b.urgency as keyof typeof urgencyOrder];
    }
    if (a.urgency === "OVERDUE") {
      return b.overdueMinutes - a.overdueMinutes;
    }
    return a.remainingMinutes - b.remainingMinutes;
  });

  // 6. Private Mode Status (Headcount, Extra Billing, Buffer & Conflict Detection)
  const activePrivateBooking = todayBookings.find(
    (b) =>
      b.type === "FAMILY" &&
      b.status === "CONFIRMED" &&
      (b.checkInStatus === "CHECKED_IN" || (currentTimeStr >= b.startTime && currentTimeStr < b.endTime))
  );

  const upcomingPrivateBookings = todayBookings.filter(
    (b) => b.type === "FAMILY" && b.status === "CONFIRMED" && b.startTime >= currentTimeStr
  );
  const nextPrivateBooking = upcomingPrivateBookings[0] || null;

  let privateModeData = null;
  if (activePrivateBooking) {
    const guests = activePrivateBooking.guestCount;
    const included = 12;
    const extraGuests = Math.max(0, guests - included);
    const extraRatePerHour = 100;
    const extraBillingAmount = extraGuests * extraRatePerHour * activePrivateBooking.durationHours;

    // Buffer overrun conflict check:
    // If the active session is running late and encroaches on the 15-minute buffer before next booking
    let bufferConflict = false;
    let bufferConflictMessage = "";
    if (nextPrivateBooking) {
      const [nextH, nextM] = nextPrivateBooking.startTime.split(":").map(Number);
      const nextBookingStartMinutes = nextH * 60 + nextM;
      const bufferStartMinutes = nextBookingStartMinutes - bufferMinutes;
      const [curH, curM] = currentTimeStr.split(":").map(Number);
      const curMinutes = curH * 60 + curM;

      if (curMinutes >= bufferStartMinutes) {
        bufferConflict = true;
        bufferConflictMessage = `Session has overrun into the 15-minute turnover buffer for next booking (${nextPrivateBooking.customerName} at ${nextPrivateBooking.startTime}). Block next admission until resolved.`;
      }
    }

    privateModeData = {
      bookingId: activePrivateBooking.id,
      customerName: activePrivateBooking.customerName,
      customerPhone: activePrivateBooking.customerPhone,
      guestCount: guests,
      includedCount: included,
      extraGuests,
      extraBillingAmount,
      totalAmount: activePrivateBooking.totalAmount,
      totalPaid: activePrivateBooking.totalPaid,
      balanceDue: activePrivateBooking.balanceAmount,
      startTime: activePrivateBooking.startTime,
      endTime: activePrivateBooking.endTime,
      bufferMinutes,
      bufferConflict,
      bufferConflictMessage,
      nextBooking: nextPrivateBooking
        ? {
            id: nextPrivateBooking.id,
            customerName: nextPrivateBooking.customerName,
            startTime: nextPrivateBooking.startTime,
            guestCount: nextPrivateBooking.guestCount,
          }
        : null,
    };
  }

  // 7. Water Safety Status (9 AM & 3 PM checks, Chlorine 1.5-3.0, pH 7.2-7.6)
  const todayWaterReadings = await prisma.waterReading.findMany({
    where: { date: todayStr },
    orderBy: { createdAt: "desc" },
  });
  const latestWaterReading = todayWaterReadings[0] || null;

  const isMorningLogDue = currentHour >= 9 && todayWaterReadings.length === 0;
  const isAfternoonLogDue = currentHour >= 15 && todayWaterReadings.length < 2;
  const waterLogDue = isMorningLogDue || isAfternoonLogDue;

  let outOfRangeAlert = null;
  if (latestWaterReading) {
    const { chlorinePpm, phLevel } = latestWaterReading;
    const chlorineOutOfRange = chlorinePpm < 1.5 || chlorinePpm > 3.0;
    const phOutOfRange = phLevel < 7.2 || phLevel > 7.6;

    if (chlorineOutOfRange || phOutOfRange) {
      outOfRangeAlert = {
        message: `Water test out of safe range: ${
          chlorineOutOfRange ? `Chlorine ${chlorinePpm} ppm (Safe: 1.5–3.0). ` : ""
        }${phOutOfRange ? `pH ${phLevel} (Safe: 7.2–7.6).` : ""}`,
        chlorinePpm,
        phLevel,
      };
    }
  }

  // 8. Pending Balances List (Private bookings where balance is unpaid: total - 750 advance)
  const pendingBalancesList = todayBookings
    .filter((b) => b.type === "FAMILY" && b.balanceAmount > 0 && b.status === "CONFIRMED")
    .map((b) => ({
      id: b.id,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      guestCount: b.guestCount,
      slotTime: `${b.startTime} – ${b.endTime}`,
      totalAmount: b.totalAmount,
      advancePaid: b.totalPaid,
      balanceDue: b.balanceAmount,
      checkInStatus: b.checkInStatus,
    }));

  // 9. Timeline Data (Public hourly occupancy heat + Private booking blocks with 15m hatched buffers)
  const timelineHours = Array.from({ length: 14 }, (_, i) => openHour + i); // 9 to 22 (9:00 AM to 11:00 PM)

  const hourlyOccupancy = timelineHours.map((h) => {
    const hourStr = `${String(h).padStart(2, "0")}:00`;
    const nextHourStr = `${String(h + 1).padStart(2, "0")}:00`;
    const swimmers = todayBookings
      .filter((b) => b.status === "CONFIRMED" && b.startTime < nextHourStr && b.endTime > hourStr)
      .reduce((sum, b) => sum + b.guestCount, 0);

    return {
      hour: h,
      label: `${h > 12 ? h - 12 : h} ${h >= 12 ? "PM" : "AM"}`,
      swimmers,
      maxCapacity,
      pct: Math.min(100, Math.round((swimmers / maxCapacity) * 100)),
    };
  });

  return NextResponse.json({
    currentMode,
    modeChangeInfo,
    currentTimeStr,
    todayStr,
    turnoverWarning,
    waterLogDue,
    outOfRangeAlert,
    metrics: {
      publicGauge: {
        currentSwimmers: currentPublicSwimmers,
        maxCapacity,
        spotsRemaining: Math.max(0, maxCapacity - currentPublicSwimmers),
        cells: segmentedGaugeCells,
        onlineBookingsCount: todayBookings.filter((b) => b.type === "PUBLIC").length,
        walkInsCount: activeWalkIns.length,
        todayCash: todayCollections.cash,
        todayUpi: todayCollections.upi,
        todayTotal: todayCollections.total,
      },
      privateModeStatus: privateModeData,
      todayCollections,
      totalOutstanding: pendingBalancesList.reduce((sum, b) => sum + b.balanceDue, 0),
      pendingBalancesCount: pendingBalancesList.length,
      waterSafety: {
        latestReading: latestWaterReading,
        todayReadingsCount: todayWaterReadings.length,
        isLogDue: waterLogDue,
        outOfRangeAlert,
      },
      operatingHours: {
        openHour,
        closeHour,
        publicEndHour,
        hoursLabel: "9:00 AM – 11:00 PM",
        publicHoursLabel: "9:00 AM – 4:00 PM",
        familyHoursLabel: "4:00 PM – 11:00 PM",
      },
    },
    activeSessions,
    pendingBalancesList,
    timelineData: {
      hourlyOccupancy,
      todayBookings,
      bufferMinutes,
    },
    todayBookings,
  });
}

