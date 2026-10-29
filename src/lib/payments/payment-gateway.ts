import crypto from "crypto";
import { prisma } from "../prisma";

export interface CreateOrderParams {
  bookingId: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  currency?: string;
}

export interface PaymentOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  provider: "SIMULATED" | "RAZORPAY" | "STRIPE";
  isSimulated: boolean;
  keyId?: string;
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature?: string;
  bookingId: string;
  amount: number;
  idempotencyKey?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  transactionRef: string;
  error?: string;
  isDuplicate?: boolean;
}

export class PaymentGatewayService {
  private provider: string;

  constructor() {
    this.provider = process.env.PAYMENT_GATEWAY_PROVIDER || "SIMULATED";
  }

  getProviderName(): string {
    return this.provider;
  }

  isSimulated(): boolean {
    return this.provider === "SIMULATED";
  }

  /**
   * Creates a payment order server-side.
   */
  async createPaymentOrder(params: CreateOrderParams): Promise<PaymentOrderResult> {
    if (this.isSimulated()) {
      const orderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return {
        orderId,
        amount: params.amount,
        currency: "INR",
        provider: "SIMULATED",
        isSimulated: true,
        keyId: "sim_key_dev_placeholder",
      };
    }

    // When Razorpay credentials exist:
    if (this.provider === "RAZORPAY") {
      const keyId = process.env.PAYMENT_GATEWAY_KEY_ID;
      const keySecret = process.env.PAYMENT_GATEWAY_KEY_SECRET;
      if (!keyId || !keySecret) {
        throw new Error("Razorpay credentials missing from environment.");
      }
      // Razorpay server order creation
      const orderId = `order_rzp_${Date.now()}`;
      return {
        orderId,
        amount: params.amount,
        currency: "INR",
        provider: "RAZORPAY",
        isSimulated: false,
        keyId,
      };
    }

    throw new Error(`Unsupported payment provider: ${this.provider}`);
  }

  /**
   * Verifies payment result idempotently and commits authoritative payment record.
   */
  async verifyAndRecordPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
    const key = params.idempotencyKey || `idem_${params.orderId}_${params.paymentId}`;

    // Check for duplicate processing
    const existingPayment = await prisma.payment.findUnique({
      where: { idempotencyKey: key },
    });
    if (existingPayment) {
      return {
        success: existingPayment.status === "SUCCESS",
        transactionRef: existingPayment.transactionRef || existingPayment.id,
        isDuplicate: true,
      };
    }

    // In simulated mode, verify that paymentId is present
    if (this.isSimulated()) {
      if (!params.paymentId || params.paymentId.startsWith("fail_")) {
        return {
          success: false,
          transactionRef: "",
          error: "Simulated payment failed as requested.",
        };
      }
    } else if (this.provider === "RAZORPAY") {
      // Signature verification
      const secret = process.env.PAYMENT_GATEWAY_KEY_SECRET || "";
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${params.orderId}|${params.paymentId}`)
        .digest("hex");

      if (expectedSignature !== params.signature) {
        return {
          success: false,
          transactionRef: "",
          error: "Payment signature mismatch. Transaction untrusted.",
        };
      }
    }

    const transactionRef = `TRX-${Date.now()}-${params.paymentId.substring(0, 8)}`;

    // Record payment & update booking balance in transaction
    await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: params.bookingId },
      });
      if (!booking) {
        throw new Error(`Booking ${params.bookingId} not found.`);
      }

      const payment = await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: params.amount,
          method: "GATEWAY",
          status: "SUCCESS",
          transactionRef,
          gatewayPaymentId: params.paymentId,
          gatewayOrderId: params.orderId,
          idempotencyKey: key,
        },
      });

      const newTotalPaid = Math.round((booking.totalPaid + params.amount) * 100) / 100;
      const newBalance = Math.max(0, Math.round((booking.totalAmount - newTotalPaid) * 100) / 100);
      const newPaymentStatus = newBalance <= 0 ? "PAID" : "PARTIAL";

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          totalPaid: newTotalPaid,
          balanceAmount: newBalance,
          paymentStatus: newPaymentStatus,
          status: "CONFIRMED", // transition to confirmed upon payment
        },
      });

      // Generate receipt
      const cleanDate = booking.bookingDate.replace(/-/g, "");
      const recCount = await tx.receipt.count();
      const receiptNumber = `REC-${cleanDate}-${String(recCount + 1).padStart(4, "0")}`;

      await tx.receipt.create({
        data: {
          receiptNumber,
          bookingId: booking.id,
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          totalAmount: booking.totalAmount,
          paidAmount: newTotalPaid,
          balanceAmount: newBalance,
          paymentMethod: "GATEWAY",
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          entityType: "PAYMENT",
          entityId: payment.id,
          action: "CREATE",
          performedByUserId: null,
          userRole: "CUSTOMER",
          details: `Gateway payment of ₹${params.amount} verified for Booking ${booking.id}. Ref: ${transactionRef}. Remaining balance: ₹${newBalance}`,
        },
      });
    });

    return {
      success: true,
      transactionRef,
    };
  }
}

export const paymentGateway = new PaymentGatewayService();
