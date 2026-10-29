import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAvailability, timeToMinutes } from "@/lib/booking-engine";
import { calculateBookingPrice } from "@/lib/pricing";
import { notificationService } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, phone, newDate, newStartTime, newEndTime } = await req.json();

    if (!bookingId || !phone || !newDate || !newStartTime || !newEndTime) {
      return NextResponse.json(
        { error: "Missing required rescheduling details." },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    // IDOR verification
    const normalizedBookingPhone = booking.customerPhone.replace(/\D/g, "");
    const normalizedQueryPhone = phone.replace(/\D/g, "");
    if (!normalizedBookingPhone.endsWith(normalizedQueryPhone) && !normalizedQueryPhone.endsWith(normalizedBookingPhone)) {
      return NextResponse.json({ error: "Authorization failed for this booking." }, { status: 403 });
    }

    // Cutoff check
    const settings = await prisma.poolSetting.findUnique({
      where: { id: "singleton_settings" },
    });
    const bookingDateTime = new Date(`${booking.bookingDate}T${booking.startTime}:00`);
    const hoursUntilBooking = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    const cutoff = settings?.rescheduleCutoffHours || 6;

    if (hoursUntilBooking < cutoff) {
      return NextResponse.json(
        { error: `Rescheduling is allowed only up to ${cutoff} hours before booking start time. (Current: ${Math.round(hoursUntilBooking * 10) / 10}h remaining)` },
        { status: 400 }
      );
    }

    // Check availability of new slot
    const avail = await checkAvailability({
      bookingType: booking.type as any,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      guestCount: booking.guestCount,
    });

    if (!avail.available) {
      return NextResponse.json({ error: avail.reason || "The requested new time slot is not available." }, { status: 400 });
    }

    const startMin = timeToMinutes(newStartTime);
    const endMin = timeToMinutes(newEndTime);
    const durationHours = (endMin - startMin) / 60;

    // Recalculate price if duration changed
    const pricing = calculateBookingPrice(
      booking.type as any,
      durationHours,
      booking.guestCount,
      {
        defaultPublicRate: settings?.defaultPublicRate || 150,
        defaultFamilyBaseRate: settings?.defaultFamilyBaseRate || 1500,
        familyBaseGuests: settings?.familyBaseGuests || 12,
        familyExtraRate: settings?.familyExtraRate || 100,
        familyAdvanceAmount: settings?.familyAdvanceAmount || 750,
      }
    );

    const newBalance = Math.max(0, Math.round((pricing.totalPrice - booking.totalPaid) * 100) / 100);
    const newPaymentStatus = newBalance <= 0 ? "PAID" : (booking.totalPaid > 0 ? "PARTIAL" : "UNPAID");

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id: booking.id },
        data: {
          bookingDate: newDate,
          startTime: newStartTime,
          endTime: newEndTime,
          durationHours,
          basePrice: pricing.basePrice,
          extraGuestPrice: pricing.extraGuestPrice,
          totalAmount: pricing.totalPrice,
          balanceAmount: newBalance,
          paymentStatus: newPaymentStatus,
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: "BOOKING",
          entityId: b.id,
          action: "UPDATE",
          performedByUserId: null,
          userRole: "CUSTOMER",
          details: `Rescheduled from ${booking.bookingDate} (${booking.startTime}-${booking.endTime}) to ${newDate} (${newStartTime}-${newEndTime}). New total: ₹${pricing.totalPrice}, Balance: ₹${newBalance}`,
        },
      });

      return b;
    });

    // Re-schedule automated notification reminders for the updated date/time
    await notificationService.cancelObsoleteReminders(booking.id);
    await notificationService.scheduleBookingReminders(updated.id);

    return NextResponse.json({
      success: true,
      message: "Booking rescheduled successfully.",
      booking: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to reschedule booking." }, { status: 500 });
  }
}

