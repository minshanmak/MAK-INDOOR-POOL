export interface PricingConfig {
  defaultPublicRate: number;      // e.g. 150
  defaultFamilyBaseRate: number;  // e.g. 1500
  familyBaseGuests: number;       // e.g. 12
  familyExtraRate: number;        // e.g. 100
  familyAdvanceAmount: number;    // e.g. 750
}

export const DEFAULT_PRICING: PricingConfig = {
  defaultPublicRate: 150,
  defaultFamilyBaseRate: 1500,
  familyBaseGuests: 12,
  familyExtraRate: 100,
  familyAdvanceAmount: 750,
};

export interface PricingCalculationResult {
  bookingType: "PUBLIC" | "FAMILY";
  durationHours: number;
  guestCount: number;
  basePrice: number;
  extraGuestPrice: number;
  totalPrice: number;
  advanceRequired: number;
  initialBalance: number;
}

/**
 * Authoritative Server-side Price Calculation.
 * Implements M.A.K Indoor Pool business rules.
 */
export function calculateBookingPrice(
  bookingType: "PUBLIC" | "FAMILY",
  durationHours: number,
  guestCount: number,
  config: PricingConfig = DEFAULT_PRICING
): PricingCalculationResult {
  if (durationHours <= 0) {
    throw new Error("Duration must be greater than 0 hours.");
  }
  if (guestCount <= 0) {
    throw new Error("Guest count must be at least 1.");
  }

  // Round duration to 2 decimal places to avoid IEEE 754 float precision drift
  const duration = Math.round(durationHours * 100) / 100;

  if (bookingType === "PUBLIC") {
    // ₹150 per person per hour
    const totalPrice = Math.round(guestCount * duration * config.defaultPublicRate * 100) / 100;
    // Public swimming online requires full payment
    return {
      bookingType: "PUBLIC",
      durationHours: duration,
      guestCount,
      basePrice: totalPrice,
      extraGuestPrice: 0,
      totalPrice,
      advanceRequired: totalPrice,
      initialBalance: 0,
    };
  } else {
    // FAMILY BOOKING:
    // ₹1,500/hr for up to 12 people.
    // Each person above 12 adds ₹100/hr for the entire duration.
    const basePrice = Math.round(duration * config.defaultFamilyBaseRate * 100) / 100;
    const extraGuests = Math.max(0, guestCount - config.familyBaseGuests);
    const extraGuestPrice = Math.round(extraGuests * config.familyExtraRate * duration * 100) / 100;
    const totalPrice = Math.round((basePrice + extraGuestPrice) * 100) / 100;

    // Required advance: ₹750 (or total if total < 750)
    const advanceRequired = Math.min(config.familyAdvanceAmount, totalPrice);
    const initialBalance = Math.round((totalPrice - advanceRequired) * 100) / 100;

    return {
      bookingType: "FAMILY",
      durationHours: duration,
      guestCount,
      basePrice,
      extraGuestPrice,
      totalPrice,
      advanceRequired,
      initialBalance,
    };
  }
}

/**
 * Calculates remaining balance authoritatively from total price and payments received.
 */
export function calculateRemainingBalance(totalPrice: number, payments: { amount: number; status: string }[]): number {
  const successfulPaid = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0);

  const balance = Math.round((totalPrice - successfulPaid) * 100) / 100;
  return Math.max(0, balance);
}

/**
 * Public Swimming Capacity Guard.
 * Strict hard cap of 25 swimmers concurrent.
 */
export function checkPublicCapacity(
  currentSwimmers: number,
  requestedGuests: number,
  maxCapacity: number = 25
): { allowed: boolean; remainingCapacity: number; wouldExceedBy: number } {
  const remaining = Math.max(0, maxCapacity - currentSwimmers);
  const allowed = requestedGuests > 0 && currentSwimmers + requestedGuests <= maxCapacity;
  const wouldExceedBy = Math.max(0, (currentSwimmers + requestedGuests) - maxCapacity);

  return {
    allowed,
    remainingCapacity: remaining,
    wouldExceedBy,
  };
}

/**
 * Public Overstay Calculation:
 * - 5-minute grace period.
 * - After 5 minutes, overdue elapsed time is flagged. Staff can extend (₹150/guest/hr).
 */
export function calculatePublicOverstay(
  overdueMinutes: number,
  guestCount: number,
  ratePerHour: number = 150
): { isGracePeriod: boolean; billableMinutes: number; projectedCharge: number } {
  if (overdueMinutes <= 5) {
    return {
      isGracePeriod: true,
      billableMinutes: 0,
      projectedCharge: 0,
    };
  }

  // Billed in 30 or 60 minute extension blocks or exact hourly rate
  const hours = Math.ceil(overdueMinutes / 60);
  const projectedCharge = hours * guestCount * ratePerHour;

  return {
    isGracePeriod: false,
    billableMinutes: overdueMinutes,
    projectedCharge,
  };
}

/**
 * Private Overstay Calculation:
 * - Overstay bills in 15-minute increments.
 * - Base rate is ₹1,500/hr + ₹100/hr per extra swimmer (>12), divided into 4 quarters.
 */
export function calculatePrivateOverstay(
  overdueMinutes: number,
  guestCount: number,
  config: PricingConfig = DEFAULT_PRICING
): { billedIncrements: number; incrementMinutes: number; projectedCharge: number } {
  if (overdueMinutes <= 0) {
    return {
      billedIncrements: 0,
      incrementMinutes: 0,
      projectedCharge: 0,
    };
  }

  // 15-minute increments (1 to 15 min = 1 increment, 16 to 30 = 2 increments)
  const billedIncrements = Math.ceil(overdueMinutes / 15);
  const extraGuests = Math.max(0, guestCount - config.familyBaseGuests);
  const hourlyRate = config.defaultFamilyBaseRate + extraGuests * config.familyExtraRate;
  const quarterRate = hourlyRate / 4;
  const projectedCharge = Math.round(billedIncrements * quarterRate);

  return {
    billedIncrements,
    incrementMinutes: billedIncrements * 15,
    projectedCharge,
  };
}

