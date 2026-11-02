import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getPoolDate, getPoolTime, getPoolDayBounds } from "@/lib/timezone";
import { autoCheckoutExpiredWalkIns } from "@/lib/walkins";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStr = getPoolDate();
  const currentTimeStr = getPoolTime();
  const { startOfDay: todayStart } = getPoolDayBounds(todayStr);

  // 1. Today's Bookings
  const todayBookings = await prisma.booking.findMany({
    where: { bookingDate: todayStr },
    orderBy: { startTime: "asc" },
  });

  // 2. Upcoming Bookings
  const upcomingBookings = await prisma.booking.findMany({
    where: {
      bookingDate: { gte: todayStr },
      status: "CONFIRMED",
    },
    take: 10,
    orderBy: [{ bookingDate: "asc" }, { startTime: "asc" }],
  });

  // 3. Today's Payments & Collections
  const todayPayments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: todayStart },
      status: "SUCCESS",
    },
  });

  const todayCollections = {
    cash: todayPayments.filter((p) => p.method === "CASH").reduce((s, p) => s + p.amount, 0),
    upi: todayPayments.filter((p) => p.method === "UPI").reduce((s, p) => s + p.amount, 0),
    gateway: todayPayments.filter((p) => p.method === "GATEWAY").reduce((s, p) => s + p.amount, 0),
    total: todayPayments.reduce((s, p) => s + p.amount, 0),
  };

  // 4. Monthly Revenue (IST month start)
  const [yearStr, monthStr] = todayStr.split("-");
  const monthStart = new Date(`${yearStr}-${monthStr}-01T00:00:00+05:30`);
  const monthlyPayments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: monthStart },
      status: "SUCCESS",
    },
  });
  const monthlyRevenue = monthlyPayments.reduce((s, p) => s + p.amount, 0);

  // 5. Total Outstanding Balances on active bookings
  const activeBookings = await prisma.booking.findMany({
    where: { status: "CONFIRMED", balanceAmount: { gt: 0 } },
  });
  const totalOutstanding = activeBookings.reduce((s, b) => s + b.balanceAmount, 0);

  // 6. Current Live Pool Occupancy:
  // Auto-release expired walk-ins before calculating live occupancy
  await autoCheckoutExpiredWalkIns();

  // Active walk-in swimmers + confirmed online bookings currently in the pool right now
  const activeWalkIns = await prisma.walkIn.findMany({
    where: { status: "ACTIVE" },
  });
  const activeWalkInGuests = activeWalkIns.reduce((s, w) => s + w.visitorCount, 0);

  const ongoingBookings = todayBookings.filter(
    (b) =>
      b.status === "CONFIRMED" &&
      currentTimeStr >= b.startTime &&
      currentTimeStr < b.endTime
  );
  const ongoingBookingGuests = ongoingBookings.reduce((s, b) => s + b.guestCount, 0);
  const currentTotalSwimmers = activeWalkInGuests + ongoingBookingGuests;

  const settings = await prisma.poolSetting.findUnique({
    where: { id: "singleton_settings" },
  });
  const maxCapacity = settings?.maxCapacity || 25;

  // 7. Pending Cancellation Requests
  const pendingCancellations = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      cancellationReason: { not: null },
    },
  });

  // 8. Pending Refunds
  const pendingRefunds = await prisma.refund.findMany({
    where: { status: "PENDING" },
  });

  // 9. Today's Latest Water Reading
  const latestWaterReading = await prisma.waterReading.findFirst({
    where: { date: todayStr },
    orderBy: { createdAt: "desc" },
  });

  // 10. Today's Maintenance Checklist
  const todayChecklists = await prisma.maintenanceChecklist.findMany({
    where: { date: todayStr },
  });

  // 11. Recent Audit Activities
  const recentActivities = await prisma.auditLog.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    metrics: {
      todayBookingsCount: todayBookings.length,
      todayCollections,
      monthlyRevenue,
      totalOutstanding,
      liveOccupancy: {
        current: currentTotalSwimmers,
        onlineBookingsGuests: ongoingBookingGuests,
        walkInGuests: activeWalkInGuests,
        maxCapacity,
        percentage: Math.min(100, Math.round((currentTotalSwimmers / maxCapacity) * 100)),
        isFamilySessionActive: ongoingBookings.some((b) => b.type === "FAMILY"),
      },
      pendingCancellationsCount: pendingCancellations.length,
      pendingRefundsCount: pendingRefunds.length,
      waterStatus: latestWaterReading
        ? {
            chlorinePpm: latestWaterReading.chlorinePpm,
            phLevel: latestWaterReading.phLevel,
            clarity: latestWaterReading.waterClarity,
            status: latestWaterReading.status,
            time: latestWaterReading.time,
          }
        : null,
      cleaningDone: todayChecklists.length > 0,
    },
    todayBookings,
    upcomingBookings,
    pendingCancellations,
    recentActivities,
  });
}
