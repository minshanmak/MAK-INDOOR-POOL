import { NextRequest, NextResponse } from "next/server";
import { validateWalletBookingRequest } from "@/lib/wallet/validation";
import { generateGoogleWalletPass } from "@/lib/wallet/google-pass";

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

    const result = await generateGoogleWalletPass(validation.booking, origin);

    if (!result.success || !result.saveUrl) {
      if (result.missingCredentials) {
        return NextResponse.json(
          {
            error: "GOOGLE_WALLET_UNCONFIGURED",
            message: result.error,
            missing: result.missingCredentials,
          },
          { status: 412 }
        );
      }
      return NextResponse.json(
        { error: result.error || "Failed to generate Google Wallet save link." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bookingId: validation.booking.id,
      saveUrl: result.saveUrl,
    });
  } catch (err: any) {
    console.error("Google Wallet pass error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error generating Google Wallet pass." },
      { status: 500 }
    );
  }
}
