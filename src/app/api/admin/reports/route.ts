import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import {
  getPoolDayBounds,
  getPoolDate,
  formatPoolDate,
  formatPoolDateTime,
  formatSlotTime,
} from "@/lib/timezone";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(user.role, user.permissions, PERMISSIONS.REPORTS_VIEW)) {
    return NextResponse.json(
      { error: "Forbidden: You lack report viewing permission." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const exportFormat = searchParams.get("format"); // "json" | "csv" | "payments-csv"

  const whereDate: any = {};
  if (startDate) whereDate.gte = startDate;
  if (endDate) whereDate.lte = endDate;

  const paymentDateFilter: any = {};
  if (startDate) {
    const { startOfDay } = getPoolDayBounds(startDate);
    paymentDateFilter.gte = startOfDay;
  }
  if (endDate) {
    const { endOfDay } = getPoolDayBounds(endDate);
    paymentDateFilter.lte = endOfDay;
  }

  // 1. Bookings in range
  const bookings = await prisma.booking.findMany({
    where: Object.keys(whereDate).length > 0 ? { bookingDate: whereDate } : undefined,
    orderBy: { bookingDate: "desc" },
  });

  // 2. Payments in range
  const payments = await prisma.payment.findMany({
    where: {
      status: "SUCCESS",
      ...(Object.keys(paymentDateFilter).length > 0 ? { createdAt: paymentDateFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  // 3. Walk-ins in range
  const walkIns = await prisma.walkIn.findMany({
    where: Object.keys(paymentDateFilter).length > 0 ? { createdAt: paymentDateFilter } : undefined,
    orderBy: { createdAt: "desc" },
  });

  // 4. Refunds in range
  const refunds = await prisma.refund.findMany({
    where: Object.keys(paymentDateFilter).length > 0 ? { createdAt: paymentDateFilter } : undefined,
    orderBy: { createdAt: "desc" },
  });

  // CSV EXPORT - BOOKINGS
  if (exportFormat === "csv") {
    const headers =
      "Booking ID,Date,Start Time,End Time,Duration (Hrs),Type,Status,Guests,Total (INR),Paid (INR),Balance (INR),Payment Status,Customer Name,Phone\n";
    const rows = bookings
      .map(
        (b) =>
          `"${b.id}","${b.bookingDate}","${formatSlotTime(b.startTime)}","${formatSlotTime(b.endTime)}",${b.durationHours},"${b.type}","${b.status}",${b.guestCount},${b.totalAmount},${b.totalPaid},${b.balanceAmount},"${b.paymentStatus}","${b.customerName}","${b.customerPhone}"`
      )
      .join("\n");

    return new NextResponse(headers + rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="mak-pool-bookings-report-${Date.now()}.csv"`,
      },
    });
  }

  // CSV EXPORT - FINANCIAL PAYMENTS LEDGER
  if (exportFormat === "payments-csv") {
    const headers =
      "Payment ID,Booking/WalkIn ID,Timestamp (IST),Method,Type,Amount (INR),Status,Reference\n";
    const rows = payments
      .map(
        (p) =>
          `"${p.id}","${p.bookingId || p.walkInId || "N/A"}","${formatPoolDateTime(p.createdAt)}","${p.method}","${p.type}",${p.amount},"${p.status}","${p.referenceNumber || ""}"`
      )
      .join("\n");

    return new NextResponse(headers + rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="mak-payments-ledger-${Date.now()}.csv"`,
      },
    });
  }

  // SUMMARY CALCULATIONS
  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const cashRevenue = payments.filter((p) => p.method === "CASH").reduce((s, p) => s + p.amount, 0);
  const upiRevenue = payments.filter((p) => p.method === "UPI").reduce((s, p) => s + p.amount, 0);
  const gatewayRevenue = payments
    .filter((p) => p.method === "GATEWAY")
    .reduce((s, p) => s + p.amount, 0);

  const publicBookings = bookings.filter((b) => b.type === "PUBLIC");
  const familyBookings = bookings.filter((b) => b.type === "FAMILY");

  const publicSwimmers = publicBookings.reduce((s, b) => s + b.guestCount, 0);
  const familySwimmers = familyBookings.reduce((s, b) => s + b.guestCount, 0);
  const walkInSwimmers = walkIns.reduce((s, w) => s + w.visitorCount, 0);
  const totalSwimmers = publicSwimmers + familySwimmers + walkInSwimmers;

  const publicRevenue = publicBookings.reduce((s, b) => s + b.totalPaid, 0);
  const familyRevenue = familyBookings.reduce((s, b) => s + b.totalPaid, 0);
  const walkInRevenue = walkIns.reduce((s, w) => s + w.collectedAmount, 0);

  const outstandingBalanceTotal = bookings
    .filter((b) => b.status === "CONFIRMED")
    .reduce((s, b) => s + b.balanceAmount, 0);

  const refundsApprovedTotal = refunds
    .filter((r) => r.status === "APPROVED" || r.status === "PROCESSED")
    .reduce((s, r) => s + r.approvedAmount, 0);

  const netRevenue = Math.max(0, totalRevenue - refundsApprovedTotal);

  const totalBookedGross = bookings.reduce((s, b) => s + b.totalAmount, 0);
  const totalCollectedFromBookings = bookings.reduce((s, b) => s + b.totalPaid, 0);
  const collectionEfficiency =
    totalBookedGross > 0
      ? Math.min(100, Math.round((totalCollectedFromBookings / totalBookedGross) * 100))
      : 100;

  const activeBookingsCount = bookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "COMPLETED"
  ).length;

  const avgBookingValue =
    activeBookingsCount > 0 ? Math.round(netRevenue / activeBookingsCount) : 0;
  const avgSwimmerValue = totalSwimmers > 0 ? Math.round(netRevenue / totalSwimmers) : 0;

  // 1. DAILY TRENDS AGGREGATION
  // Determine date bounds for trend timeline
  const todayIST = getPoolDate();
  const dateMap: Record<
    string,
    {
      date: string;
      label: string;
      dayName: string;
      revenue: number;
      onlineRevenue: number;
      cashRevenue: number;
      upiRevenue: number;
      bookingsCount: number;
      swimmersCount: number;
      familyCount: number;
      publicCount: number;
    }
  > = {};

  // If specific range provided, ensure every day in range exists in map
  if (startDate && endDate) {
    const cur = new Date(`${startDate}T00:00:00+05:30`);
    const end = new Date(`${endDate}T00:00:00+05:30`);
    while (cur <= end) {
      const dStr = getPoolDate(cur);
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayName = dayNames[cur.getDay()];
      const label = formatPoolDate(cur);
      dateMap[dStr] = {
        date: dStr,
        label,
        dayName,
        revenue: 0,
        onlineRevenue: 0,
        cashRevenue: 0,
        upiRevenue: 0,
        bookingsCount: 0,
        swimmersCount: 0,
        familyCount: 0,
        publicCount: 0,
      };
      cur.setDate(cur.getDate() + 1);
    }
  }

  // Populate payments into dateMap
  for (const p of payments) {
    const dStr = getPoolDate(p.createdAt);
    if (!dateMap[dStr]) {
      const pDate = new Date(p.createdAt);
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      dateMap[dStr] = {
        date: dStr,
        label: formatPoolDate(pDate),
        dayName: dayNames[pDate.getDay()],
        revenue: 0,
        onlineRevenue: 0,
        cashRevenue: 0,
        upiRevenue: 0,
        bookingsCount: 0,
        swimmersCount: 0,
        familyCount: 0,
        publicCount: 0,
      };
    }
    dateMap[dStr].revenue += p.amount;
    if (p.method === "GATEWAY") dateMap[dStr].onlineRevenue += p.amount;
    if (p.method === "CASH") dateMap[dStr].cashRevenue += p.amount;
    if (p.method === "UPI") dateMap[dStr].upiRevenue += p.amount;
  }

  // Populate bookings into dateMap
  for (const b of bookings) {
    const dStr = b.bookingDate;
    if (!dateMap[dStr]) {
      const bDate = new Date(`${dStr}T00:00:00+05:30`);
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      dateMap[dStr] = {
        date: dStr,
        label: formatPoolDate(bDate),
        dayName: dayNames[bDate.getDay()],
        revenue: 0,
        onlineRevenue: 0,
        cashRevenue: 0,
        upiRevenue: 0,
        bookingsCount: 0,
        swimmersCount: 0,
        familyCount: 0,
        publicCount: 0,
      };
    }
    dateMap[dStr].bookingsCount += 1;
    dateMap[dStr].swimmersCount += b.guestCount;
    if (b.type === "FAMILY") dateMap[dStr].familyCount += 1;
    if (b.type === "PUBLIC") dateMap[dStr].publicCount += 1;
  }

  // Populate walkIns into dateMap
  for (const w of walkIns) {
    const dStr = getPoolDate(w.createdAt);
    if (dateMap[dStr]) {
      dateMap[dStr].swimmersCount += w.visitorCount;
    }
  }

  // Sort daily trends chronologically
  const dailyTrends = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  const maxDayRevenue = Math.max(1, ...dailyTrends.map((d) => d.revenue));

  // 2. HOURLY / SLOT DISTRIBUTION (09:00 to 22:00)
  const slotHours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  const hourlyDistribution = slotHours.map((h) => {
    const slot = `${String(h).padStart(2, "0")}:00`;
    const label = formatSlotTime(slot);

    // Bookings starting at this slot
    const slotBookings = bookings.filter((b) => b.startTime === slot);
    const bookingsCount = slotBookings.length;
    const swimmers = slotBookings.reduce((s, b) => s + b.guestCount, 0);
    const revenue = slotBookings.reduce((s, b) => s + b.totalPaid, 0);
    const familyCount = slotBookings.filter((b) => b.type === "FAMILY").length;
    const publicCount = slotBookings.filter((b) => b.type === "PUBLIC").length;

    let period = "Morning (9 AM – 12 PM)";
    if (h >= 12 && h < 16) period = "Afternoon (12 PM – 4 PM)";
    if (h >= 16) period = "Evening Exclusive (4 PM – 11 PM)";

    return {
      slot,
      label,
      period,
      bookingsCount,
      swimmers,
      revenue,
      familyCount,
      publicCount,
    };
  });

  const maxSlotSwimmers = Math.max(1, ...hourlyDistribution.map((s) => s.swimmers));

  // 3. DAY OF WEEK PERFORMANCE
  const dayNamesFull = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayOfWeekTrends = dayNamesFull.map((name, idx) => {
    // Collect all daily entries matching this day of week
    const matchingDays = dailyTrends.filter((d) => {
      const parsed = new Date(`${d.date}T00:00:00+05:30`);
      return parsed.getDay() === idx;
    });

    const dayBookings = matchingDays.reduce((s, d) => s + d.bookingsCount, 0);
    const daySwimmers = matchingDays.reduce((s, d) => s + d.swimmersCount, 0);
    const dayRevenue = matchingDays.reduce((s, d) => s + d.revenue, 0);

    return {
      dayIndex: idx,
      dayName: name,
      shortName: name.slice(0, 3),
      bookingsCount: dayBookings,
      swimmersCount: daySwimmers,
      revenue: dayRevenue,
      isWeekend: idx === 0 || idx === 6,
    };
  });

  const maxDayOfWeekRevenue = Math.max(1, ...dayOfWeekTrends.map((d) => d.revenue));

  // 4. SESSION MIX BREAKDOWN
  const sessionMix = {
    family: {
      count: familyBookings.length,
      swimmers: familySwimmers,
      revenue: familyRevenue,
      percentage:
        totalSwimmers > 0 ? Math.round((familySwimmers / totalSwimmers) * 100) : 0,
    },
    public: {
      count: publicBookings.length,
      swimmers: publicSwimmers,
      revenue: publicRevenue,
      percentage:
        totalSwimmers > 0 ? Math.round((publicSwimmers / totalSwimmers) * 100) : 0,
    },
    walkIn: {
      count: walkIns.length,
      swimmers: walkInSwimmers,
      revenue: walkInRevenue,
      percentage:
        totalSwimmers > 0 ? Math.round((walkInSwimmers / totalSwimmers) * 100) : 0,
    },
  };

  // 5. PAYMENT METHODS BREAKDOWN
  const totalPaymentTxns = payments.length || 1;
  const paymentMethods = {
    gateway: {
      amount: gatewayRevenue,
      count: payments.filter((p) => p.method === "GATEWAY").length,
      percentage: Math.round((gatewayRevenue / Math.max(1, totalRevenue)) * 100),
    },
    upi: {
      amount: upiRevenue,
      count: payments.filter((p) => p.method === "UPI").length,
      percentage: Math.round((upiRevenue / Math.max(1, totalRevenue)) * 100),
    },
    cash: {
      amount: cashRevenue,
      count: payments.filter((p) => p.method === "CASH").length,
      percentage: Math.round((cashRevenue / Math.max(1, totalRevenue)) * 100),
    },
  };

  // 6. STATUS BREAKDOWN
  const totalBookingsCount = bookings.length || 1;
  const statusBreakdown = {
    confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
    completed: bookings.filter((b) => b.status === "COMPLETED").length,
    cancelled: bookings.filter((b) => b.status === "CANCELLED").length,
    noShow: bookings.filter((b) => b.status === "NO_SHOW").length,
    cancellationRate: Math.round(
      (bookings.filter((b) => b.status === "CANCELLED").length / totalBookingsCount) * 100
    ),
  };

  return NextResponse.json({
    summary: {
      totalRevenue,
      cashRevenue,
      upiRevenue,
      gatewayRevenue,
      publicBookingsCount: publicBookings.length,
      familyBookingsCount: familyBookings.length,
      totalSwimmers,
      publicSwimmers,
      familySwimmers,
      walkInSwimmers,
      outstandingBalanceTotal,
      refundsCount: refunds.length,
      refundsApprovedTotal,
      netRevenue,
      collectionEfficiency,
      avgBookingValue,
      avgSwimmerValue,
      walkInsCount: walkIns.length,
    },
    dailyTrends,
    maxDayRevenue,
    hourlyDistribution,
    maxSlotSwimmers,
    dayOfWeekTrends,
    maxDayOfWeekRevenue,
    sessionMix,
    paymentMethods,
    statusBreakdown,
    bookings,
    payments: payments.slice(0, 50),
    walkIns: walkIns.slice(0, 50),
    refunds,
  });
}
