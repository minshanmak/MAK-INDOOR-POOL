import { prisma } from "./prisma";
import { getPoolDateTime, formatSlotTime } from "./timezone";

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

/**
 * Builds formatted WhatsApp confirmation text (used for both automated dispatch and 1-click wa.me URLs)
 */
export function buildBookingConfirmationText(booking: {
  id: string;
  type: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  customerName: string;
  customerPlace?: string | null;
  customerPhone: string;
  totalAmount: number;
  totalPaid: number;
  balanceAmount: number;
}, appUrl?: string): string {
  const baseOrigin = appUrl || process.env.NEXT_PUBLIC_APP_URL || "https://makindoorpool.com";
  const passUrl = `${baseOrigin}/booking-status?ref=${booking.id}&phone=${booking.customerPhone}`;
  const isFamily = booking.type === "FAMILY";
  const sessionType = isFamily ? "Exclusive Family & Group" : "Public Swimming";

  const balanceNotice = booking.balanceAmount > 0
    ? `💵 *Balance Due at Counter:* ₹${booking.balanceAmount}`
    : `✅ *Status:* Paid in Full [Verified]`;

  return (
    `🏊‍♂️ *M.A.K INDOOR POOL - BOOKING CONFIRMED* 🏊‍♂️\n` +
    `Kalathingalpara, Moonniyur, Malappuram\n\n` +
    `Hello *${booking.customerName}*, your pool reservation is locked!\n\n` +
    `📋 *Pass ID:* ${booking.id}\n` +
    `🏊 *Session Type:* ${sessionType}\n` +
    `📅 *Date:* ${booking.bookingDate}\n` +
    `⏰ *Time Slot:* ${formatSlotTime(booking.startTime)} – ${formatSlotTime(booking.endTime)}\n` +
    `👥 *Swimmers:* ${booking.guestCount} ${booking.guestCount === 1 ? "Guest" : "Guests"}\n\n` +
    `💰 *Total Amount:* ₹${booking.totalAmount}\n` +
    `💳 *Paid Online:* ₹${booking.totalPaid}\n` +
    `${balanceNotice}\n\n` +
    `🎫 *Show Digital QR Pass at Reception:* \n${passUrl}\n\n` +
    `📍 *Location:* Moonniyur, Malappuram (https://maps.google.com/?q=Kalathingalpara,Moonniyur)\n` +
    `📞 *Reception Helpline:* +91 99477 14716\n\n` +
    `_Please show the QR Pass at counter for admission. Have a refreshing swim!_`
  );
}

/**
 * Builds concise 160-char SMS text
 */
export function buildBookingConfirmationSms(booking: {
  id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  customerPhone: string;
}, appUrl?: string): string {
  const baseOrigin = appUrl || process.env.NEXT_PUBLIC_APP_URL || "https://makindoorpool.com";
  const passUrl = `${baseOrigin}/booking-status?ref=${booking.id}&phone=${booking.customerPhone}`;
  return `Booking Confirmed! MAK Indoor Pool Pass ID: ${booking.id} on ${booking.bookingDate} (${formatSlotTime(booking.startTime)}-${formatSlotTime(booking.endTime)}) for ${booking.guestCount} guests. Show digital pass: ${passUrl} Help: 9947714716`;
}

/**
 * Builds cancellation WhatsApp message text
 */
