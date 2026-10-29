import { prisma } from "./prisma";
import { calculateBookingPrice, calculateRemainingBalance, DEFAULT_PRICING, PricingConfig } from "./pricing";
import { hasPermission, PERMISSIONS } from "./permissions";

export interface SlotAvailabilityQuery {
  bookingType: "PUBLIC" | "FAMILY";
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  guestCount: number;
}

export interface AvailabilityResult {
  available: boolean;
  reason?: string;
  isCapacityWarning?: boolean;
  currentGuests?: number;
  maxCapacity?: number;
}

// Convert "HH:mm" to minutes since midnight for robust time comparison
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function isTimeOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Validates whether a time slot falls within proper operating hours.
 */
export function validateOperatingHours(
  bookingType: "PUBLIC" | "FAMILY",
  startTime: string,
  endTime: string,
  settings = { openHour: 9, closeHour: 23, publicEndHour: 16 }
): { valid: boolean; error?: string } {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  if (startMin >= endMin) {
    return { valid: false, error: "End time must be after start time." };
  }

  const dayOpenMin = settings.openHour * 60; // 09:00 = 540 min
  const dayCloseMin = settings.closeHour * 60; // 23:00 = 1380 min
  const publicEndMin = settings.publicEndHour * 60; // 16:00 = 960 min

  if (startMin < dayOpenMin || endMin > dayCloseMin) {
    return {
      valid: false,
      error: `Operating hours are ${settings.openHour}:00 AM to ${settings.closeHour % 12 || 12}:00 PM.`,
    };
  }

  if (bookingType === "PUBLIC") {
    if (startMin < dayOpenMin || endMin > publicEndMin) {
      return {
        valid: false,
        error: `Public swimming is only available between 9:00 AM and 4:00 PM.`,
      };
    }
  } else if (bookingType === "FAMILY") {
    if (startMin < publicEndMin || endMin > dayCloseMin) {
      return {
        valid: false,
        error: `Exclusive family bookings are only available between 4:00 PM and 11:00 PM.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Queries real-time slot availability respecting holds, confirmed bookings, and capacity.
 */
export async function checkAvailability(
  query: SlotAvailabilityQuery
): Promise<AvailabilityResult> {
  const settings = await prisma.poolSetting.findUnique({
    where: { id: "singleton_settings" },
  });

  if (settings?.maintenanceMode) {
    return {
      available: false,
      reason: settings.maintenanceMessage || "Pool is temporarily closed for scheduled maintenance.",
    };
  }

  const hoursValidation = validateOperatingHours(
    query.bookingType,
    query.startTime,
    query.endTime,
    settings || undefined
  );
  if (!hoursValidation.valid) {
    return { available: false, reason: hoursValidation.error };
  }

  const now = new Date();

  // 1. FAMILY BOOKINGS: Must be 100% exclusive.
  if (query.bookingType === "FAMILY") {
    // Check overlapping confirmed or in-progress bookings
    const confirmedBookings = await prisma.booking.findMany({
      where: {
        bookingDate: query.date,
        type: "FAMILY",
        status: { in: ["CONFIRMED", "HOLD"] },
      },
    });

    for (const b of confirmedBookings) {
      if (isTimeOverlapping(query.startTime, query.endTime, b.startTime, b.endTime)) {
        return {
          available: false,
          reason: `Exclusive family slot is already reserved between ${b.startTime} and ${b.endTime}.`,
        };
      }
    }

    // Check active unexpired slot holds
    const activeHolds = await prisma.slotHold.findMany({
      where: {
        date: query.date,
        bookingType: "FAMILY",
        status: "ACTIVE",
        expiresAt: { gt: now },
      },
    });

    for (const hold of activeHolds) {
      if (isTimeOverlapping(query.startTime, query.endTime, hold.startTime, hold.endTime)) {
        return {
          available: false,
          reason: "This family slot is currently held for an online checkout in progress. Please try another slot or check back shortly.",
        };
      }
    }

    return { available: true };
  }

  // 2. PUBLIC SWIMMING: Shared capacity up to maxCapacity
  const maxCap = settings?.maxCapacity || 25;
  const publicBookings = await prisma.booking.findMany({
    where: {
      bookingDate: query.date,
      type: "PUBLIC",
      status: "CONFIRMED",
    },
  });

  let currentOverlapGuests = 0;
  for (const b of publicBookings) {
    if (isTimeOverlapping(query.startTime, query.endTime, b.startTime, b.endTime)) {
      currentOverlapGuests += b.guestCount;
    }
  }

  // Add active walk-ins for today if query.date is today
  const todayStr = now.toISOString().split("T")[0];
  if (query.date === todayStr) {
    const activeWalkIns = await prisma.walkIn.findMany({
      where: { status: "ACTIVE" },
    });
    const currentActiveWalkInGuests = activeWalkIns.reduce((sum, w) => sum + w.visitorCount, 0);
    currentOverlapGuests += currentActiveWalkInGuests;
  }

  if (currentOverlapGuests + query.guestCount > maxCap) {
    return {
      available: false,
      reason: `Slot exceeds pool capacity limit. Only ${Math.max(0, maxCap - currentOverlapGuests)} spots left.`,
      isCapacityWarning: true,
      currentGuests: currentOverlapGuests,
      maxCapacity: maxCap,
    };
  }

  return {
    available: true,
    currentGuests: currentOverlapGuests,
    maxCapacity: maxCap,
  };
}

/**
 * Creates a safe, expiring temporary slot hold for checkout.
 */
export async function createTemporaryHold(
  query: SlotAvailabilityQuery
): Promise<{ holdToken: string; expiresAt: Date }> {
  const availability = await checkAvailability(query);
  if (!availability.available) {
    throw new Error(availability.reason || "Slot is not available.");
  }

  const settings = await prisma.poolSetting.findUnique({
    where: { id: "singleton_settings" },
  });
  const ttlMinutes = settings?.holdTtlMinutes || 15;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  const holdToken = `HOLD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  await prisma.slotHold.create({
    data: {
      bookingType: query.bookingType,
      date: query.date,
      startTime: query.startTime,
      endTime: query.endTime,
      guestCount: query.guestCount,
      holdToken,
      expiresAt,
      status: "ACTIVE",
    },
  });

  return { holdToken, expiresAt };
}

/**
 * Generates human-friendly sequential booking ID e.g. MAK-20261029-001
 */
export async function generateBookingId(dateStr: string): Promise<string> {
  const cleanDate = dateStr.replace(/-/g, "");
  const prefix = `MAK-${cleanDate}`;
  const count = await prisma.booking.count({
    where: {
      id: { startsWith: prefix },
    },
  });
  const seq = String(count + 1).padStart(3, "0");
  return `${prefix}-${seq}`;
}

export interface ConfirmBookingInput {
  holdToken?: string;
  bookingType: "PUBLIC" | "FAMILY";
  date: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  isStaffCreated?: boolean;
  createdByUserId?: string;
  initialPayment?: {
    amount: number;
    method: "CASH" | "UPI" | "GATEWAY";
    transactionRef?: string;
    gatewayPaymentId?: string;
    gatewayOrderId?: string;
    idempotencyKey?: string;
  };
}

/**
 * Confirms a booking atomically inside a database transaction.
 */
export async function confirmBooking(input: ConfirmBookingInput) {
  return await prisma.$transaction(async (tx) => {
    // If holdToken provided, validate it
    if (input.holdToken) {
      const hold = await tx.slotHold.findUnique({
        where: { holdToken: input.holdToken },
      });
      if (!hold) {
        throw new Error("Invalid checkout hold session.");
      }
      if (hold.status !== "ACTIVE" || hold.expiresAt < new Date()) {
        throw new Error("Hold session has expired. Please select a slot again.");
      }
    } else {
      // Re-verify availability inside transaction for concurrency safety
      const availability = await checkAvailability({
        bookingType: input.bookingType,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        guestCount: input.guestCount,
      });
      if (!availability.available) {
        throw new Error(availability.reason || "Slot is no longer available.");
      }
    }

    // Fetch dynamic pricing settings
    const settings = await tx.poolSetting.findUnique({
      where: { id: "singleton_settings" },
    });
    const pricingConfig: PricingConfig = {
      defaultPublicRate: settings?.defaultPublicRate || DEFAULT_PRICING.defaultPublicRate,
      defaultFamilyBaseRate: settings?.defaultFamilyBaseRate || DEFAULT_PRICING.defaultFamilyBaseRate,
      familyBaseGuests: settings?.familyBaseGuests || DEFAULT_PRICING.familyBaseGuests,
      familyExtraRate: settings?.familyExtraRate || DEFAULT_PRICING.familyExtraRate,
      familyAdvanceAmount: settings?.familyAdvanceAmount || DEFAULT_PRICING.familyAdvanceAmount,
    };

    const startMin = timeToMinutes(input.startTime);
    const endMin = timeToMinutes(input.endTime);
    const durationHours = (endMin - startMin) / 60;

    const priceCalc = calculateBookingPrice(
      input.bookingType,
      durationHours,
      input.guestCount,
      pricingConfig
    );

    // Upsert customer profile
    let customer = await tx.customer.findUnique({
      where: { phone: input.customerPhone },
    });
    if (!customer) {
      customer = await tx.customer.create({
        data: {
          name: input.customerName,
          phone: input.customerPhone,
          email: input.customerEmail || null,
        },
      });
    }

    // Determine initial payments & balance
    let paidSoFar = 0;
    let paymentStatus = "UNPAID";
    if (input.initialPayment && input.initialPayment.amount > 0) {
      paidSoFar = input.initialPayment.amount;
      paymentStatus = paidSoFar >= priceCalc.totalPrice ? "PAID" : "PARTIAL";
    }
    const balanceAmount = Math.max(0, Math.round((priceCalc.totalPrice - paidSoFar) * 100) / 100);

    // Generate unique sequential booking ID
    const cleanDate = input.date.replace(/-/g, "");
    const prefix = `MAK-${cleanDate}`;
    const count = await tx.booking.count({
      where: { id: { startsWith: prefix } },
    });
    const bookingId = `${prefix}-${String(count + 1).padStart(3, "0")}`;

    // Create Booking
    const booking = await tx.booking.create({
      data: {
        id: bookingId,
        type: input.bookingType,
        status: "CONFIRMED",
        bookingDate: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        durationHours,
        guestCount: input.guestCount,
        basePrice: priceCalc.basePrice,
        extraGuestPrice: priceCalc.extraGuestPrice,
        totalAmount: priceCalc.totalPrice,
        advanceRequired: priceCalc.advanceRequired,
        totalPaid: paidSoFar,
        balanceAmount,
        paymentStatus,
        customerId: customer.id,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail || null,
        notes: input.notes || null,
        isStaffCreated: !!input.isStaffCreated,
        createdByUserId: input.createdByUserId || null,
      },
    });

    // Record payment if provided
    if (input.initialPayment && input.initialPayment.amount > 0) {
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: input.initialPayment.amount,
          method: input.initialPayment.method,
          status: "SUCCESS",
          transactionRef: input.initialPayment.transactionRef || `TRX-${Date.now()}`,
          gatewayPaymentId: input.initialPayment.gatewayPaymentId || null,
          gatewayOrderId: input.initialPayment.gatewayOrderId || null,
          idempotencyKey: input.initialPayment.idempotencyKey || null,
          recordedByUserId: input.createdByUserId || null,
        },
      });

      // Generate receipt
      const recCount = await tx.receipt.count();
      const receiptNumber = `REC-${cleanDate}-${String(recCount + 1).padStart(4, "0")}`;
      await tx.receipt.create({
        data: {
          receiptNumber,
          bookingId: booking.id,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          totalAmount: priceCalc.totalPrice,
          paidAmount: paidSoFar,
          balanceAmount,
          paymentMethod: input.initialPayment.method,
        },
      });
    }

    // Mark hold converted if used
    if (input.holdToken) {
      await tx.slotHold.update({
        where: { holdToken: input.holdToken },
        data: { status: "CONVERTED" },
      });
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        entityType: "BOOKING",
        entityId: booking.id,
        action: "CREATE",
        performedByUserId: input.createdByUserId || null,
        userRole: input.isStaffCreated ? "STAFF" : "CUSTOMER",
        details: `Confirmed ${input.bookingType} booking for ${input.customerName} on ${input.date} (${input.startTime}-${input.endTime}). Total: ₹${priceCalc.totalPrice}, Paid: ₹${paidSoFar}, Balance: ₹${balanceAmount}`,
      },
    });

    return booking;
  });
}

