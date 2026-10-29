import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notificationService } from "@/lib/notifications";

export async function GET() {
  try {
    const now = new Date();

    // Fetch due reminders
    const dueReminders = await prisma.scheduledReminder.findMany({
      where: {
        status: "SCHEDULED",
        scheduledFor: { lte: now },
      },
      include: { booking: true },
      take: 25,
    });

    let sentCount = 0;

    for (const rem of dueReminders) {
      // Don't send reminder if booking was cancelled
      if (rem.booking.status === "CANCELLED") {
        await prisma.scheduledReminder.update({
          where: { id: rem.id },
          data: { status: "CANCELLED" },
        });
        continue;
      }

      // If balance reminder, check if balance is already 0
      if (rem.reminderType === "BALANCE_DUE" && rem.booking.balanceAmount <= 0) {
        await prisma.scheduledReminder.update({
          where: { id: rem.id },
          data: { status: "CANCELLED" },
        });
        continue;
      }

      // Dispatch notification
      const result = await notificationService.send({
        recipient: rem.booking.customerPhone,
        channel: "WHATSAPP",
        templateName: rem.reminderType,
        payload: {
          customerName: rem.booking.customerName,
          bookingId: rem.booking.id,
          bookingDate: rem.booking.bookingDate,
          startTime: rem.booking.startTime,
          balanceAmount: rem.booking.balanceAmount,
        },
      });

      await prisma.scheduledReminder.update({
        where: { id: rem.id },
        data: {
          status: result.success ? "SENT" : "FAILED",
          sentAt: result.success ? new Date() : null,
        },
      });

      if (result.success) sentCount++;
    }

    return NextResponse.json({
      success: true,
      processed: dueReminders.length,
      sentCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

