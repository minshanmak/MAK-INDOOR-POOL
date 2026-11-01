export const POOL_TIMEZONE = "Asia/Kolkata"; // Indian Standard Time (IST, UTC+05:30)

/**
 * Returns current date string in YYYY-MM-DD format strictly in Asia/Kolkata timezone.
 */
export function getPoolDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: POOL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Returns current time string in HH:mm (24h) format strictly in Asia/Kolkata timezone.
 */
export function getPoolTime(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: POOL_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * Returns current IST hour as an integer (0-23).
 */
export function getPoolHour(date: Date = new Date()): number {
  return parseInt(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: POOL_TIMEZONE,
      hour: "2-digit",
      hour12: false,
    }).format(date),
    10
  );
}

/**
 * Creates Date bounds for a given YYYY-MM-DD date in Asia/Kolkata timezone (+05:30).
 */
export function getPoolDayBounds(dateStr: string): { startOfDay: Date; endOfDay: Date } {
  const startOfDay = new Date(`${dateStr}T00:00:00+05:30`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999+05:30`);
  return { startOfDay, endOfDay };
}

/**
 * Parses a date string and time string strictly in Asia/Kolkata timezone (+05:30).
 */
export function getPoolDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00+05:30`);
}

/**
 * Formats a Date or ISO string into localized IST date string (e.g. "31 Oct 2026").
 */
export function formatPoolDate(dateInput: Date | string): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: POOL_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Formats a Date or ISO string into localized IST time string (e.g. "01:30 PM IST").
 */
export function formatPoolTime(dateInput: Date | string, includeSuffix = true): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const time = new Intl.DateTimeFormat("en-IN", {
    timeZone: POOL_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  return includeSuffix ? `${time} IST` : time;
}

/**
 * Formats a full timestamp in IST (e.g. "31 Oct 2026, 01:30 PM IST").
 */
export function formatPoolDateTime(dateInput: Date | string): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return `${formatPoolDate(d)}, ${formatPoolTime(d, true)}`;
}

/**
 * Formats 24h slot "14:00" into 12h representation "02:00 PM".
 */
export function formatSlotTime(timeStr: string): string {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${String(m || 0).padStart(2, "0")} ${period}`;
}
