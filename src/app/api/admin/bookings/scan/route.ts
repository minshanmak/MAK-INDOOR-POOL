import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { getPoolDate, getPoolTime } from "@/lib/timezone";
import { timeToMinutes } from "@/lib/booking-engine";

export const dynamic = "force-dynamic";

/**
 * GET: Scan & Verify Booking Pass
 * Accepts a QR token, booking ID, full scanned URL, or customer phone.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let rawCode = searchParams.get("code")?.trim() || "";

  if (!rawCode) {
    return NextResponse.json({ error: "Scan code or booking ID is required." }, { status: 400 });
  }

  // If staff scanned a full URL (e.g. from standard phone camera)
  if (rawCode.includes("http://") || rawCode.includes("https://")) {
    try {
      const parsedUrl = new URL(rawCode);
      rawCode = parsedUrl.searchParams.get("code") || parsedUrl.searchParams.get("ref") || rawCode;
    } catch {
      // Continue with rawCode
    }
  }

  // Find booking by qrToken OR id OR phone number
  const booking = await prisma.booking.findFirst({
    where: {
      OR: [
        { qrToken: rawCode },
        { id: rawCode },
        { id: { endsWith: rawCode } },
        { customerPhone: rawCode },
        { customerPhone: { endsWith: rawCode } },
      ],
    },
    include: {
      customer: true,
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!booking) {
    return NextResponse.json(
      { error: "Invalid Pass: No booking found matching this code." },
      { status: 404 }
    );
  }

  const now = new Date();
  const todayStr = getPoolDate(now);
  const currentTimeStr = getPoolTime(now);
  const currentMinutes = timeToMinutes(currentTimeStr);
  const startMinutes = timeToMinutes(booking.startTime);
  const endMinutes = timeToMinutes(booking.endTime);

  const isToday = booking.bookingDate === todayStr;

  let timingStatus: "ON_TIME" | "EARLY" | "LATE" | "DIFFERENT_DATE" = "ON_TIME";
  let timingMessage = "Scheduled for today";

  if (!isToday) {
    timingStatus = "DIFFERENT_DATE";
    timingMessage = `Pass is for ${booking.bookingDate} (Not today)`;
  } else if (currentMinutes < startMinutes - 45) {
    timingStatus = "EARLY";
    timingMessage = `Arrived early. Slot starts at ${booking.startTime}`;
  } else if (currentMinutes > endMinutes + 30) {
    timingStatus = "LATE";
    timingMessage = `Slot ended at ${booking.endTime}`;
  } else {
    timingStatus = "ON_TIME";
    timingMessage = `Session Active (${booking.startTime} – ${booking.endTime})`;
  }

  return NextResponse.json({
    valid: true,
    booking: {
      id: booking.id,
      qrToken: booking.qrToken,
      type: booking.type,
      status: booking.status,
      checkInStatus: booking.checkInStatus,
      admittedAt: booking.admittedAt,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      durationHours: booking.durationHours,
      guestCount: booking.guestCount,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerPlace: booking.customerPlace,
      totalAmount: booking.totalAmount,
      totalPaid: booking.totalPaid,
      balanceAmount: booking.balanceAmount,
      paymentStatus: booking.paymentStatus,
    },
    isToday,
    timingStatus,
    timingMessage,
    alreadyAdmitted: booking.checkInStatus === "CHECKED_IN",
  });
}

/**
 * POST: Admit Customer & Collect Pending Balance
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (
    !hasPermission(user.role, user.permissions, PERMISSIONS.WALKIN_MANAGE) &&
    !hasPermission(user.role, user.permissions, PERMISSIONS.BOOKINGS_EDIT)
  ) {
    return NextResponse.json({ error: "Forbidden: Admission permission required" }, { status: 403 });
  }

  const body = await req.json();
  const { bookingId, paymentMethod = "CASH", collectedAmount = 0 } = body;

  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is required." }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (booking.status === "CANCELLED") {
    return NextResponse.json({ error: "Cannot admit: Booking has been cancelled." }, { status: 400 });
  }

  if (booking.checkInStatus === "CHECKED_IN") {
    return NextResponse.json(
      { error: `Customer was already admitted at ${booking.admittedAt?.toLocaleTimeString() || "earlier"}.` },
      { status: 400 }
    );
  }

  const collected = Math.max(0, Number(collectedAmount) || 0);

  const updatedBooking = await prisma.$transaction(async (tx) => {
    // Record balance payment if collected
    if (collected > 0) {
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: collected,
          method: paymentMethod as "CASH" | "UPI",
          status: "SUCCESS",
          transactionRef: `ADM-COLLECT-${Date.now()}`,
          recordedByUserId: user.userId,
        },
      });
    }

    const newTotalPaid = Math.round((booking.totalPaid + collected) * 100) / 100;
    const newBalance = Math.max(0, Math.round((booking.balanceAmount - collected) * 100) / 100);
    const newPaymentStatus = newBalance <= 0 ? "PAID" : "PARTIAL";

    const updated = await tx.booking.update({
      where: { id: booking.id },
      data: {
        checkInStatus: "CHECKED_IN",
        admittedAt: new Date(),
        admittedByUserId: user.userId,
        totalPaid: newTotalPaid,
        balanceAmount: newBalance,
        paymentStatus: newPaymentStatus,
      },
    });

    await tx.auditLog.create({
      data: {
        entityType: "BOOKING",
        entityId: booking.id,
        action: "UPDATE",
        performedByUserId: user.userId,
        userRole: user.role,
        details: `Booking ${booking.id} admitted for ${booking.guestCount} guests.${
          collected > 0 ? ` Collected balance ₹${collected} via ${paymentMethod}.` : ""
        }`,
      },
    });

    return updated;
  });

  return NextResponse.json({
    success: true,
    message: `${updatedBooking.customerName} (${updatedBooking.guestCount} Guests) admitted successfully!`,
    booking: updatedBooking,
  });
}
