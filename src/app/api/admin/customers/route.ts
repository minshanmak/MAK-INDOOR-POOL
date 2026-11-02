import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    // Query bookings to get customer profiles with aggregate booking history
    const bookings = await prisma.booking.findMany({
      select: {
        customerName: true,
        customerPhone: true,
        bookingDate: true,
        totalAmount: true,
        status: true,
      },
      orderBy: { bookingDate: "desc" },
    });

    // Group by phone number
    const customerMap = new Map<string, any>();

    for (const b of bookings) {
      const phone = b.customerPhone || "N/A";
      if (!customerMap.has(phone)) {
        customerMap.set(phone, {
          name: b.customerName,
          phone: b.customerPhone,
          totalBookings: 0,
          totalSpent: 0,
          lastBooking: b.bookingDate,
        });
      }
      const existing = customerMap.get(phone);
      existing.totalBookings += 1;
      existing.totalSpent += b.totalAmount;
    }

    let customers = Array.from(customerMap.values());

    if (search.trim()) {
      const q = search.toLowerCase();
      customers = customers.filter(
        (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
      );
    }

    return NextResponse.json({ customers });
  } catch (err: any) {
    console.error("Customers API error", err);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
