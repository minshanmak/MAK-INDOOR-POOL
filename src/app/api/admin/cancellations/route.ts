import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

// GET: List pending cancellation requests & refunds
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Bookings with cancellation requested
  const cancellationRequests = await prisma.booking.findMany({
    where: {
      cancellationReason: { not: null },
    },
    orderBy: { updatedAt: "desc" },
    include: { payments: true, refunds: true },
  });

  // All refunds
  const refunds = await prisma.refund.findMany({
    orderBy: { createdAt: "desc" },
    include: { booking: true },
  });

  return NextResponse.json({
    cancellationRequests,
    refunds,
  });
}

// POST: Approve / Reject Cancellation & Decide Refund
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action, bookingId, refundId, refundAmount, reason } = body;

  // 1. APPROVE CANCELLATION (Releases slot)
  if (action === "APPROVE_CANCELLATION") {
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.BOOKINGS_CANCEL_APPROVE)) {
      return NextResponse.json(
        { error: "Forbidden: You lack cancellation approval permission." },
        { status: 403 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { payments: true },
      });
      if (!b) throw new Error("Booking not found.");

      // Transition to CANCELLED (this officially releases the slot!)
      const cancelledBooking = await tx.booking.update({
        where: { id: b.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      });

      // If customer had made payments and refund is requested, create a PENDING refund record
      if (b.totalPaid > 0) {
        const proposedRefundAmount = Number(refundAmount) || b.totalPaid;
        await tx.refund.create({
          data: {
            bookingId: b.id,
            requestedAmount: b.totalPaid,
            approvedAmount: user.role === "POOL_OWNER" || user.role === "SUPER_ADMIN" ? proposedRefundAmount : 0,
            status: user.role === "POOL_OWNER" || user.role === "SUPER_ADMIN" ? "APPROVED" : "PENDING",
            reason: reason || b.cancellationReason || "Booking cancelled",
            approvedByUserId: user.role === "POOL_OWNER" || user.role === "SUPER_ADMIN" ? user.userId : null,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          entityType: "BOOKING",
          entityId: b.id,
          action: "APPROVE",
          performedByUserId: user.userId,
          userRole: user.role,
          details: `Approved cancellation for booking ${b.id}. Slot released. Reason: ${reason || "None"}`,
        },
      });

      return cancelledBooking;
    });

    return NextResponse.json({ success: true, booking: updated });
  }

  // 2. REFUND DECISION (OWNER ONLY!)
  if (action === "DECIDE_REFUND") {
    // HARD SECURITY BOUNDARY: ONLY POOL_OWNER OR SUPER_ADMIN
    if (user.role !== "POOL_OWNER" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Refund decisions and amounts are strictly Pool Owner only." },
        { status: 403 }
      );
    }

    const { decision, approvedAmount, transactionRef } = body; // decision: "APPROVE" | "REJECT" | "MARK_PROCESSED"

    const updatedRefund = await prisma.$transaction(async (tx) => {
      const r = await tx.refund.findUnique({
        where: { id: refundId },
      });
      if (!r) throw new Error("Refund record not found.");

      let status = r.status;
      let finalApproved = r.approvedAmount;
      let processedAt = r.processedAt;

      if (decision === "APPROVE") {
        status = "APPROVED";
        finalApproved = Number(approvedAmount) || r.requestedAmount;
      } else if (decision === "REJECT") {
        status = "REJECTED";
        finalApproved = 0;
      } else if (decision === "MARK_PROCESSED") {
        status = "PROCESSED";
        processedAt = new Date();
      }

      const res = await tx.refund.update({
        where: { id: r.id },
        data: {
          status,
          approvedAmount: finalApproved,
          approvedByUserId: user.userId,
          transactionRef: transactionRef || r.transactionRef,
          processedAt,
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: "REFUND",
          entityId: r.id,
          action: "UPDATE",
          performedByUserId: user.userId,
          userRole: user.role,
          details: `Owner decided refund ${r.id}: ${decision}. Approved amount: ₹${finalApproved}.`,
        },
      });

      return res;
    });

    return NextResponse.json({ success: true, refund: updatedRefund });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
