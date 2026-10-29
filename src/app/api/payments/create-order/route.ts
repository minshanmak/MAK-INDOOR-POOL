import { NextRequest, NextResponse } from "next/server";
import { paymentGateway } from "@/lib/payments/payment-gateway";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, amount, customerName, customerPhone } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount." }, { status: 400 });
    }

    const order = await paymentGateway.createPaymentOrder({
      bookingId: bookingId || "PENDING_CHECKOUT",
      amount: Number(amount),
      customerName: customerName || "Customer",
      customerPhone: customerPhone || "",
    });

    return NextResponse.json(order);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create payment order." }, { status: 500 });
  }
}
