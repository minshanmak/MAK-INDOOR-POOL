import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAppleWalletPass } from "@/lib/wallet/apple-pass";

export const dynamic = "force-dynamic";

/**
 * Apple Wallet Web Service: GET latest version of a pass
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { passTypeIdentifier: string; serialNumber: string } }
) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const serialNumber = params.serialNumber;

    const booking = await prisma.booking.findUnique({
      where: { id: serialNumber },
    });

    if (!booking) {
      return new NextResponse(null, { status: 404 });
    }

    // Check if pass was modified or cancelled
    if (booking.status === "CANCELLED") {
      return new NextResponse(null, { status: 410 }); // Gone
    }

    const host = req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
    const origin = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;

    const result = await generateAppleWalletPass(
      {
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
      },
      origin
    );

    if (!result.success || !result.pkpassBuffer) {
      return new NextResponse(null, { status: 500 });
    }

    return new NextResponse(new Uint8Array(result.pkpassBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Last-Modified": booking.createdAt.toUTCString(),
      },
    });
  } catch (err) {
    return new NextResponse(null, { status: 500 });
  }
}
