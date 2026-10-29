import { NextRequest, NextResponse } from "next/server";
import { paymentGateway } from "@/lib/payments/payment-gateway";

export async function POST(req: NextRequest) {
  try {
    const { orderId, paymentId, signature, bookingId, amount } = await req.json();

    if (!orderId || !paymentId || !bookingId || !amount) {
      return NextResponse.json({ error: "Missing required payment verification parameters." }, { status: 400 });
    }

    const result = await paymentGateway.verifyAndRecordPayment({
      orderId,
      paymentId,
      signature,
      bookingId,
      amount: Number(amount),
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Payment verification failed." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      transactionRef: result.transactionRef,
      isDuplicate: result.isDuplicate,
    });
  } catch (err: any) {
    console.error("Payment verification error:", err);
    return NextResponse.json({ error: err.message || "Error processing payment callback." }, { status: 500 });
  }
}
