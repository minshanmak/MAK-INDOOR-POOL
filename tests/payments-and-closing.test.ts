import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { paymentGateway } from "@/lib/payments/payment-gateway";
import { confirmBooking } from "@/lib/booking-engine";

describe("Payments, Financial Integrity & End-of-Day Reconciliation", () => {
  beforeEach(async () => {
    await prisma.receipt.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.refund.deleteMany();
    await prisma.scheduledReminder.deleteMany();
    await prisma.customerFeedback.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.booking.deleteMany();
  });

  it("handles payment order creation and idempotent verification", async () => {
    // 1. Create a confirmed family booking
    const booking = await confirmBooking({
      bookingType: "FAMILY",
      date: "2026-11-20",
      startTime: "18:00",
      endTime: "20:00",
      guestCount: 12,
      customerName: "Kareem A",
      customerPhone: "+919800044444",
      initialPayment: {
        amount: 750,
        method: "GATEWAY",
        transactionRef: "INIT-750",
      },
    });

    expect(booking.totalAmount).toBe(3000); // 2 hrs * 1500
    expect(booking.totalPaid).toBe(750);
    expect(booking.balanceAmount).toBe(2250);
    expect(booking.paymentStatus).toBe("PARTIAL");

    // 2. Process another payment of ₹2,250 via payment gateway
    const payResult = await paymentGateway.verifyAndRecordPayment({
      orderId: "order_test_123",
      paymentId: "pay_test_456",
      bookingId: booking.id,
      amount: 2250,
      idempotencyKey: "idem_unique_key_001",
    });

    expect(payResult.success).toBe(true);
    expect(payResult.isDuplicate).toBeFalsy();

    // 3. Verify booking is now marked PAID with 0 balance
    const updatedBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
    });
    expect(updatedBooking?.totalPaid).toBe(3000);
    expect(updatedBooking?.balanceAmount).toBe(0);
    expect(updatedBooking?.paymentStatus).toBe("PAID");

    // 4. Duplicate webhook callback test with identical idempotencyKey
    const duplicateResult = await paymentGateway.verifyAndRecordPayment({
      orderId: "order_test_123",
      paymentId: "pay_test_456",
      bookingId: booking.id,
      amount: 2250,
      idempotencyKey: "idem_unique_key_001",
    });
    expect(duplicateResult.success).toBe(true);
    expect(duplicateResult.isDuplicate).toBe(true);

    // Payments count should still be 2 (initial 750 + second 2250, not 3)
    const paymentCount = await prisma.payment.count({
      where: { bookingId: booking.id },
    });
    expect(paymentCount).toBe(2);
  });

  it("rejects simulated failure payment attempts without altering booking balance", async () => {
    const booking = await confirmBooking({
      bookingType: "PUBLIC",
      date: "2026-11-21",
      startTime: "11:00",
      endTime: "12:00",
      guestCount: 2,
      customerName: "Rani M",
      customerPhone: "+919800055555",
    });

    const failedAttempt = await paymentGateway.verifyAndRecordPayment({
      orderId: "order_test_fail",
      paymentId: "fail_payment_card_declined",
      bookingId: booking.id,
      amount: 300,
    });

    expect(failedAttempt.success).toBe(false);
    expect(failedAttempt.error).toContain("failed");

    const unchangedBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
    });
    expect(unchangedBooking?.totalPaid).toBe(0);
    expect(unchangedBooking?.balanceAmount).toBe(300);
  });
});

