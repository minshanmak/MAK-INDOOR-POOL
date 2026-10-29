import { NextRequest, NextResponse } from "next/server";
import { createTemporaryHold } from "@/lib/booking-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingType, date, startTime, endTime, guestCount } = body;

    if (!bookingType || !date || !startTime || !endTime || !guestCount) {
      return NextResponse.json(
        { error: "Missing required booking slot details." },
        { status: 400 }
      );
    }

    const hold = await createTemporaryHold({
      bookingType,
      date,
      startTime,
      endTime,
      guestCount: Number(guestCount),
    });

    return NextResponse.json({
      success: true,
      holdToken: hold.holdToken,
      expiresAt: hold.expiresAt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Could not reserve temporary slot hold." }, { status: 400 });
  }
}
