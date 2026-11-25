import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { notificationService } from "@/lib/notifications";

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
    pendingRequests: cancellationRequests,
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
  const {
    action,
    bookingId,
    refundId,
    refundAmount,
    refundDecision,
    markProcessed,
    refundRef,
    notifyCustomer = true,
    reason,
  } = body;

  // 1. APPROVE / EXECUTE CANCELLATION (Releases slot)
  if (action === "APPROVE_CANCELLATION") {
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.BOOKINGS_CANCEL_APPROVE)) {
      return NextResponse.json(
        { error: "Forbidden: You lack cancellation approval permission." },
        { status: 403 }
      );
    }

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required." }, { status: 400 });
    }

    let refundInfoForNotification: { status: string; approvedAmount: number; reason?: string } | undefined;

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const b = await tx.booking.findUnique({
          where: { id: bookingId },
          include: { payments: true, refunds: true },
        });
        if (!b) throw new Error("Booking not found.");

        if (b.status === "CANCELLED") {
          throw new Error("This booking has already been cancelled.");
        }

        if (b.checkInStatus === "CHECKED_IN") {
          throw new Error("Cannot cancel booking: guests are already checked in.");
        }

        const isOwnerOrAdmin = user.role === "POOL_OWNER" || user.role === "SUPER_ADMIN";

        // Determine explicit refund amount
        let finalRefundAmount = 0;
        if (refundDecision === "NO_REFUND") {
          finalRefundAmount = 0;
        } else if (refundAmount !== undefined && refundAmount !== null && refundAmount !== "") {
          finalRefundAmount = Math.max(0, Math.min(b.totalPaid, Number(refundAmount)));
        } else if (refundDecision === "FULL_REFUND" || !refundDecision) {
          finalRefundAmount = b.totalPaid;
        }

        const finalReason = reason?.trim() || b.cancellationReason || "Cancelled by Management";

        // Transition to CANCELLED (releases slot)
        const cancelledBooking = await tx.booking.update({
          where: { id: b.id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancellationReason: finalReason,
            paymentStatus: finalRefundAmount >= b.totalPaid && b.totalPaid > 0 ? "REFUNDED" : b.paymentStatus,
          },
        });

        // Record refund if customer paid anything
        if (b.totalPaid > 0) {
          const refundStatus = markProcessed ? "PROCESSED" : isOwnerOrAdmin ? "APPROVED" : "PENDING";
          const newRefund = await tx.refund.create({
            data: {
              bookingId: b.id,
              requestedAmount: b.totalPaid,
              approvedAmount: isOwnerOrAdmin ? finalRefundAmount : 0,
              status: refundStatus,
              reason: finalReason,
              approvedByUserId: isOwnerOrAdmin ? user.userId : null,
              transactionRef: markProcessed ? (refundRef || "Counter Cash/UPI") : null,
              processedAt: markProcessed ? new Date() : null,
            },
          });

          refundInfoForNotification = {
            status: newRefund.status,
            approvedAmount: finalRefundAmount,
            reason: finalReason,
          };
        } else {
          refundInfoForNotification = {
            status: "NO_PAYMENT",
            approvedAmount: 0,
            reason: finalReason,
          };
        }

        await tx.auditLog.create({
          data: {
            entityType: "BOOKING",
            entityId: b.id,
            action: "APPROVE",
            performedByUserId: user.userId,
            userRole: user.role,
            details: `Approved cancellation for booking ${b.id}. Slot released. Refund: ₹${finalRefundAmount} (${markProcessed ? "Processed immediately" : "Approved"}). Reason: ${finalReason}`,
          },
        });

        return cancelledBooking;
      });

      // Cancel any scheduled future reminders
      await notificationService.cancelObsoleteReminders(bookingId);

      // Dispatch automated WhatsApp & SMS cancellation notice
      if (notifyCustomer) {
        notificationService.sendCancellationConfirmation(bookingId, refundInfoForNotification).catch((err) => {
          console.error("Failed to send cancellation notification:", err);
        });
      }

      return NextResponse.json({ success: true, booking: updated });
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "Failed to cancel booking." }, { status: 400 });
    }
  }

  // 2. STAFF CANCELLATION REQUEST (Queues for Owner review, keeps slot locked)
  if (action === "REQUEST_CANCELLATION") {
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.BOOKINGS_CANCEL_REQUEST)) {
      return NextResponse.json(
        { error: "Forbidden: You lack cancellation request permission." },
        { status: 403 }
      );
    }

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required." }, { status: 400 });
    }

    const staffReason = reason?.trim();
    if (!staffReason) {
      return NextResponse.json({ error: "A cancellation reason is required." }, { status: 400 });
    }

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const b = await tx.booking.findUnique({
          where: { id: bookingId },
        });
        if (!b) throw new Error("Booking not found.");

        if (b.status === "CANCELLED") {
          throw new Error("This booking is already cancelled.");
        }

        if (b.checkInStatus === "CHECKED_IN") {
          throw new Error("Cannot request cancellation: guests are already checked in.");
        }

        const formattedReason = `[REQUESTED BY STAFF - ${user.name || "Staff"}]: ${staffReason}`;

        const bookingWithRequest = await tx.booking.update({
          where: { id: b.id },
          data: {
            cancellationReason: formattedReason,
          },
        });

        await tx.auditLog.create({
          data: {
            entityType: "BOOKING",
            entityId: b.id,
            action: "UPDATE",
            performedByUserId: user.userId,
            userRole: user.role,
            details: `Staff requested cancellation for booking ${b.id}. Reason: ${staffReason}`,
          },
        });

        return bookingWithRequest;
      });

      return NextResponse.json({ success: true, booking: updated });
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "Failed to submit request." }, { status: 400 });
    }
  }

  // 3. REJECT CANCELLATION REQUEST (Dismiss request, keep booking active)
  if (action === "REJECT_CANCELLATION") {
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.BOOKINGS_CANCEL_APPROVE)) {
      return NextResponse.json(
        { error: "Forbidden: You lack permission to manage cancellations." },
        { status: 403 }
      );
    }

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required." }, { status: 400 });
    }

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const b = await tx.booking.findUnique({
          where: { id: bookingId },
        });
        if (!b) throw new Error("Booking not found.");

        const previousReason = b.cancellationReason;

        const dismissedBooking = await tx.booking.update({
          where: { id: b.id },
          data: {
            cancellationReason: null,
          },
        });

        await tx.auditLog.create({
          data: {
            entityType: "BOOKING",
            entityId: b.id,
            action: "UPDATE",
            performedByUserId: user.userId,
            userRole: user.role,
            details: `Owner dismissed cancellation request for booking ${b.id}. Previous request note: "${previousReason}". Booking kept active.`,
          },
        });

        return dismissedBooking;
      });

      return NextResponse.json({ success: true, booking: updated });
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "Failed to dismiss request." }, { status: 400 });
    }
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

