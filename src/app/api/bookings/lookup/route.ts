import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId")?.trim();
    const phone = searchParams.get("phone")?.trim();

    if (!bookingId || !phone) {
      return NextResponse.json(
        { error: "Both Booking Reference ID and registered Phone Number are required for verification." },
        { status: 400 }
      );
    }

    // Clean phone input for robust matching (e.g. +91 9800011111 vs 9800011111)
    const normalizedQueryPhone = phone.replace(/\D/g, "");

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
        },
        receipts: {
          orderBy: { issuedAt: "desc" },
        },
        refunds: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "No booking found with this reference ID." }, { status: 404 });
    }

    const normalizedBookingPhone = booking.customerPhone.replace(/\D/g, "");
    if (!normalizedBookingPhone.endsWith(normalizedQueryPhone) && !normalizedQueryPhone.endsWith(normalizedBookingPhone)) {
      // Insecure Direct Object Reference (IDOR) protection: phone mismatch
      return NextResponse.json(
        { error: "Verification failed. The phone number does not match this booking record." },
        { status: 403 }
      );
    }

    const settings = await prisma.poolSetting.findUnique({
      where: { id: "singleton_settings" },
    });

    // Check reschedule eligibility
    const bookingDateTime = new Date(`${booking.bookingDate}T${booking.startTime}:00`);
    const hoursUntilBooking = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    const canReschedule =
      booking.status === "CONFIRMED" &&
      hoursUntilBooking >= (settings?.rescheduleCutoffHours || 6);

    const canCancel =
      booking.status === "CONFIRMED" &&
      hoursUntilBooking >= (settings?.cancellationCutoffHours || 12);

    return NextResponse.json({
      booking: {
        id: booking.id,
        type: booking.type,
        status: booking.status,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        durationHours: booking.durationHours,
        guestCount: booking.guestCount,
        totalAmount: booking.totalAmount,
        advanceRequired: booking.advanceRequired,
        totalPaid: booking.totalPaid,
        balanceAmount: booking.balanceAmount,
        paymentStatus: booking.paymentStatus,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        notes: booking.notes,
        cancellationReason: booking.cancellationReason,
        createdAt: booking.createdAt,
      },
      payments: booking.payments,
      receipts: booking.receipts,
      refunds: booking.refunds,
      policy: {
        canReschedule,
        canCancel,
        hoursUntilBooking: Math.round(hoursUntilBooking * 10) / 10,
        rescheduleCutoffHours: settings?.rescheduleCutoffHours || 6,
        cancellationCutoffHours: settings?.cancellationCutoffHours || 12,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to lookup booking." }, { status: 500 });
  }
}
