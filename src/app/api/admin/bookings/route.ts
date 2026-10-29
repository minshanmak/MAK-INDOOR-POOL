import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: any = {};
  if (date) where.bookingDate = date;
  if (type && type !== "ALL") where.type = type;
  if (status && status !== "ALL") where.status = status;
  if (search) {
    where.OR = [
      { id: { contains: search } },
      { customerName: { contains: search } },
      { customerPhone: { contains: search } },
    ];
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: [{ bookingDate: "desc" }, { startTime: "asc" }],
    include: {
      payments: true,
      receipts: true,
      refunds: true,
    },
    take: 100,
  });

  return NextResponse.json({ bookings });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action, bookingId, paymentAmount, paymentMethod = "CASH", transactionRef, notes } = body;

  if (action === "COLLECT_BALANCE") {
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.PAYMENTS_CREATE)) {
      return NextResponse.json({ error: "Forbidden: You cannot collect payments" }, { status: 403 });
    }

    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid collection amount" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.findUnique({
        where: { id: bookingId },
      });
      if (!b) throw new Error("Booking not found.");

      const newTotalPaid = Math.round((b.totalPaid + amount) * 100) / 100;
      const newBalance = Math.max(0, Math.round((b.totalAmount - newTotalPaid) * 100) / 100);
      const newStatus = newBalance <= 0 ? "PAID" : "PARTIAL";

      const updatedBooking = await tx.booking.update({
        where: { id: b.id },
        data: {
          totalPaid: newTotalPaid,
          balanceAmount: newBalance,
          paymentStatus: newStatus,
        },
      });

      // Create Payment
      const p = await tx.payment.create({
        data: {
          bookingId: b.id,
          amount,
          method: paymentMethod as "CASH" | "UPI" | "GATEWAY",
          status: "SUCCESS",
          transactionRef: transactionRef || `COUNTER-COLL-${Date.now()}`,
          recordedByUserId: user.userId,
          notes: notes || "Counter balance payment",
        },
      });

      // Create Receipt
      const cleanDate = b.bookingDate.replace(/-/g, "");
      const recCount = await tx.receipt.count();
      await tx.receipt.create({
        data: {
          receiptNumber: `REC-${cleanDate}-${String(recCount + 1).padStart(4, "0")}`,
          bookingId: b.id,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          totalAmount: b.totalAmount,
          paidAmount: amount,
          balanceAmount: newBalance,
          paymentMethod,
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: "PAYMENT",
          entityId: p.id,
          action: "CREATE",
          performedByUserId: user.userId,
          userRole: user.role,
          details: `Collected balance ₹${amount} via ${paymentMethod} for booking ${b.id}. Remaining balance: ₹${newBalance}`,
        },
      });

      return updatedBooking;
    });

    return NextResponse.json({ success: true, booking: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
