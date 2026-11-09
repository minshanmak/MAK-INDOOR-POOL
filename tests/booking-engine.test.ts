import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { autoCheckoutExpiredWalkIns, isWalkInOverlapping } from "@/lib/walkins";
import { getPoolDate, getPoolTime } from "@/lib/timezone";
import {
  checkAvailability,
  createTemporaryHold,
  confirmBooking,
  validateOperatingHours,
  isTimeOverlapping,
  getDaySlotsAvailability,
} from "@/lib/booking-engine";

describe("Booking Engine & Concurrency Safety", () => {
  beforeEach(async () => {
    // Clean up test bookings and holds (respecting relational foreign keys)
    await prisma.receipt.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.refund.deleteMany();
    await prisma.scheduledReminder.deleteMany();
    await prisma.customerFeedback.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.slotHold.deleteMany();
    await prisma.walkIn.deleteMany();
    await prisma.poolSetting.upsert({
      where: { id: "singleton_settings" },
      update: { maxCapacity: 25 },
      create: { id: "singleton_settings", maxCapacity: 25 },
    });
  });

  describe("Time Range & Operating Hours", () => {
    it("detects time overlaps accurately", () => {
      // (10:00 - 12:00) overlaps with (11:00 - 13:00)
      expect(isTimeOverlapping("10:00", "12:00", "11:00", "13:00")).toBe(true);
      // (10:00 - 12:00) does NOT overlap with (12:00 - 14:00) (back to back)
      expect(isTimeOverlapping("10:00", "12:00", "12:00", "14:00")).toBe(false);
      // (10:00 - 12:00) contains (10:30 - 11:30)
      expect(isTimeOverlapping("10:00", "12:00", "10:30", "11:30")).toBe(true);
    });

    it("enforces Public swimming operating hours: 09:00 AM - 04:00 PM", () => {
      expect(validateOperatingHours("PUBLIC", "09:00", "11:00").valid).toBe(true);
      expect(validateOperatingHours("PUBLIC", "14:00", "16:00").valid).toBe(true);
      // Attempting public booking at 17:00 should fail
      const latePublic = validateOperatingHours("PUBLIC", "16:00", "18:00");
      expect(latePublic.valid).toBe(false);
      expect(latePublic.error).toContain("Public swimming is only available between 9:00 AM and 4:00 PM");
    });

    it("enforces Family swimming operating hours: 09:00 AM - 11:00 PM (Full Day & Evening)", () => {
      expect(validateOperatingHours("FAMILY", "09:00", "12:00").valid).toBe(true);
      expect(validateOperatingHours("FAMILY", "12:00", "14:00").valid).toBe(true);
      expect(validateOperatingHours("FAMILY", "16:00", "19:00").valid).toBe(true);
      expect(validateOperatingHours("FAMILY", "20:00", "23:00").valid).toBe(true);
      // Attempting family booking before 9:00 AM should fail
      const earlyFamily = validateOperatingHours("FAMILY", "08:00", "10:00");
      expect(earlyFamily.valid).toBe(false);
      expect(earlyFamily.error).toContain("Operating hours are 9:00 AM to 11:00 PM");
    });
  });

  describe("Exclusive Family Booking Protection", () => {
    it("prevents overlapping confirmed family bookings", async () => {
      const testDate = "2026-11-15";

      // 1. Confirm first family booking: 17:00 - 20:00
      await confirmBooking({
        bookingType: "FAMILY",
        date: testDate,
        startTime: "17:00",
        endTime: "20:00",
        guestCount: 12,
        customerName: "Faizal K",
        customerPhone: "+919800011111",
        initialPayment: {
          amount: 750,
          method: "GATEWAY",
          transactionRef: "TEST-TRX-1",
        },
      });

      // 2. Query availability for overlapping slot (19:00 - 21:00)
      const availOverlap = await checkAvailability({
        bookingType: "FAMILY",
        date: testDate,
        startTime: "19:00",
        endTime: "21:00",
        guestCount: 10,
      });
      expect(availOverlap.available).toBe(false);
      expect(availOverlap.reason).toContain("already reserved between 17:00 and 20:00");

      // 3. Query availability for non-overlapping slot (20:00 - 22:00)
      const availNonOverlap = await checkAvailability({
        bookingType: "FAMILY",
        date: testDate,
        startTime: "20:00",
        endTime: "22:00",
        guestCount: 10,
      });
      expect(availNonOverlap.available).toBe(true);
    });

    it("blocks slot while an active temporary hold exists, but releases when hold expires", async () => {
      const testDate = "2026-11-16";

      // 1. Create a hold for 18:00 - 20:00
      const hold = await createTemporaryHold({
        bookingType: "FAMILY",
        date: testDate,
        startTime: "18:00",
        endTime: "20:00",
        guestCount: 12,
      });
      expect(hold.holdToken).toBeDefined();

      // 2. Another user checks 18:00 - 20:00 -> should be blocked
      const availWhileHeld = await checkAvailability({
        bookingType: "FAMILY",
        date: testDate,
        startTime: "18:00",
        endTime: "20:00",
        guestCount: 12,
      });
      expect(availWhileHeld.available).toBe(false);
      expect(availWhileHeld.reason).toContain("currently held for an online checkout");

      // 3. Simulate hold expiration by setting expiresAt in past
      await prisma.slotHold.update({
        where: { holdToken: hold.holdToken },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      // 4. Now slot should be available again
      const availAfterExpiry = await checkAvailability({
        bookingType: "FAMILY",
        date: testDate,
        startTime: "18:00",
        endTime: "20:00",
        guestCount: 12,
      });
      expect(availAfterExpiry.available).toBe(true);
    });
  });

  describe("Public Swimming Capacity", () => {
    it("permits multiple public visitors sharing capacity up to max capacity", async () => {
      const testDate = "2026-11-17";

      // Book 10 guests for 10:00 - 12:00
      await confirmBooking({
        bookingType: "PUBLIC",
        date: testDate,
        startTime: "10:00",
        endTime: "12:00",
        guestCount: 10,
        customerName: "Group A",
        customerPhone: "+919800022222",
        initialPayment: {
          amount: 3000,
          method: "GATEWAY",
        },
      });

      // Another group of 10 for same time -> 10 + 10 = 20 <= 25 max capacity -> should be available
      const availGroupB = await checkAvailability({
        bookingType: "PUBLIC",
        date: testDate,
        startTime: "10:00",
        endTime: "12:00",
        guestCount: 10,
      });
      expect(availGroupB.available).toBe(true);
      expect(availGroupB.currentGuests).toBe(10);

      // Book Group B (10 guests) -> now 20 total
      await confirmBooking({
        bookingType: "PUBLIC",
        date: testDate,
        startTime: "10:00",
        endTime: "12:00",
        guestCount: 10,
        customerName: "Group B",
        customerPhone: "+919800033333",
        initialPayment: {
          amount: 3000,
          method: "GATEWAY",
        },
      });

      // Third group of 10 guests -> 20 + 10 = 30 > 25 -> exceeds capacity!
      const availGroupC = await checkAvailability({
        bookingType: "PUBLIC",
        date: testDate,
        startTime: "10:00",
        endTime: "12:00",
        guestCount: 10,
      });
      expect(availGroupC.available).toBe(false);
      expect(availGroupC.isCapacityWarning).toBe(true);
      expect(availGroupC.reason).toContain("Only 5 spots left");
    });
  });
    it("prevents public swimming booking when a family booking is confirmed for that slot", async () => {
      const testDate = "2026-11-18";

      // 1. Confirm morning family booking: 10:00 - 12:00
      await confirmBooking({
        bookingType: "FAMILY",
        date: testDate,
        startTime: "10:00",
        endTime: "12:00",
        guestCount: 10,
        customerName: "Amina R",
        customerPhone: "+919800022222",
        initialPayment: {
          amount: 750,
          method: "GATEWAY",
          transactionRef: "TEST-FAM-AM",
        },
      });

      // 2. Query public swimming availability overlapping with family slot (11:00 - 12:00)
      const publicQuery = await checkAvailability({
        bookingType: "PUBLIC",
        date: testDate,
        startTime: "11:00",
        endTime: "12:00",
        guestCount: 2,
      });

      expect(publicQuery.available).toBe(false);
      expect(publicQuery.reason).toContain("exclusively reserved for a private family booking");
    });

    it("prevents family booking when public swimmers already booked that slot", async () => {
      const testDate = "2026-11-19";

      // 1. Confirm public booking: 10:00 - 11:00
      await confirmBooking({
        bookingType: "PUBLIC",
        date: testDate,
        startTime: "10:00",
        endTime: "11:00",
        guestCount: 3,
        customerName: "Rahul P",
        customerPhone: "+919800033333",
        initialPayment: {
          amount: 450,
          method: "GATEWAY",
          transactionRef: "TEST-PUB-1",
        },
      });

      // 2. Query family availability overlapping with public slot (09:00 - 11:00)
      const familyQuery = await checkAvailability({
        bookingType: "FAMILY",
        date: testDate,
        startTime: "09:00",
        endTime: "11:00",
        guestCount: 8,
      });

      expect(familyQuery.available).toBe(false);
      expect(familyQuery.reason).toContain("Cannot book exclusive family session because public swimmers are already booked");
    });
  });

  describe("Day-level Slot Status Calculation (Booked vs Available)", () => {
    it("marks booked family slots as BOOKED across entire duration", async () => {
      const testDate = "2026-11-25";

      // Confirm family booking for 17:00 to 19:00 (2 hours)
      await confirmBooking({
        bookingType: "FAMILY",
        date: testDate,
        startTime: "17:00",
        endTime: "19:00",
        guestCount: 6,
        customerName: "Suresh K",
        customerPhone: "+919800044444",
        initialPayment: {
          amount: 750,
          method: "GATEWAY",
          transactionRef: "TEST-FAM-D1",
        },
      });

      const daySlots = await getDaySlotsAvailability(testDate, "FAMILY");

      // 17:00 and 18:00 must be marked as BOOKED
      expect(daySlots["17:00"].status).toBe("BOOKED");
      expect(daySlots["18:00"].status).toBe("BOOKED");

      // 16:00 and 19:00 must remain AVAILABLE
      expect(daySlots["16:00"].status).toBe("AVAILABLE");
      expect(daySlots["19:00"].status).toBe("AVAILABLE");
    });
  
  describe("Walk-in Auto-Checkout & Occupancy Engine", () => {
    it("automatically checks out expired walk-in swimmers after their duration", async () => {
      // Create a walk-in from 2 hours ago with 1 hour duration
      const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000);
      const expiredEntry = await prisma.walkIn.create({
        data: {
          visitorCount: 3,
          durationHours: 1,
          ratePerHour: 150,
          calculatedCharge: 450,
          collectedAmount: 450,
          paymentMethod: "CASH",
          status: "ACTIVE",
          checkInTime: twoHoursAgo,
        },
      });

      // Create an active walk-in from 10 minutes ago with 1 hour duration
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
      const activeEntry = await prisma.walkIn.create({
        data: {
          visitorCount: 2,
          durationHours: 1,
          ratePerHour: 150,
          calculatedCharge: 300,
          collectedAmount: 300,
          paymentMethod: "UPI",
          status: "ACTIVE",
          checkInTime: tenMinsAgo,
        },
      });

      // Run auto-checkout
      const checkedOutCount = await autoCheckoutExpiredWalkIns(prisma);
      expect(checkedOutCount).toBe(1);

      // Verify the 2-hour-old walk-in is now CHECKED_OUT
      const refreshedExpired = await prisma.walkIn.findUnique({
        where: { id: expiredEntry.id },
      });
      expect(refreshedExpired?.status).toBe("CHECKED_OUT");
      expect(refreshedExpired?.checkOutTime).toBeDefined();

      // Verify the 10-minute-old walk-in is still ACTIVE
      const refreshedActive = await prisma.walkIn.findUnique({
        where: { id: activeEntry.id },
      });
      expect(refreshedActive?.status).toBe("ACTIVE");
    });

    it("ensures active walk-in swimmers only block overlapping family slots, not unrelated time slots", async () => {
      const now = new Date();
      const todayStr = getPoolDate(now);

      // Create an active walk-in starting right now for 1 hour
      await prisma.walkIn.create({
        data: {
          visitorCount: 4,
          durationHours: 1,
          ratePerHour: 150,
          calculatedCharge: 600,
          collectedAmount: 600,
          paymentMethod: "CASH",
          status: "ACTIVE",
          checkInTime: now,
        },
      });

      // 1. Query an evening family session tonight: 19:00 - 21:00
      // This MUST BE AVAILABLE! (The old bug wrongly rejected this session!)
      const eveningAvail = await checkAvailability({
        bookingType: "FAMILY",
        date: todayStr,
        startTime: "19:00",
        endTime: "21:00",
        guestCount: 8,
      });
      expect(eveningAvail.available).toBe(true);

      // 2. Query a family session that overlaps with the walk-in right now
      const currentH = now.getHours();
      const slotStart = `${String(currentH).padStart(2, "0")}:00`;
      const slotEnd = `${String(currentH + 1).padStart(2, "0")}:00`;
      const overlappingAvail = await checkAvailability({
        bookingType: "FAMILY",
        date: todayStr,
        startTime: slotStart,
        endTime: slotEnd,
        guestCount: 8,
      });
      expect(overlappingAvail.available).toBe(false);
      expect(overlappingAvail.reason).toContain("public walk-in swimmers are currently in the pool");
    });

    it("ensures public capacity correctly incorporates overlapping walk-in swimmers without impacting non-overlapping slots", async () => {
      const now = new Date();
      const todayStr = getPoolDate(now);

      // Create an active walk-in with 20 visitors right now for 1 hour
      await prisma.walkIn.create({
        data: {
          visitorCount: 20,
          durationHours: 1,
          ratePerHour: 150,
          calculatedCharge: 3000,
          collectedAmount: 3000,
          paymentMethod: "UPI",
          status: "ACTIVE",
          checkInTime: now,
        },
      });

      // Query slot overlapping with current walk-in for 10 guests: 20 + 10 = 30 > 25 (Capacity limit!)
      const currentH = now.getHours();
      const slotStart = `${String(currentH).padStart(2, "0")}:00`;
      const slotEnd = `${String(currentH + 1).padStart(2, "0")}:00`;

      // If current hour is within public hours (e.g. 09:00 - 16:00), test capacity warning
      if (currentH >= 9 && currentH < 16) {
        const queryNow = await checkAvailability({
          bookingType: "PUBLIC",
          date: todayStr,
          startTime: slotStart,
          endTime: slotEnd,
          guestCount: 10,
        });
        expect(queryNow.available).toBe(false);
        expect(queryNow.isCapacityWarning).toBe(true);
        expect(queryNow.reason).toContain("Only 5 spots left");
      }

      // Check isWalkInOverlapping directly
      const walkInMock = { checkInTime: now, durationHours: 1, status: "ACTIVE" };
      expect(isWalkInOverlapping(walkInMock, todayStr, slotStart, slotEnd)).toBe(true);
      expect(isWalkInOverlapping(walkInMock, todayStr, "19:00", "20:00")).toBe(false);
    });
  });
});
