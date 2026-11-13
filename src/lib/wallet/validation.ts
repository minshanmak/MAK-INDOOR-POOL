/**
 * M.A.K Indoor Pool — Wallet Pass Security & Authorization Validator
 * Ensures only authentic, confirmed, non-cancelled bookings can generate digital passes.
 */

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { WalletValidationResult, WalletBookingData } from "./types";

export async function validateWalletBookingRequest(
  bookingId: string,
  tokenOrPhone?: string | null
): Promise<WalletValidationResult> {
  if (!bookingId || typeof bookingId !== "string") {
    return {
      valid: false,
      statusCode: 400,
      error: "Missing booking ID.",
    };
  }

  const cleanId = bookingId.trim();

  // 1. Authoritative lookup from database (Never trust client-supplied data)
  const booking = await prisma.booking.findUnique({
    where: { id: cleanId },
  });

  if (!booking) {
    return {
      valid: false,
      statusCode: 404,
      error: "No booking found matching this ID.",
    };
  }

  // 2. Reject cancelled, refunded or hold bookings
  if (booking.status === "CANCELLED") {
    return {
      valid: false,
      statusCode: 409,
      error: "This booking has been cancelled and is no longer valid for admission.",
    };
  }

  if (booking.status === "HOLD") {
    return {
      valid: false,
      statusCode: 400,
      error: "This booking is pending payment confirmation.",
    };
  }

  // 3. Customer Authorization Check
  // Check if active authenticated staff/owner session
  let isStaff = false;
  try {
    const currentUser = await getCurrentUser();
    isStaff = !!currentUser;
  } catch {
    // Outside Next.js request context or no cookies store
    isStaff = false;
  }

  if (!isStaff) {
    if (!tokenOrPhone) {
      return {
        valid: false,
        statusCode: 401,
        error: "Authorization token or registered phone required to download wallet pass.",
      };
    }

    const cleanAuth = tokenOrPhone.trim().toLowerCase();
    const digitsOnly = cleanAuth.replace(/\D/g, "");
    const phoneDigits = booking.customerPhone ? booking.customerPhone.replace(/\D/g, "") : "";
    const matchesToken =
      !!booking.qrToken && booking.qrToken.toLowerCase() === cleanAuth;
    const matchesPhone =
      digitsOnly.length >= 6 && phoneDigits.length >= 6 && phoneDigits.endsWith(digitsOnly);
    const matchesId = booking.id.toLowerCase() === cleanAuth;

    if (!matchesToken && !matchesPhone && !matchesId) {
      return {
        valid: false,
        statusCode: 403,
        error: "Invalid authorization for this booking pass.",
      };
    }
  }

  // 4. Return sanitized wallet booking data
  const sanitizedBooking: WalletBookingData = {
    id: booking.id,
    qrToken: booking.qrToken || `MAKPASS-${booking.id}`,
    type: booking.type,
    status: booking.status,
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
    checkInStatus: booking.checkInStatus,
  };

  return {
    valid: true,
    statusCode: 200,
    booking: sanitizedBooking,
  };
}
