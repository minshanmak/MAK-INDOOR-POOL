import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, phone, reason } = await req.json();

    if (!bookingId || !phone || !reason) {
      return NextResponse.json(
        { error: "Booking ID, registered phone number, and cancellation reason are required." },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json({ error: "Booking is already cancelled." }, { status: 400 });
    }

    // IDOR verification
    const normalizedBookingPhone = booking.customerPhone.replace(/\D/g, "");
    const normalizedQueryPhone = phone.replace(/\D/g, "");
    if (!normalizedBookingPhone.endsWith(normalizedQueryPhone) && !normalizedQueryPhone.endsWith(normalizedBookingPhone)) {
      return NextResponse.json({ error: "Authorization failed for this booking." }, { status: 403 });
    }

    // Note: The slot remains reserved until authorized cancellation approval!
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        cancellationReason: `[REQUESTED BY CUSTOMER]: ${reason}`,
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: "BOOKING",
        entityId: booking.id,
        action: "UPDATE",
        performedByUserId: null,
        userRole: "CUSTOMER",
        details: `Customer requested cancellation with reason: "${reason}". Slot remains locked pending owner approval.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cancellation request received. Our management team will review and contact you regarding the refund policy.",
      booking: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to submit cancellation request." }, { status: 500 });
  }
}

