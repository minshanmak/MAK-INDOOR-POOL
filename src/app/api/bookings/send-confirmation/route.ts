import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notificationService, buildWhatsAppDirectUrl, buildBookingConfirmationText } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, channel = "ALL" } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required." }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (!booking.customerPhone) {
      return NextResponse.json({ error: "Customer phone number is missing." }, { status: 400 });
    }

    const channelsToDispatch: ("WHATSAPP" | "SMS")[] =
      channel === "WHATSAPP" ? ["WHATSAPP"] : channel === "SMS" ? ["SMS"] : ["WHATSAPP", "SMS"];

    const dispatchResults = await notificationService.sendBookingConfirmation(booking.id, channelsToDispatch);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://makindoorpool.com";
    const waText = buildBookingConfirmationText(booking, appUrl);
    const directWaUrl = buildWhatsAppDirectUrl(booking.customerPhone, waText);

    return NextResponse.json({
      success: true,
      message: `Confirmation sent via ${channelsToDispatch.join(" & ")}.`,
      dispatchResults,
      directWaUrl,
    });
  } catch (err: any) {
    console.error("Error sending confirmation:", err);
    return NextResponse.json({ error: err.message || "Failed to dispatch confirmation." }, { status: 500 });
  }
}
