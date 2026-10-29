import { NextRequest, NextResponse } from "next/server";
import { checkAvailability } from "@/lib/booking-engine";
import { calculateBookingPrice, DEFAULT_PRICING } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingType = (searchParams.get("type") || "PUBLIC").toUpperCase() as "PUBLIC" | "FAMILY";
    const date = searchParams.get("date");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");
    const guestCount = parseInt(searchParams.get("guests") || "1", 10);

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required query parameters: date, startTime, endTime" },
        { status: 400 }
      );
    }

    const avail = await checkAvailability({
      bookingType,
      date,
      startTime,
      endTime,
      guestCount,
    });

    const settings = await prisma.poolSetting.findUnique({
      where: { id: "singleton_settings" },
    });

    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const durationHours = (eh * 60 + (em || 0) - (sh * 60 + (sm || 0))) / 60;

    let pricing = null;
    if (durationHours > 0 && guestCount > 0) {
      pricing = calculateBookingPrice(bookingType, durationHours, guestCount, {
        defaultPublicRate: settings?.defaultPublicRate || DEFAULT_PRICING.defaultPublicRate,
        defaultFamilyBaseRate: settings?.defaultFamilyBaseRate || DEFAULT_PRICING.defaultFamilyBaseRate,
        familyBaseGuests: settings?.familyBaseGuests || DEFAULT_PRICING.familyBaseGuests,
        familyExtraRate: settings?.familyExtraRate || DEFAULT_PRICING.familyExtraRate,
        familyAdvanceAmount: settings?.familyAdvanceAmount || DEFAULT_PRICING.familyAdvanceAmount,
      });
    }

    return NextResponse.json({
      ...avail,
      pricing,
    });
  } catch (err: any) {
    console.error("Availability error:", err);
    return NextResponse.json({ error: err.message || "Failed to check availability." }, { status: 500 });
  }
}
