import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getPoolDate, getPoolTime, getPoolHour, getPoolDayBounds } from "@/lib/timezone";
import { timeToMinutes } from "@/lib/booking-engine";

export const dynamic = "force-dynamic";

export interface AdminNotification {
  id: string;
  category: "OPERATIONS" | "SAFETY" | "BOOKING" | "FINANCE" | "COMPLAINT";
  priority: "URGENT" | "IMPORTANT" | "INFO";
  title: string;
  message: string;
  time: string;
  actionUrl: string;
  actionLabel: string;
  createdAt: string;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStr = getPoolDate(now);
  const currentTimeStr = getPoolTime(now);
  const currentHour = getPoolHour(now);
  const currentMinutes = timeToMinutes(currentTimeStr);
  const { startOfDay: todayStart, endOfDay: todayEnd } = getPoolDayBounds(todayStr);

  const notifications: AdminNotification[] = [];

  // 1. Water Quality & Safety Notifications
  const todayReadings = await prisma.waterReading.findMany({
    where: { date: todayStr },
    orderBy: { createdAt: "desc" },
  });
  const latestWater = todayReadings[0] || null;

  // 9:00 AM check
  if (currentHour >= 9 && todayReadings.length === 0) {
    notifications.push({
      id: "water-due-morning",
      category: "SAFETY",
      priority: "URGENT",
      title: "Morning Water Quality Test Due",
      message: "The 9:00 AM chlorine and pH safety check has not been logged for today.",
      time: "9:00 AM IST",
      actionUrl: "/admin/maintenance",
      actionLabel: "Log Water Test",
      createdAt: `${todayStr}T09:00:00+05:30`,
    });
  }

  // 3:00 PM check
  if (currentHour >= 15 && todayReadings.length < 2) {
    notifications.push({
      id: "water-due-afternoon",
      category: "SAFETY",
      priority: "URGENT",
      title: "Afternoon Water Quality Test Due",
      message: "The mandatory 3:00 PM second water safety reading is due.",
      time: "3:00 PM IST",
      actionUrl: "/admin/maintenance",
      actionLabel: "Log Water Test",
      createdAt: `${todayStr}T15:00:00+05:30`,
    });
  }

  // Out of range water alert
  if (latestWater) {
    const isChlorineOutOfRange = latestWater.chlorinePpm < 1.5 || latestWater.chlorinePpm > 3.0;
    const isPhOutOfRange = latestWater.phLevel < 7.2 || latestWater.phLevel > 7.6;
    if (isChlorineOutOfRange || isPhOutOfRange) {
      notifications.push({
        id: `water-out-of-range-${latestWater.id}`,
        category: "SAFETY",
        priority: "URGENT",
        title: "Water Chemistry Out of Safe Range",
        message: `Latest reading at ${latestWater.time}: Chlorine is ${latestWater.chlorinePpm} ppm (Safe: 1.5–3.0), pH is ${latestWater.phLevel} (Safe: 7.2–7.6). Dosing adjustment required.`,
        time: latestWater.time,
        actionUrl: "/admin/maintenance",
        actionLabel: "Review Readings",
        createdAt: latestWater.createdAt.toISOString(),
      });
    }
  }

  // 2. 3:45 PM Public Swimming Turnover Notice
  if (currentTimeStr >= "15:45" && currentTimeStr < "16:00") {
    notifications.push({
      id: "pool-turnover-345pm",
      category: "OPERATIONS",
      priority: "URGENT",
      title: "Clear Pool: Public Session Ending",
      message: "Public swimming ends at 4:00 PM. Please prompt swimmers to exit the pool for 15-minute filtration turnover before private family sessions.",
      time: "3:45 PM IST",
      actionUrl: "/admin",
      actionLabel: "Go to Dashboard",
      createdAt: `${todayStr}T15:45:00+05:30`,
    });
  }

  // 3. Active Overdue Sessions
  const activeWalkIns = await prisma.walkIn.findMany({
    where: { status: "ACTIVE" },
  });

  for (const w of activeWalkIns) {
    const durationMs = (w.durationHours || 1) * 3600000;
    const plannedEndMs = w.checkInTime.getTime() + durationMs;
    const diffMin = Math.round((now.getTime() - plannedEndMs) / 60000);
    // 5-minute grace period
    if (diffMin > 5) {
      notifications.push({
        id: `overdue-walkin-${w.id}`,
        category: "OPERATIONS",
        priority: "URGENT",
        title: `Overstay: Walk-in (${w.visitorCount} Guests)`,
        message: `${w.customerName || "Walk-in guest"} is overdue by ${diffMin} minutes. Extend session or complete check-out.`,
        time: `${diffMin}m overtime`,
        actionUrl: "/admin",
        actionLabel: "Manage Session",
        createdAt: new Date(plannedEndMs).toISOString(),
      });
    }
  }

  const todayBookings = await prisma.booking.findMany({
    where: { bookingDate: todayStr },
  });

  // Checked-in bookings that have exceeded their slot
  for (const b of todayBookings) {
    if (b.checkInStatus === "CHECKED_IN") {
      const endMin = timeToMinutes(b.endTime);
      if (currentMinutes > endMin + 5) {
        const diffMin = currentMinutes - endMin;
        notifications.push({
          id: `overdue-booking-${b.id}`,
          category: "OPERATIONS",
          priority: "URGENT",
          title: `Overstay: ${b.customerName} (${b.guestCount} Guests)`,
          message: `${b.type === "FAMILY" ? "Private" : "Public"} session ended at ${b.endTime}. Overdue by ${diffMin} minutes.`,
          time: `${diffMin}m overtime`,
          actionUrl: "/admin",
          actionLabel: "Check out",
          createdAt: `${todayStr}T${b.endTime}:00+05:30`,
        });
      }
    }
  }

