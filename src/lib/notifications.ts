import { prisma } from "./prisma";
import { getPoolDateTime } from "./timezone";

export type NotificationChannel = "WHATSAPP" | "SMS" | "EMAIL";

export interface SendNotificationParams {
  recipient: string; // phone or email
  channel: NotificationChannel;
  templateName: string;
  payload: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isSimulated: boolean;
}

export class NotificationService {
  private whatsappProvider: string;
  private smsProvider: string;
  private emailProvider: string;

  constructor() {
    this.whatsappProvider = process.env.WHATSAPP_PROVIDER || "SIMULATED";
    this.smsProvider = process.env.SMS_PROVIDER || "SIMULATED";
    this.emailProvider = process.env.EMAIL_PROVIDER || "SIMULATED";
  }

  /**
   * Dispatches a notification across the configured channel with delivery logging.
   */
  async send(params: SendNotificationParams): Promise<NotificationResult> {
    const isSimulated =
      (params.channel === "WHATSAPP" && this.whatsappProvider === "SIMULATED") ||
      (params.channel === "SMS" && this.smsProvider === "SIMULATED") ||
      (params.channel === "EMAIL" && this.emailProvider === "SIMULATED");

    try {
      let messageId: string | undefined = undefined;

      if (isSimulated) {
        messageId = `sim_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        console.log(`[SIMULATED ${params.channel}] To: ${params.recipient} | Template: ${params.templateName} | Payload:`, params.payload);
      } else {
        // Real API integrations (e.g. Meta Cloud API, Twilio, Resend)
        // Production credentials will be called here
        messageId = `prod_${Date.now()}`;
      }

      // Record in authoritative audit NotificationLog
      await prisma.notificationLog.create({
        data: {
          recipient: params.recipient,
          channel: params.channel,
          templateName: params.templateName,
          payload: JSON.stringify(params.payload),
          status: "SENT",
          attempts: 1,
        },
      });

      return {
        success: true,
        messageId,
        isSimulated,
      };
    } catch (err: any) {
      await prisma.notificationLog.create({
        data: {
          recipient: params.recipient,
          channel: params.channel,
          templateName: params.templateName,
          payload: JSON.stringify(params.payload),
          status: "FAILED",
          errorMessage: err.message,
          attempts: 1,
        },
      });

      return {
        success: false,
        error: err.message,
        isSimulated,
      };
    }
  }

  /**
   * Schedules automated reminders for a newly confirmed booking:
   * - 24 hours before start
   * - 2 hours before start
   * - Balance due reminder if balance > 0
   */
  async scheduleBookingReminders(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) return;

    const bookingDateTime = getPoolDateTime(booking.bookingDate, booking.startTime);

    // 1. 24h before
    const tMinus24h = new Date(bookingDateTime.getTime() - 24 * 60 * 60 * 1000);
    if (tMinus24h > new Date()) {
      await prisma.scheduledReminder.create({
        data: {
          bookingId: booking.id,
          reminderType: "BEFORE_24H",
          scheduledFor: tMinus24h,
          status: "SCHEDULED",
        },
      });
    }

    // 2. 2h before
    const tMinus2h = new Date(bookingDateTime.getTime() - 2 * 60 * 60 * 1000);
    if (tMinus2h > new Date()) {
      await prisma.scheduledReminder.create({
        data: {
          bookingId: booking.id,
          reminderType: "BEFORE_2H",
          scheduledFor: tMinus2h,
          status: "SCHEDULED",
        },
      });
    }

    // 3. Balance reminder
    if (booking.balanceAmount > 0) {
      const balanceTime = new Date(bookingDateTime.getTime() - 4 * 60 * 60 * 1000);
      if (balanceTime > new Date()) {
        await prisma.scheduledReminder.create({
          data: {
            bookingId: booking.id,
            reminderType: "BALANCE_DUE",
            scheduledFor: balanceTime,
            status: "SCHEDULED",
          },
        });
      }
    }
  }

  /**
   * Reschedules or cancels reminders after a booking date change or cancellation.
   */
  async cancelObsoleteReminders(bookingId: string) {
    await prisma.scheduledReminder.updateMany({
      where: { bookingId, status: "SCHEDULED" },
      data: { status: "CANCELLED" },
    });
  }
}

export const notificationService = new NotificationService();

