import { prisma } from "./prisma";
import { calculateBookingPrice, calculateRemainingBalance, DEFAULT_PRICING, PricingConfig } from "./pricing";
import { hasPermission, PERMISSIONS } from "./permissions";
import { getPoolDate, getPoolHour } from "./timezone";
import { notificationService } from "./notifications";
import { autoCheckoutExpiredWalkIns, isWalkInOverlapping } from "./walkins";

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
    // Family bookings are available between 9:00 AM and 11:00 PM (entire operating hours)
    if (startMin < dayOpenMin || endMin > dayCloseMin) {
      return {
        valid: false,
        error: `Exclusive family bookings are available between ${settings.openHour}:00 AM and ${settings.closeHour % 12 || 12}:00 PM.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Queries real-time slot availability respecting holds, confirmed bookings, and capacity.
 */
export async function checkAvailability(
  query: SlotAvailabilityQuery,
  db: any = prisma
): Promise<AvailabilityResult> {
  const settings = await db.poolSetting.findUnique({
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

  // Clean up any holds that have reached expiration
  await db.slotHold.updateMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lte: now },
    },
    data: { status: "EXPIRED" },
  });

  // 1. FAMILY BOOKINGS: Must be 100% exclusive.
  if (query.bookingType === "FAMILY") {
    const maxCap = settings?.maxCapacity || 25;
    if (query.guestCount > maxCap) {
      return {
        available: false,
        reason: `Guest count (${query.guestCount}) exceeds pool maximum capacity limit of ${maxCap} swimmers.`,
      };
    }
    // Check overlapping confirmed or in-progress bookings
    const confirmedBookings = await db.booking.findMany({
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
    const activeHolds = await db.slotHold.findMany({
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

    // C) Check overlapping PUBLIC bookings (since Family requires 100% private exclusivity)
    const publicBookings = await db.booking.findMany({
      where: {
        bookingDate: query.date,
        type: "PUBLIC",
        status: { in: ["CONFIRMED", "HOLD"] },
      },
    });

    for (const pb of publicBookings) {
      if (isTimeOverlapping(query.startTime, query.endTime, pb.startTime, pb.endTime)) {
        return {
          available: false,
          reason: `Cannot book exclusive family session because public swimmers are already booked for this slot (${pb.startTime} – ${pb.endTime}).`,
        };
      }
    }

    // D) Check active unexpired PUBLIC slot holds
    const activePublicHolds = await db.slotHold.findMany({
      where: {
        date: query.date,
        bookingType: "PUBLIC",
        status: "ACTIVE",
        expiresAt: { gt: now },
      },
    });

    for (const hold of activePublicHolds) {
      if (isTimeOverlapping(query.startTime, query.endTime, hold.startTime, hold.endTime)) {
        return {
          available: false,
          reason: "Cannot book exclusive family session because public swimming checkout is currently in progress for this slot.",
        };
      }
    }

    // E) Check active walk-in visitors if query is for today
    const todayStr = getPoolDate(now);

    if (query.date === todayStr) {
      await autoCheckoutExpiredWalkIns(db);
      const activeWalkIns = await db.walkIn.findMany({
        where: { status: "ACTIVE" },
      });
      const overlappingWalkIn = activeWalkIns.find((w: any) =>
        isWalkInOverlapping(w, query.date, query.startTime, query.endTime)
      );
      if (overlappingWalkIn) {
        return {
          available: false,
          reason: "Cannot book exclusive family session because public walk-in swimmers are currently in the pool during this time slot.",
        };
      }
    }

    return { available: true };
  }

  // 2. PUBLIC SWIMMING: Must NEVER be booked during any slot reserved for an exclusive Family booking!
  // A) Check overlapping confirmed or in-progress FAMILY bookings
  const confirmedFamilyBookings = await db.booking.findMany({
    where: {
      bookingDate: query.date,
      type: "FAMILY",
      status: { in: ["CONFIRMED", "HOLD"] },
    },
  });

  for (const fb of confirmedFamilyBookings) {
    if (isTimeOverlapping(query.startTime, query.endTime, fb.startTime, fb.endTime)) {
      return {
        available: false,
        reason: `This slot is exclusively reserved for a private family booking (${fb.startTime} – ${fb.endTime}). Public swimming is not permitted during private family sessions.`,
      };
    }
  }

  // B) Check active unexpired FAMILY slot holds
  const activeFamilyHolds = await db.slotHold.findMany({
    where: {
      date: query.date,
      bookingType: "FAMILY",
      status: "ACTIVE",
      expiresAt: { gt: now },
    },
  });

  for (const hold of activeFamilyHolds) {
    if (isTimeOverlapping(query.startTime, query.endTime, hold.startTime, hold.endTime)) {
      return {
        available: false,
        reason: "This slot is currently held for a private family checkout in progress. Public swimming is not permitted during private family sessions.",
      };
    }
  }

  // C) Check public capacity up to maxCapacity
  const maxCap = settings?.maxCapacity || 25;
  const publicBookings = await db.booking.findMany({
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

  // Check active unexpired public slot holds
  const activePublicHolds = await db.slotHold.findMany({
    where: {
      date: query.date,
      bookingType: "PUBLIC",
      status: "ACTIVE",
      expiresAt: { gt: now },
    },
  });
  for (const hold of activePublicHolds) {
    if (isTimeOverlapping(query.startTime, query.endTime, hold.startTime, hold.endTime)) {
      currentOverlapGuests += hold.guestCount;
    }
  }

  // Add active walk-ins for today if query.date is today
  const todayStr = getPoolDate(now);

  if (query.date === todayStr) {
    await autoCheckoutExpiredWalkIns(db);
    const activeWalkIns = await db.walkIn.findMany({
      where: { status: "ACTIVE" },
    });
    const currentActiveWalkInGuests = activeWalkIns
      .filter((w: any) => isWalkInOverlapping(w, query.date, query.startTime, query.endTime))
      .reduce((sum: number, w: any) => sum + w.visitorCount, 0);
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

export interface SlotStatusInfo {
  slot: string;
  status: "AVAILABLE" | "BOOKED" | "HELD" | "PAST";
  reason?: string;
  remainingCapacity?: number;
}

/**
 * Returns the availability status of all slots on a given date for either PUBLIC or FAMILY.
 */
export async function getDaySlotsAvailability(
  date: string,
  bookingType: "PUBLIC" | "FAMILY",
  db: any = prisma
): Promise<Record<string, SlotStatusInfo>> {
  const publicSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];
  const familySlots = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"
  ];
  const slots = bookingType === "PUBLIC" ? publicSlots : familySlots;

  const settings = await db.poolSetting.findUnique({
    where: { id: "singleton_settings" },
  });
  const maxCap = settings?.maxCapacity || 25;

  const now = new Date();
  const todayStr = getPoolDate(now);

  const currentISTHour = getPoolHour(now);

  await db.slotHold.updateMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lte: now },
    },
    data: { status: "EXPIRED" },
  });

  const bookings = await db.booking.findMany({
    where: {
      bookingDate: date,
      status: { in: ["CONFIRMED", "HOLD"] },
    },
  });

  const holds = await db.slotHold.findMany({
    where: {
      date,
      status: "ACTIVE",
      expiresAt: { gt: now },
    },
  });


  let activeWalkIns: any[] = [];
  if (date === todayStr) {
    await autoCheckoutExpiredWalkIns(db);
    activeWalkIns = await db.walkIn.findMany({
      where: { status: "ACTIVE" },
    });

  }

  const result: Record<string, SlotStatusInfo> = {};

  for (const slot of slots) {
    const [h, m] = slot.split(":").map(Number);
    const endMinutes = h * 60 + (m || 0) + 60;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const slotEnd = String(endH).padStart(2, "0") + ":" + String(endM).padStart(2, "0");

    if (date === todayStr && h <= currentISTHour) {
      result[slot] = { slot, status: "PAST", reason: "Slot time has already passed today." };
      continue;
    }

    if (settings?.maintenanceMode) {
      result[slot] = { slot, status: "BOOKED", reason: settings.maintenanceMessage || "Under maintenance." };
      continue;
    }

    if (bookingType === "FAMILY") {
      const bookedFamily = bookings.find(
        (b: any) => b.type === "FAMILY" && isTimeOverlapping(slot, slotEnd, b.startTime, b.endTime)
      );
      if (bookedFamily) {
        result[slot] = {
          slot,
          status: "BOOKED",
          reason: "Exclusive family slot is reserved (" + bookedFamily.startTime + " – " + bookedFamily.endTime + ").",
        };
        continue;
      }

      const heldFamily = holds.find(
        (hold: any) => hold.bookingType === "FAMILY" && isTimeOverlapping(slot, slotEnd, hold.startTime, hold.endTime)
      );
      if (heldFamily) {
        result[slot] = {
          slot,
          status: "HELD",
          reason: "Checkout in progress for this family slot.",
        };
        continue;
      }

      const bookedPublic = bookings.find(
        (b: any) => b.type === "PUBLIC" && isTimeOverlapping(slot, slotEnd, b.startTime, b.endTime)
      );
      if (bookedPublic) {
        result[slot] = {
          slot,
          status: "BOOKED",
          reason: "Public swimming visitors already booked for this slot.",
        };
        continue;
      }

      const heldPublic = holds.find(
        (hold: any) => hold.bookingType === "PUBLIC" && isTimeOverlapping(slot, slotEnd, hold.startTime, hold.endTime)
      );
      if (heldPublic) {
        result[slot] = {
          slot,
          status: "HELD",
          reason: "Public swimming checkout in progress.",
        };
        continue;
      }

      if (date === todayStr && activeWalkIns.some((w: any) => isWalkInOverlapping(w, date, slot, slotEnd))) {
        result[slot] = {
          slot,
          status: "BOOKED",
          reason: "Public walk-in swimmers currently in the pool.",
        };
        continue;
      }

      result[slot] = { slot, status: "AVAILABLE" };
    } else {
      const bookedFamily = bookings.find(
        (b: any) => b.type === "FAMILY" && isTimeOverlapping(slot, slotEnd, b.startTime, b.endTime)
      );
      if (bookedFamily) {
        result[slot] = {
          slot,
          status: "BOOKED",
          reason: "Exclusively reserved for private family session (" + bookedFamily.startTime + " – " + bookedFamily.endTime + ").",
        };
        continue;
      }

      const heldFamily = holds.find(
        (hold: any) => hold.bookingType === "FAMILY" && isTimeOverlapping(slot, slotEnd, hold.startTime, hold.endTime)
      );
      if (heldFamily) {
        result[slot] = {
          slot,
          status: "HELD",
          reason: "Private family checkout in progress.",
        };
        continue;
      }

      let overlapGuests = 0;
      for (const b of bookings as any[]) {
        if (b.type === "PUBLIC" && isTimeOverlapping(slot, slotEnd, b.startTime, b.endTime)) {
          overlapGuests += b.guestCount;
        }
      }
      for (const hold of holds as any[]) {
        if (hold.bookingType === "PUBLIC" && isTimeOverlapping(slot, slotEnd, hold.startTime, hold.endTime)) {
          overlapGuests += hold.guestCount;
        }
      }
      if (date === todayStr) {
        const overlappingWalkInGuests = activeWalkIns
          .filter((w: any) => isWalkInOverlapping(w, date, slot, slotEnd))
          .reduce((sum: number, w: any) => sum + w.visitorCount, 0);
        overlapGuests += overlappingWalkInGuests;
      }

      if (overlapGuests >= maxCap) {
        result[slot] = {
          slot,
          status: "BOOKED",
          reason: "Slot capacity full (" + overlapGuests + "/" + maxCap + " booked).",
          remainingCapacity: 0,
        };
      } else {
        result[slot] = {
          slot,
          status: "AVAILABLE",
          remainingCapacity: maxCap - overlapGuests,
        };
      }
    }
  }

  return result;
}

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
  customerPlace?: string;
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
  const result = await prisma.$transaction(
    async (tx) => {
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
        // Re-verify availability inside transaction for concurrency safety using transaction client
        const availability = await checkAvailability(
          {
            bookingType: input.bookingType,
            date: input.date,
            startTime: input.startTime,
            endTime: input.endTime,
            guestCount: input.guestCount,
          },
          tx
        );
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
          place: input.customerPlace || null,
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
        customerPlace: input.customerPlace || null,
        notes: input.notes || null,
        qrToken: `MAKPASS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        checkInStatus: "PENDING",
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
  }, { maxWait: 10000, timeout: 15000 });

  // Automated notification and reminder scheduling outside transaction
  try {
    await notificationService.scheduleBookingReminders(result.id);
  } catch (remErr) {
    console.error("Failed to schedule booking reminders:", remErr);
  }

  return result;
}