  // 4. Pending Counter Balances on Arrival
  const bookingsWithBalance = todayBookings.filter(
    (b) => b.status === "CONFIRMED" && b.balanceAmount > 0 && b.checkInStatus !== "CHECKED_OUT"
  );
  for (const b of bookingsWithBalance) {
    const isToday = b.bookingDate === todayStr;
    const startMin = timeToMinutes(b.startTime);
    // Flag if session starts within 60 mins or is ongoing
    if (isToday && currentMinutes >= startMin - 60) {
      notifications.push({
        id: `balance-due-${b.id}`,
        category: "FINANCE",
        priority: "IMPORTANT",
        title: `Counter Balance Due: ${b.customerName}`,
        message: `Session ${b.startTime}–${b.endTime}: ₹${b.balanceAmount} balance due on arrival (Total ₹${b.totalAmount}, Advance ₹${b.totalPaid} paid).`,
        time: b.startTime,
        actionUrl: `/admin/scan?code=${encodeURIComponent(b.id)}`,
        actionLabel: "Collect & Admit",
        createdAt: b.createdAt.toISOString(),
      });
    }
  }

  // 5. Upcoming Private Session (Turnover Prep within 30 min)
  const upcomingPrivateBookings = todayBookings.filter(
    (b) => b.type === "FAMILY" && b.status === "CONFIRMED" && b.checkInStatus === "PENDING"
  );
  for (const b of upcomingPrivateBookings) {
    const startMin = timeToMinutes(b.startTime);
    if (startMin > currentMinutes && startMin - currentMinutes <= 30) {
      notifications.push({
        id: `upcoming-private-${b.id}`,
        category: "BOOKING",
        priority: "IMPORTANT",
        title: `Upcoming Private Session: ${b.customerName}`,
        message: `Exclusive family booking for ${b.guestCount} guests starts in ${startMin - currentMinutes} minutes at ${b.startTime}. Ensure 15-minute cleaning buffer is complete.`,
        time: `Starts in ${startMin - currentMinutes}m`,
        actionUrl: "/admin",
        actionLabel: "View Timeline",
        createdAt: b.createdAt.toISOString(),
      });
    }
  }

  // 6. Pending Cancellation & Refund Requests
  const pendingRefunds = await prisma.refund.findMany({
    where: { status: "PENDING" },
    include: { booking: true },
    take: 5,
  });
  for (const r of pendingRefunds) {
    notifications.push({
      id: `refund-pending-${r.id}`,
      category: "FINANCE",
      priority: "IMPORTANT",
      title: `Refund Pending Review: ₹${r.requestedAmount}`,
      message: `Booking ${r.bookingId} (${r.booking?.customerName || "Customer"}): "${r.reason}". Awaiting management approval.`,
      time: "Pending Approval",
      actionUrl: "/admin/cancellations",
      actionLabel: "Review Refund",
      createdAt: r.createdAt.toISOString(),
    });
  }

  const pendingCancellations = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      cancellationReason: { not: null },
    },
    take: 5,
  });
  for (const b of pendingCancellations) {
    notifications.push({
      id: `cancel-request-${b.id}`,
      category: "BOOKING",
      priority: "IMPORTANT",
      title: `Cancellation Request: ${b.customerName}`,
      message: `Pass ${b.id} for ${b.bookingDate} (${b.startTime}). Reason: "${b.cancellationReason}".`,
      time: b.bookingDate,
      actionUrl: "/admin/cancellations",
      actionLabel: "Manage Booking",
      createdAt: b.updatedAt.toISOString(),
    });
  }

  // 7. Open Complaints / Customer Feedback
  const openComplaints = await prisma.complaint.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  for (const c of openComplaints) {
    notifications.push({
      id: `complaint-open-${c.id}`,
      category: "COMPLAINT",
      priority: "IMPORTANT",
      title: `Open Customer Complaint (${c.ticketNumber})`,
      message: `Customer ${c.customerName}: "${c.description.slice(0, 80)}${c.description.length > 80 ? "..." : ""}"`,
      time: c.createdAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }),
      actionUrl: "/admin/complaints",
      actionLabel: "View Ticket",
      createdAt: c.createdAt.toISOString(),
    });
  }

  // 8. End-of-Day Closing (After 10:00 PM if not yet submitted)
  if (currentHour >= 22) {
    const todayClosing = await prisma.endOfDayClosing.findUnique({
      where: { date: todayStr },
    });
    if (!todayClosing || todayClosing.status === "DRAFT") {
      notifications.push({
        id: `closing-pending-${todayStr}`,
        category: "FINANCE",
        priority: "URGENT",
        title: "Daily Register Closing Pending",
        message: "Operating hours end at 11:00 PM. Front-desk blind cash reconciliation and daily closing register must be balanced.",
        time: "EOD Close",
        actionUrl: "/admin/closing",
        actionLabel: "Balance Register",
        createdAt: `${todayStr}T22:00:00+05:30`,
      });
    }
  }

  // Sort: URGENT first, then IMPORTANT, then INFO
  const priorityOrder = { URGENT: 0, IMPORTANT: 1, INFO: 2 };
  notifications.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return NextResponse.json({
    unreadCount: notifications.length,
    urgentCount: notifications.filter((n) => n.priority === "URGENT").length,
    notifications,
  });
}