export function buildBookingCancellationText(
  booking: {
    id: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    guestCount: number;
    customerName: string;
    customerPhone: string;
    totalPaid?: number;
  },
  refundInfo?: {
    status?: string;
    approvedAmount?: number;
    reason?: string;
  }
): string {
  const refundText =
    refundInfo?.approvedAmount !== undefined && refundInfo.approvedAmount > 0
      ? `💰 *Refund Status:* Approved (₹${refundInfo.approvedAmount})\n_Refund will be credited back via original payment mode / at counter._`
      : refundInfo?.status === "REJECTED" || refundInfo?.approvedAmount === 0
      ? `ℹ️ *Refund Status:* Non-refundable / ₹0 (Late Cancellation)`
      : `ℹ️ *Refund Status:* Under management review`;

  const reasonLine = refundInfo?.reason ? `📌 *Reason:* ${refundInfo.reason}\n` : "";

  return (
    `❌ *M.A.K INDOOR POOL - RESERVATION CANCELLED*\n` +
    `Kalathingalpara, Moonniyur, Malappuram\n\n` +
    `Hello *${booking.customerName}*, your pool reservation has been cancelled.\n\n` +
    `📋 *Pass ID:* ${booking.id}\n` +
    `📅 *Date:* ${booking.bookingDate}\n` +
    `⏰ *Time Slot:* ${formatSlotTime(booking.startTime)} – ${formatSlotTime(booking.endTime)}\n` +
    `👥 *Guests:* ${booking.guestCount} Persons\n` +
    `${reasonLine}` +
    `${refundText}\n\n` +
    `The reserved slot has now been released.\n` +
    `For queries or rebooking, call helpline: +91 99477 14716`
  );
}

/**
 * Builds cancellation SMS message text
 */
export function buildBookingCancellationSms(
  booking: {
    id: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    customerName: string;
  },
  refundInfo?: {
    approvedAmount?: number;
  }
): string {
  const refundPart =
    refundInfo?.approvedAmount !== undefined && refundInfo.approvedAmount > 0
      ? ` Refund: Rs.${refundInfo.approvedAmount}.`
      : "";
  return `MAK Indoor Pool: Booking ${booking.id} on ${booking.bookingDate} (${formatSlotTime(booking.startTime)}) is CANCELLED.${refundPart} Slot released. Helpline: 9947714716`;
}

/**
 * Helper to build direct WhatsApp wa.me URL
 */
