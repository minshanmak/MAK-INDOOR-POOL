import { describe, it, expect } from "vitest";
import { calculateBookingPrice, calculateRemainingBalance, DEFAULT_PRICING } from "@/lib/pricing";

describe("Pricing Business Rules", () => {
  describe("Public Swimming Pricing", () => {
    it("calculates rate for 1 person for 1 hour at default ₹150", () => {
      const res = calculateBookingPrice("PUBLIC", 1, 1, DEFAULT_PRICING);
      expect(res.totalPrice).toBe(150);
      expect(res.advanceRequired).toBe(150);
      expect(res.initialBalance).toBe(0);
      expect(res.extraGuestPrice).toBe(0);
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
    it("calculates exact prompt example: 3 hours, 12 guests => ₹4,500 total, ₹750 advance, ₹3,750 balance", () => {
      const res = calculateBookingPrice("FAMILY", 3, 12, DEFAULT_PRICING);
      expect(res.basePrice).toBe(4500);
      expect(res.extraGuestPrice).toBe(0);
      expect(res.totalPrice).toBe(4500);
      expect(res.advanceRequired).toBe(750);
      expect(res.initialBalance).toBe(3750);
    });

    it("calculates for more than 12 guests: 3 hours, 14 guests => extra charge applied over entire duration", () => {
      // 3 hours * 1500 = 4500
      // Extra: (14 - 12) = 2 extra * 100/hr * 3 hrs = 600
      // Total = 5,100, Advance = 750, Balance = 4,350
      const res = calculateBookingPrice("FAMILY", 3, 14, DEFAULT_PRICING);
      expect(res.basePrice).toBe(4500);
      expect(res.extraGuestPrice).toBe(600);
      expect(res.totalPrice).toBe(5100);
      expect(res.advanceRequired).toBe(750);
      expect(res.initialBalance).toBe(4350);
    });

    it("calculates for 1 hour with 10 guests", () => {
      const res = calculateBookingPrice("FAMILY", 1, 10, DEFAULT_PRICING);
      expect(res.basePrice).toBe(1500);
      expect(res.extraGuestPrice).toBe(0);
      expect(res.totalPrice).toBe(1500);
      expect(res.advanceRequired).toBe(750);
      expect(res.initialBalance).toBe(750);
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
