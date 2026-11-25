import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { getPoolDate, getPoolTime } from "@/lib/timezone";
import { checkAvailability, timeToMinutes } from "@/lib/booking-engine";
import { calculateBookingPrice } from "@/lib/pricing";
import { notificationService } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: any = {};
  if (date) where.bookingDate = date;
  if (type && type !== "ALL") where.type = type;
  if (status && status !== "ALL") where.status = status;
  if (search) {
    where.OR = [
      { id: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search, mode: "insensitive" } },
      { customerPlace: { contains: search, mode: "insensitive" } },
      { startTime: { contains: search, mode: "insensitive" } },
    ];
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: [{ bookingDate: "desc" }, { startTime: "asc" }],
    include: {
      payments: true,
      receipts: true,
      refunds: true,
    },
    take: 100,
  });

  return NextResponse.json({ bookings });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action, bookingId, paymentAmount, paymentMethod = "CASH", transactionRef, notes } = body;

  if (action === "COLLECT_BALANCE") {
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.PAYMENTS_CREATE)) {
      return NextResponse.json({ error: "Forbidden: You cannot collect payments" }, { status: 403 });
    }

    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid collection amount" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.findUnique({
        where: { id: bookingId },
      });
      if (!b) throw new Error("Booking not found.");

      const newTotalPaid = Math.round((b.totalPaid + amount) * 100) / 100;
      const newBalance = Math.max(0, Math.round((b.totalAmount - newTotalPaid) * 100) / 100);
      const newStatus = newBalance <= 0 ? "PAID" : "PARTIAL";

      const updatedBooking = await tx.booking.update({
        where: { id: b.id },
        data: {
          totalPaid: newTotalPaid,
          balanceAmount: newBalance,
          paymentStatus: newStatus,
        },
      });

      // Create Payment
      const p = await tx.payment.create({
        data: {
          bookingId: b.id,
          amount,
          method: paymentMethod as "CASH" | "UPI" | "GATEWAY",
          status: "SUCCESS",
          transactionRef: transactionRef || `COUNTER-COLL-${Date.now()}`,
          recordedByUserId: user.userId,
          notes: notes || "Counter balance payment",
        },
      });

      // Create Receipt
      const cleanDate = b.bookingDate.replace(/-/g, "");
      const recCount = await tx.receipt.count();
      await tx.receipt.create({
        data: {
          receiptNumber: `REC-${cleanDate}-${String(recCount + 1).padStart(4, "0")}`,
          bookingId: b.id,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          totalAmount: b.totalAmount,
          paidAmount: amount,
          balanceAmount: newBalance,
          paymentMethod,
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: "PAYMENT",
          entityId: p.id,
          action: "CREATE",
          performedByUserId: user.userId,
          userRole: user.role,
          details: `Collected balance ₹${amount} via ${paymentMethod} for booking ${b.id}. Remaining balance: ₹${newBalance}`,
        },
      });

      return updatedBooking;
    });

    return NextResponse.json({ success: true, booking: updated });
  }

  if (action === "CHECK_IN_ONLINE") {
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    const b = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!b) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (b.status === "CANCELLED") {
      return NextResponse.json({ error: "Cannot admit: Booking has been cancelled." }, { status: 400 });
    }

    const todayStr = getPoolDate(new Date());
    if (b.bookingDate !== todayStr) {
      const isPast = b.bookingDate < todayStr;
      return NextResponse.json(
        {
          error: `Cannot admit: Booking is for ${b.bookingDate} (${isPast ? "Past Date" : "Future Date"}), not today (${todayStr}). Please reschedule or update the session date to today first.`,
        },
        { status: 400 }
      );
    }

    const checkInTimeStr = getPoolTime(new Date());
    const existingNotes = b.notes ? `${b.notes} | ` : "";
    const updatedNotes = `${existingNotes}Checked in at ${checkInTimeStr}`;

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        notes: updatedNotes,
        checkInStatus: "CHECKED_IN",
        admittedAt: new Date(),
        admittedByUserId: user.userId,
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: "BOOKING",
        entityId: b.id,
        action: "UPDATE",
        performedByUserId: user.userId,
        userRole: user.role,
        details: `Online guest for booking ${b.id} arrived and checked in at ${checkInTimeStr}.`,
      },
    });

    return NextResponse.json({ success: true, booking: updated });
  }

  if (action === "UPDATE_BOOKING") {
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.BOOKINGS_EDIT)) {
      return NextResponse.json({ error: "Forbidden: You lack permission to edit bookings" }, { status: 403 });
    }

    const {
      bookingId,
      bookingDate: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      guestCount: rawGuestCount,
      customerName: newName,
      customerPhone: newPhone,
      customerPlace: newPlace,
      notes: newNotes,
      staffReason,
    } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json({ error: "Cancelled bookings cannot be modified." }, { status: 400 });
    }

    const targetDate = newDate || booking.bookingDate;
    const targetStartTime = newStartTime || booking.startTime;
    const targetEndTime = newEndTime || booking.endTime;
    const targetGuestCount = rawGuestCount ? Number(rawGuestCount) : booking.guestCount;
    const targetName = newName !== undefined ? newName.trim() : booking.customerName;
    const targetPhone = newPhone !== undefined ? newPhone.trim() : booking.customerPhone;
    const targetPlace = newPlace !== undefined ? newPlace.trim() : booking.customerPlace;
    const targetNotes = newNotes !== undefined ? newNotes : booking.notes;

    if (targetGuestCount < 1) {
      return NextResponse.json({ error: "Guest count must be at least 1." }, { status: 400 });
    }

    // Check slot collision if date or time changed
    const slotChanged =
      targetDate !== booking.bookingDate ||
      targetStartTime !== booking.startTime ||
      targetEndTime !== booking.endTime;

    if (slotChanged) {
      const avail = await checkAvailability({
        bookingType: booking.type as any,
        date: targetDate,
        startTime: targetStartTime,
        endTime: targetEndTime,
        guestCount: targetGuestCount,
        excludeBookingId: booking.id,
      });

      if (!avail.available) {
        return NextResponse.json(
          { error: avail.reason || "The selected time slot is not available." },
          { status: 400 }
        );
      }
    }

    const startMin = timeToMinutes(targetStartTime);
    const endMin = timeToMinutes(targetEndTime);
    const durationHours = Math.max(1, (endMin - startMin) / 60);

    const settings = await prisma.poolSetting.findUnique({ where: { id: "singleton_settings" } });
    const pricing = calculateBookingPrice(
      booking.type as any,
      durationHours,
      targetGuestCount,
      {
        defaultPublicRate: settings?.defaultPublicRate || 150,
        defaultFamilyBaseRate: settings?.defaultFamilyBaseRate || 1500,
        familyBaseGuests: settings?.familyBaseGuests || 12,
        familyExtraRate: settings?.familyExtraRate || 100,
        familyAdvanceAmount: settings?.familyAdvanceAmount || 750,
      }
    );

    const newTotalAmount = pricing.totalPrice;
    const newBalance = Math.max(0, Math.round((newTotalAmount - booking.totalPaid) * 100) / 100);
    const newPaymentStatus = newBalance <= 0 ? "PAID" : (booking.totalPaid > 0 ? "PARTIAL" : "UNPAID");

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id: booking.id },
        data: {
          bookingDate: targetDate,
          startTime: targetStartTime,
          endTime: targetEndTime,
          durationHours,
          guestCount: targetGuestCount,
          customerName: targetName,
          customerPhone: targetPhone,
          customerPlace: targetPlace,
          notes: targetNotes,
          totalAmount: newTotalAmount,
          balanceAmount: newBalance,
          paymentStatus: newPaymentStatus,
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: "BOOKING",
          entityId: b.id,
          action: "UPDATE",
          performedByUserId: user.userId,
          userRole: user.role,
          details: `Staff updated booking ${b.id}: Date ${booking.bookingDate}->${targetDate}, Slot ${booking.startTime}-${booking.endTime}->${targetStartTime}-${targetEndTime}, Guests ${booking.guestCount}->${targetGuestCount}. Total: ₹${newTotalAmount}, Balance: ₹${newBalance}. ${staffReason ? `Reason: ${staffReason}` : ""}`,
        },
      });

      return b;
    });

    // Notify customer in background with updated pass
    try {
      await notificationService.sendBookingConfirmation(updated.id);
    } catch (notifErr) {
      console.error("Failed to dispatch updated confirmation:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: `Booking ${updated.id} updated successfully.`,
      booking: updated,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
