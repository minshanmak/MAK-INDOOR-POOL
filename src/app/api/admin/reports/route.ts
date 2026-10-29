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

  if (!hasPermission(user.role, user.permissions, PERMISSIONS.REPORTS_VIEW)) {
    return NextResponse.json({ error: "Forbidden: You lack report viewing permission." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const exportFormat = searchParams.get("format"); // "json" | "csv"

  const whereDate: any = {};
  if (startDate) whereDate.gte = startDate;
  if (endDate) whereDate.lte = endDate;

  // 1. Bookings in range
  const bookings = await prisma.booking.findMany({
    where: Object.keys(whereDate).length > 0 ? { bookingDate: whereDate } : undefined,
    orderBy: { bookingDate: "desc" },
  });

  // 2. Payments in range
  const payments = await prisma.payment.findMany({
    where: { status: "SUCCESS" },
    orderBy: { createdAt: "desc" },
  });

  // 3. Walk-ins in range
  const walkIns = await prisma.walkIn.findMany({
    orderBy: { createdAt: "desc" },
  });

  // 4. Refunds
  const refunds = await prisma.refund.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Summary Computations
  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const cashRevenue = payments.filter((p) => p.method === "CASH").reduce((s, p) => s + p.amount, 0);
  const upiRevenue = payments.filter((p) => p.method === "UPI").reduce((s, p) => s + p.amount, 0);
  const gatewayRevenue = payments.filter((p) => p.method === "GATEWAY").reduce((s, p) => s + p.amount, 0);

  const publicBookingsCount = bookings.filter((b) => b.type === "PUBLIC").length;
  const familyBookingsCount = bookings.filter((b) => b.type === "FAMILY").length;
  const totalSwimmers =
    bookings.reduce((s, b) => s + b.guestCount, 0) + walkIns.reduce((s, w) => s + w.visitorCount, 0);

  const outstandingBalanceTotal = bookings
    .filter((b) => b.status === "CONFIRMED")
    .reduce((s, b) => s + b.balanceAmount, 0);

  if (exportFormat === "csv") {
    // Generate authoritative CSV data
    const headers = "Booking ID,Date,Type,Status,Guest Count,Total Amount,Paid Amount,Balance,Customer Name,Phone\n";
    const rows = bookings
      .map(
        (b) =>
          `"${b.id}","${b.bookingDate}","${b.type}","${b.status}",${b.guestCount},${b.totalAmount},${b.totalPaid},${b.balanceAmount},"${b.customerName}","${b.customerPhone}"`
      )
      .join("\n");

    const csvContent = headers + rows;
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="mak-pool-report-${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({
    summary: {
      totalRevenue,
      cashRevenue,
      upiRevenue,
      gatewayRevenue,
      publicBookingsCount,
      familyBookingsCount,
      totalSwimmers,
      outstandingBalanceTotal,
      refundsCount: refunds.length,
      refundsApprovedTotal: refunds
        .filter((r) => r.status === "APPROVED" || r.status === "PROCESSED")
        .reduce((s, r) => s + r.approvedAmount, 0),
    },
    bookings,
    payments: payments.slice(0, 50),
    walkIns: walkIns.slice(0, 50),
    refunds,
  });
}
