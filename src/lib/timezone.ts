export const POOL_TIMEZONE = "Asia/Kolkata";

/**
 * Returns current date string in YYYY-MM-DD format in Asia/Kolkata timezone.
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
 * Returns current time string in HH:mm format in Asia/Kolkata timezone.
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
 * Creates Date bounds for a given YYYY-MM-DD date in Asia/Kolkata timezone (+05:30).
 */
export function getPoolDayBounds(dateStr: string): { startOfDay: Date; endOfDay: Date } {
  const startOfDay = new Date(`${dateStr}T00:00:00+05:30`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999+05:30`);
  return { startOfDay, endOfDay };
}

/**
 * Parses a date string and time string in Asia/Kolkata timezone.
 */
export function getPoolDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00+05:30`);
}
