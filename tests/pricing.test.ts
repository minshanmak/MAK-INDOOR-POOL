import { describe, it, expect } from "vitest";
import {
  calculateBookingPrice,
  calculateRemainingBalance,
  checkPublicCapacity,
  calculatePublicOverstay,
  calculatePrivateOverstay,
  DEFAULT_PRICING,
} from "@/lib/pricing";

describe("Pricing Business Rules", () => {
  describe("Public Swimming Pricing", () => {
    it("calculates rate for 1 person for 1 hour at default ₹150", () => {
      const res = calculateBookingPrice("PUBLIC", 1, 1, DEFAULT_PRICING);
      expect(res.totalPrice).toBe(150);
      expect(res.advanceRequired).toBe(150);
      expect(res.initialBalance).toBe(0);
      expect(res.extraGuestPrice).toBe(0);
    });

    it("calculates Claude specification check: Public, 25 guests, 1 hour = ₹3,750", () => {
      // 25 guests * 150 * 1 hour = 3750
      const res = calculateBookingPrice("PUBLIC", 1, 25, DEFAULT_PRICING);
      expect(res.totalPrice).toBe(3750);
      expect(res.advanceRequired).toBe(3750);
      expect(res.initialBalance).toBe(0);
    });

    it("calculates rate for multiple guests and duration", () => {
      // 4 people for 2 hours = 4 * 2 * 150 = 1,200
      const res = calculateBookingPrice("PUBLIC", 2, 4, DEFAULT_PRICING);
      expect(res.totalPrice).toBe(1200);
      expect(res.advanceRequired).toBe(1200);
      expect(res.initialBalance).toBe(0);
    });

    it("handles fractional hours properly", () => {
      // 2 people for 1.5 hours = 2 * 1.5 * 150 = 450
      const res = calculateBookingPrice("PUBLIC", 1.5, 2, DEFAULT_PRICING);
      expect(res.totalPrice).toBe(450);
      expect(res.advanceRequired).toBe(450);
    });
  });

  describe("Exclusive Family Booking Pricing", () => {
    it("calculates Claude specification check: Private, 12 guests, 1 hour = ₹1,500, Balance after advance = ₹750", () => {
      const res = calculateBookingPrice("FAMILY", 1, 12, DEFAULT_PRICING);
      expect(res.basePrice).toBe(1500);
      expect(res.extraGuestPrice).toBe(0);
      expect(res.totalPrice).toBe(1500);
      expect(res.advanceRequired).toBe(750);
      expect(res.initialBalance).toBe(750);
    });

    it("calculates Claude specification check: Private, 18 guests, 2 hours = (1500 + 600) × 2 = ₹4,200, Balance = ₹3,450", () => {
      // (1500 base + 6 extra * 100) * 2 hours = 2100 * 2 = 4200
      // Advance = 750, Balance = 4200 - 750 = 3450
      const res = calculateBookingPrice("FAMILY", 2, 18, DEFAULT_PRICING);
      expect(res.basePrice).toBe(3000);
      expect(res.extraGuestPrice).toBe(1200);
      expect(res.totalPrice).toBe(4200);
      expect(res.advanceRequired).toBe(750);
      expect(res.initialBalance).toBe(3450);
    });

    it("calculates for 3 hours, 12 guests => ₹4,500 total, ₹750 advance, ₹3,750 balance", () => {
      const res = calculateBookingPrice("FAMILY", 3, 12, DEFAULT_PRICING);
      expect(res.basePrice).toBe(4500);
      expect(res.extraGuestPrice).toBe(0);
      expect(res.totalPrice).toBe(4500);
      expect(res.advanceRequired).toBe(750);
      expect(res.initialBalance).toBe(3750);
    });

    it("calculates for more than 12 guests: 3 hours, 14 guests => extra charge applied over entire duration", () => {
      const res = calculateBookingPrice("FAMILY", 3, 14, DEFAULT_PRICING);
      expect(res.basePrice).toBe(4500);
      expect(res.extraGuestPrice).toBe(600);
      expect(res.totalPrice).toBe(5100);
      expect(res.advanceRequired).toBe(750);
      expect(res.initialBalance).toBe(4350);
    });
  });

  describe("Capacity Guard (25-Swimmer Hard Cap)", () => {
    it("allows admission when within 25 swimmers", () => {
      const guard = checkPublicCapacity(15, 5, 25);
      expect(guard.allowed).toBe(true);
      expect(guard.remainingCapacity).toBe(10);
      expect(guard.wouldExceedBy).toBe(0);
    });

    it("allows admission up to exactly 25 swimmers", () => {
      const guard = checkPublicCapacity(20, 5, 25);
      expect(guard.allowed).toBe(true);
      expect(guard.remainingCapacity).toBe(5);
      expect(guard.wouldExceedBy).toBe(0);
    });

    it("rejects admission that would exceed 25 swimmers", () => {
      const guard = checkPublicCapacity(22, 4, 25);
      expect(guard.allowed).toBe(false);
      expect(guard.remainingCapacity).toBe(3);
      expect(guard.wouldExceedBy).toBe(1);
    });

    it("rejects when already at 25 capacity", () => {
      const guard = checkPublicCapacity(25, 1, 25);
      expect(guard.allowed).toBe(false);
      expect(guard.remainingCapacity).toBe(0);
      expect(guard.wouldExceedBy).toBe(1);
    });
  });

  describe("Overstay Billing Calculations", () => {
    it("respects 5-minute grace period for public swimming", () => {
      const grace = calculatePublicOverstay(4, 3, 150);
      expect(grace.isGracePeriod).toBe(true);
      expect(grace.projectedCharge).toBe(0);

      const exactGrace = calculatePublicOverstay(5, 3, 150);
      expect(exactGrace.isGracePeriod).toBe(true);
      expect(exactGrace.projectedCharge).toBe(0);
    });

    it("bills public overstay after 5-minute grace period", () => {
      const overstay = calculatePublicOverstay(12, 2, 150);
      expect(overstay.isGracePeriod).toBe(false);
      // 1 hour block for 2 swimmers = 2 * 150 = 300
      expect(overstay.projectedCharge).toBe(300);
    });

    it("bills private sessions in 15-minute increments", () => {
      // 12 guests base rate 1500/hr => 1500 / 4 = 375 per 15 mins
      // 8 mins overdue => 1 increment = 375
      const inc1 = calculatePrivateOverstay(8, 12, DEFAULT_PRICING);
      expect(inc1.billedIncrements).toBe(1);
      expect(inc1.incrementMinutes).toBe(15);
      expect(inc1.projectedCharge).toBe(375);

      // 22 mins overdue => 2 increments = 750
      const inc2 = calculatePrivateOverstay(22, 12, DEFAULT_PRICING);
      expect(inc2.billedIncrements).toBe(2);
      expect(inc2.incrementMinutes).toBe(30);
      expect(inc2.projectedCharge).toBe(750);
    });

    it("includes extra swimmers in private overstay billing increments", () => {
      // 16 guests: 1500 + 4*100 = 1900/hr => 1900 / 4 = 475 per 15 min increment
      const inc = calculatePrivateOverstay(15, 16, DEFAULT_PRICING);
      expect(inc.billedIncrements).toBe(1);
      expect(inc.projectedCharge).toBe(475);
    });
  });

  describe("Authoritative Remaining Balance Calculation", () => {
    it("computes remaining balance from successful payments", () => {
      const balance = calculateRemainingBalance(4500, [
        { amount: 750, status: "SUCCESS" },
        { amount: 1000, status: "FAILED" }, // ignored
        { amount: 1250, status: "SUCCESS" },
      ]);
      // Paid: 750 + 1250 = 2000. Balance: 4500 - 2000 = 2500
      expect(balance).toBe(2500);
    });

    it("never returns negative balance", () => {
      const balance = calculateRemainingBalance(4500, [
        { amount: 5000, status: "SUCCESS" },
      ]);
      expect(balance).toBe(0);
    });
  });
});

