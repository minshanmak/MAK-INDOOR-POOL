import { NextRequest, NextResponse } from "next/server";
import { confirmBooking } from "@/lib/booking-engine";
import { getCurrentUser } from "@/lib/session";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      holdToken,
      bookingType,
      date,
      startTime,
      endTime,
      guestCount,
      customerName,
      customerPhone,
      customerEmail,
      notes,
      isStaffCreated,
      paymentMethod,
      initialAmount,
      transactionRef,
    } = body;

    if (!bookingType || !date || !startTime || !endTime || !guestCount || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: "Please fill in all required customer and booking details." },
        { status: 400 }
      );
    }

    const session = await getCurrentUser();
    let staffUserId: string | undefined = undefined;

    if (isStaffCreated) {
      if (!session) {
        return NextResponse.json({ error: "Staff authentication required." }, { status: 401 });
      }
      if (!hasPermission(session.role, session.permissions, PERMISSIONS.BOOKINGS_CREATE)) {
        return NextResponse.json({ error: "You lack permission to create staff bookings." }, { status: 403 });
      }
      staffUserId = session.userId;
    }

    let initialPayment = undefined;
    if (initialAmount && Number(initialAmount) > 0) {
      initialPayment = {
        amount: Number(initialAmount),
        method: (paymentMethod || (isStaffCreated ? "CASH" : "GATEWAY")) as "CASH" | "UPI" | "GATEWAY",
        transactionRef: transactionRef || (isStaffCreated ? `STAFF-COLL-${Date.now()}` : undefined),
      };
    }

    const booking = await confirmBooking({
      holdToken,
      bookingType,
      date,
      startTime,
      endTime,
      guestCount: Number(guestCount),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail ? customerEmail.trim() : undefined,
      notes,
      isStaffCreated: !!isStaffCreated,
      createdByUserId: staffUserId,
      initialPayment,
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      booking,
    });
  } catch (err: any) {
    console.error("Booking creation error:", err);
    return NextResponse.json({ error: err.message || "Failed to confirm booking." }, { status: 400 });
  }
}
