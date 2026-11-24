import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPoolDateTime } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "Both mobile number and verification code are required." },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const last10 = cleanPhone.slice(-10);
    const cleanOtp = otp.toString().trim();

    // Find OTP record
    const otpRecord = await prisma.otpVerification.findUnique({
      where: { phone: last10 },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "No verification code requested for this number. Please request an OTP first." },
        { status: 400 }
      );
    }

    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new verification code." },
        { status: 429 }
      );
    }

    if (otpRecord.code !== cleanOtp) {
      await prisma.otpVerification.update({
        where: { phone: last10 },
        data: { attempts: { increment: 1 } },
      });

      return NextResponse.json(
        { error: "Invalid verification code. Please check and try again." },
        { status: 400 }
      );
    }

    // OTP verified successfully - consume OTP record
    await prisma.otpVerification.delete({
      where: { phone: last10 },
    }).catch(() => {});

    // Fetch pool settings for policy rules
    const settings = await prisma.poolSetting.findUnique({
      where: { id: "singleton_settings" },
    });

    // Fetch all bookings for this customer
    const rawBookings = await prisma.booking.findMany({
      where: {
        customerPhone: { contains: last10 },
      },
      include: {
        payments: { orderBy: { createdAt: "desc" } },
        receipts: { orderBy: { issuedAt: "desc" } },
        refunds: true,
      },
      orderBy: [{ bookingDate: "desc" }, { startTime: "asc" }],
    });

    if (rawBookings.length === 0) {
      return NextResponse.json(
        { error: "No bookings found matching this mobile number." },
        { status: 404 }
      );
    }

    // Format each booking with policies
    const bookings = rawBookings.map((b) => {
      const bookingDateTime = getPoolDateTime(b.bookingDate, b.startTime);
      const hoursUntilBooking = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

      const canReschedule =
        b.status === "CONFIRMED" &&
        hoursUntilBooking >= (settings?.rescheduleCutoffHours || 6);

      const canCancel =
        b.status === "CONFIRMED" &&
        hoursUntilBooking >= (settings?.cancellationCutoffHours || 12);

      return {
        booking: {
          id: b.id,
          type: b.type,
          status: b.status,
          bookingDate: b.bookingDate,
          startTime: b.startTime,
          endTime: b.endTime,
          durationHours: b.durationHours,
          guestCount: b.guestCount,
          totalAmount: b.totalAmount,
          advanceRequired: b.advanceRequired,
          totalPaid: b.totalPaid,
          balanceAmount: b.balanceAmount,
          paymentStatus: b.paymentStatus,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          notes: b.notes,
          cancellationReason: b.cancellationReason,
          createdAt: b.createdAt,
        },
        payments: b.payments,
        receipts: b.receipts,
        refunds: b.refunds,
        policy: {
          canReschedule,
          canCancel,
          hoursUntilBooking: Math.round(hoursUntilBooking * 10) / 10,
          rescheduleCutoffHours: settings?.rescheduleCutoffHours || 6,
          cancellationCutoffHours: settings?.cancellationCutoffHours || 12,
        },
      };
    });

    return NextResponse.json({
      success: true,
      phone: last10,
      bookings,
    });
  } catch (err: any) {
    console.error("verify-otp error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to verify code." },
      { status: 500 }
    );
  }
}
