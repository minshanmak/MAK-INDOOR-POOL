import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notificationService } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, purpose = "LOOKUP", name } = body;

    if (!phone) {
      return NextResponse.json({ error: "Mobile number is required." }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const last10 = cleanPhone.slice(-10);

    // If purpose is LOOKUP, check if any bookings exist for this customer phone
    const existingBookings = await prisma.booking.findMany({
      where: {
        customerPhone: { contains: last10 },
      },
      select: { id: true, customerName: true },
      take: 5,
    });

    if (purpose === "LOOKUP" && existingBookings.length === 0) {
      return NextResponse.json(
        {
          error: "No bookings found matching this mobile number. Please check the number or book a new session.",
          notFound: true,
        },
        { status: 404 }
      );
    }

    // Generate secure 4-digit numeric OTP
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

    // Store in DB
    await prisma.otpVerification.upsert({
      where: { phone: last10 },
      create: {
        phone: last10,
        code,
        expiresAt,
        attempts: 0,
      },
      update: {
        code,
        expiresAt,
        attempts: 0,
      },
    });

    const customerName = name || existingBookings[0]?.customerName || "Customer";
    const otpMsg =
      `M.A.K INDOOR POOL VERIFICATION CODE\n\n` +
      `Hello ${customerName},\n` +
      `Your one-time mobile verification code is: ${code}\n\n` +
      `This code is valid for 5 minutes. Enter this code to confirm your pool reservation.`;

    // Attempt dispatch via WhatsApp and SMS
    try {
      await notificationService.send({
        recipient: `+91${last10}`,
        channel: "WHATSAPP",
        templateName: "PASS_VERIFICATION_OTP",
        payload: {
          code,
          customerName,
          message: otpMsg,
        },
      });
    } catch (e) {
      console.warn("Failed sending WhatsApp OTP:", e);
    }

    try {
      await notificationService.send({
        recipient: last10,
        channel: "SMS",
        templateName: "PASS_VERIFICATION_OTP",
        payload: {
          code,
          customerName,
          text: `Your M.A.K Indoor Pool verification code is ${code}. Valid for 5 mins.`,
        },
      });
    } catch (e) {
      console.warn("Failed sending SMS OTP:", e);
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent to +91 ${last10}`,
      phone: last10,
      bookingsCount: existingBookings.length,
      // Debug OTP exposed in dev mode for seamless local testing
      debugOtp: process.env.NODE_ENV !== "production" ? code : undefined,
    });
  } catch (err: any) {
    console.error("send-otp error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to dispatch verification code." },
      { status: 500 }
    );
  }
}
