import { NextRequest, NextResponse } from "next/server";
import { validateWalletBookingRequest } from "@/lib/wallet/validation";
import { generateAppleWalletPass } from "@/lib/wallet/apple-pass";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId") || searchParams.get("id") || "";
    const token = searchParams.get("token") || searchParams.get("phone") || searchParams.get("ref") || "";

    const validation = await validateWalletBookingRequest(bookingId, token);
    if (!validation.valid || !validation.booking) {
      return NextResponse.json(
        { error: validation.error || "Pass request unauthorized or invalid." },
        { status: validation.statusCode }
      );
    }

    const host = req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
    const origin = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;

    const result = await generateAppleWalletPass(validation.booking, origin);

    if (!result.success || !result.pkpassBuffer) {
      if (result.missingCredentials) {
        return NextResponse.json(
          {
            error: "APPLE_WALLET_UNCONFIGURED",
            message: result.error,
            missing: result.missingCredentials,
          },
          { status: 412 }
        );
      }
      return NextResponse.json(
        { error: result.error || "Failed to generate Apple Wallet pass." },
        { status: 500 }
      );
    }

    return new NextResponse(new Uint8Array(result.pkpassBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="mak-pass-${validation.booking.id}.pkpass"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (err: any) {
    console.error("Apple Wallet pass error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error generating Apple Wallet pass." },
      { status: 500 }
    );
  }
}