export function buildWhatsAppDirectUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, "").slice(-10);
  return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
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
        console.log(`[SIMULATED ${params.channel}] To: ${params.recipient} | Template: ${params.templateName}`);
      } else {
        // Real Gateway Dispatches
        if (params.channel === "SMS") {
          messageId = await this.dispatchSms(params.recipient, params.payload.message || params.payload.text || "");
        } else if (params.channel === "WHATSAPP") {
          messageId = await this.dispatchWhatsApp(params.recipient, params.payload.message || params.payload.text || "");
        } else {
          messageId = `prod_${Date.now()}`;
        }
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
      console.error(`Failed to send ${params.channel} notification to ${params.recipient}:`, err);
      await prisma.notificationLog.create({
        data: {
          recipient: params.recipient,
          channel: params.channel,
          templateName: params.templateName,
          payload: JSON.stringify(params.payload),
          status: "FAILED",
          errorMessage: err.message || "Failed dispatch",
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
   * Real SMS Gateway Dispatcher (Fast2SMS or Twilio)
   */
  private async dispatchSms(recipientPhone: string, messageText: string): Promise<string> {
    const cleanPhone = recipientPhone.replace(/\D/g, "").slice(-10);

    // 1. Fast2SMS (India Quick SMS route)
    if (this.smsProvider === "FAST2SMS" && process.env.FAST2SMS_API_KEY) {
      const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          "authorization": process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "q",
          message: messageText,
          numbers: cleanPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.return === false) {
        throw new Error(data.message || "Fast2SMS dispatch failed");
      }
      return data.request_id || `fast2sms_${Date.now()}`;
    }

    // 2. Twilio SMS
    if (this.smsProvider === "TWILIO" && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromPhone = process.env.TWILIO_FROM_PHONE;
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

      const params = new URLSearchParams();
      params.append("To", recipientPhone.startsWith("+") ? recipientPhone : `+91${cleanPhone}`);
      params.append("From", fromPhone || "");
      params.append("Body", messageText);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Twilio SMS dispatch failed");
      }
      return data.sid || `twilio_${Date.now()}`;
    }

    // Default fallback
    return `sms_${Date.now()}`;
  }

  /**
   * Real WhatsApp Gateway Dispatcher (Meta Cloud API or Twilio)
   */
  private async dispatchWhatsApp(recipientPhone: string, messageText: string): Promise<string> {
    const cleanPhone = recipientPhone.replace(/\D/g, "").slice(-10);

    // 1. Meta WhatsApp Cloud API
    if (this.whatsappProvider === "META_CLOUD" && process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const token = process.env.WHATSAPP_API_TOKEN;
      const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: `91${cleanPhone}`,
          type: "text",
          text: { preview_url: true, body: messageText },
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || "Meta WhatsApp Cloud dispatch failed");
      }
      return data.messages?.[0]?.id || `meta_wa_${Date.now()}`;
    }

    // 2. Twilio WhatsApp
    if (this.whatsappProvider === "TWILIO" && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromWa = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

      const params = new URLSearchParams();
      params.append("To", `whatsapp:+91${cleanPhone}`);
      params.append("From", fromWa);
      params.append("Body", messageText);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Twilio WhatsApp dispatch failed");
      }
      return data.sid || `twilio_wa_${Date.now()}`;
    }

    return `wa_${Date.now()}`;
  }

  /**
   * Dispatches instant booking confirmation across WhatsApp and SMS
   */
  async sendBookingConfirmation(
    bookingId: string,
    channels: ("WHATSAPP" | "SMS")[] = ["WHATSAPP", "SMS"]
  ): Promise<{ whatsapp?: NotificationResult; sms?: NotificationResult }> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking || !booking.customerPhone) {
      return {};
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://makindoorpool.com";
    const waText = buildBookingConfirmationText(booking, appUrl);
    const smsText = buildBookingConfirmationSms(booking, appUrl);

    const results: { whatsapp?: NotificationResult; sms?: NotificationResult } = {};

    if (channels.includes("WHATSAPP")) {
      results.whatsapp = await this.send({
        recipient: booking.customerPhone,
        channel: "WHATSAPP",
        templateName: "BOOKING_CONFIRMATION",
        payload: {
          bookingId: booking.id,
          message: waText,
          customerName: booking.customerName,
          bookingDate: booking.bookingDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
        },
      });
    }

    if (channels.includes("SMS")) {
      results.sms = await this.send({
        recipient: booking.customerPhone,
        channel: "SMS",
        templateName: "BOOKING_CONFIRMATION_SMS",
        payload: {
          bookingId: booking.id,
          message: smsText,
          customerName: booking.customerName,
        },
      });
    }

    return results;
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
   * Dispatches cancellation notice across WhatsApp and SMS
   */
  async sendCancellationConfirmation(
    bookingId: string,
    refundInfo?: {
      status?: string;
      approvedAmount?: number;
      reason?: string;
    },
    channels: ("WHATSAPP" | "SMS")[] = ["WHATSAPP", "SMS"]
  ): Promise<{ whatsapp?: NotificationResult; sms?: NotificationResult }> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking || !booking.customerPhone) {
      return {};
    }

    const waText = buildBookingCancellationText(booking, refundInfo);
    const smsText = buildBookingCancellationSms(booking, refundInfo);

    const results: { whatsapp?: NotificationResult; sms?: NotificationResult } = {};

    if (channels.includes("WHATSAPP")) {
      results.whatsapp = await this.send({
        recipient: booking.customerPhone,
        channel: "WHATSAPP",
        templateName: "BOOKING_CANCELLATION",
        payload: {
          bookingId: booking.id,
          message: waText,
          customerName: booking.customerName,
          bookingDate: booking.bookingDate,
          refundAmount: refundInfo?.approvedAmount ?? 0,
        },
      });
    }

    if (channels.includes("SMS")) {
      results.sms = await this.send({
        recipient: booking.customerPhone,
        channel: "SMS",
        templateName: "BOOKING_CANCELLATION_SMS",
        payload: {
          bookingId: booking.id,
          message: smsText,
          customerName: booking.customerName,
        },
      });
    }

    return results;
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
