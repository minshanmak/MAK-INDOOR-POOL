import { describe, it, expect } from "vitest";
import {
  POOL_TIMEZONE,
  getPoolDate,
  getPoolTime,
  getPoolHour,
  getPoolDayBounds,
  getPoolDateTime,
  formatSlotTime,
  formatPoolDate,
  formatPoolTime,
} from "../src/lib/timezone";

describe("Timezone Engine — Asia/Kolkata (IST, UTC+05:30)", () => {
  it("enforces POOL_TIMEZONE constant as Asia/Kolkata", () => {
    expect(POOL_TIMEZONE).toBe("Asia/Kolkata");
  });

  it("calculates pool date correctly irrespective of UTC offset", () => {
    // 2026-10-31 23:30 UTC is 2026-11-01 05:00 in Asia/Kolkata (+05:30)
    const lateUtcDate = new Date("2026-10-31T23:30:00Z");
    expect(getPoolDate(lateUtcDate)).toBe("2026-11-01");
  });

  it("calculates pool time and hour correctly in IST", () => {
    // 04:30 UTC is 10:00 in IST (+05:30)
    const sampleUtcDate = new Date("2026-10-31T04:30:00Z");
    expect(getPoolTime(sampleUtcDate)).toBe("10:00");
    expect(getPoolHour(sampleUtcDate)).toBe(10);
  });

  it("generates strict +05:30 bounds for a given date", () => {
    const { startOfDay, endOfDay } = getPoolDayBounds("2026-10-31");
    // Start of day in IST is 2026-10-31T00:00:00+05:30 => 2026-10-30T18:30:00.000Z
    expect(startOfDay.toISOString()).toBe("2026-10-30T18:30:00.000Z");
    // End of day in IST is 2026-10-31T23:59:59.999+05:30 => 2026-10-31T18:29:59.999Z
    expect(endOfDay.toISOString()).toBe("2026-10-31T18:29:59.999Z");
  });

  it("parses pool date and time with strict +05:30 offset", () => {
    const dt = getPoolDateTime("2026-10-31", "17:00");
    // 17:00 IST is 11:30 UTC
    expect(dt.toISOString()).toBe("2026-10-31T11:30:00.000Z");
  });

  it("formats slot 24h string into 12h AM/PM format accurately", () => {
    expect(formatSlotTime("09:00")).toBe("09:00 AM");
    expect(formatSlotTime("12:00")).toBe("12:00 PM");
    expect(formatSlotTime("16:00")).toBe("04:00 PM");
    expect(formatSlotTime("17:30")).toBe("05:30 PM");
    expect(formatSlotTime("23:00")).toBe("11:00 PM");
  });

  it("formats dates and times with Indian Standard Time localization", () => {
    const d = new Date("2026-10-31T11:30:00Z"); // 17:00 IST
    expect(formatPoolDate(d)).toContain("31");
    expect(formatPoolDate(d)).toContain("2026");
    expect(formatPoolTime(d, true)).toContain("IST");
  });
});

