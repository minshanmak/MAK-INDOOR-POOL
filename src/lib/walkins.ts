import { prisma as defaultPrisma } from "@/lib/prisma";
import { getPoolDateTime } from "@/lib/timezone";

/**
 * Checks whether an active walk-in swimmer's session overlaps with a target date and time interval.
 * Uses exact millisecond timestamps in Indian Standard Time (Asia/Kolkata).
 */
export function isWalkInOverlapping(
  walkIn: { checkInTime: Date | string; durationHours?: number | null; status?: string },
  targetDate: string,
  targetStartTime: string,
  targetEndTime: string
): boolean {
  // If already checked out, no overlap
  if (walkIn.status && walkIn.status !== "ACTIVE") {
    return false;
  }

  const wStartMs = new Date(walkIn.checkInTime).getTime();
  const durationHours = Number(walkIn.durationHours) || 1;
  const wEndMs = wStartMs + durationHours * 60 * 60 * 1000;

  try {
    const targetStartMs = getPoolDateTime(targetDate, targetStartTime).getTime();
    const targetEndMs = getPoolDateTime(targetDate, targetEndTime).getTime();

    return Math.max(wStartMs, targetStartMs) < Math.min(wEndMs, targetEndMs);
  } catch {
    return false;
  }
}

/**
 * Calculates remaining active minutes for a walk-in.
 */
export function getWalkInRemainingMinutes(
  walkIn: { checkInTime: Date | string; durationHours?: number | null },
  now: Date = new Date()
): { remainingMinutes: number; isExpired: boolean; targetEndTime: Date } {
  const checkInMs = new Date(walkIn.checkInTime).getTime();
  const durationHours = Number(walkIn.durationHours) || 1;
  const targetEndMs = checkInMs + durationHours * 60 * 60 * 1000;
  const targetEndTime = new Date(targetEndMs);
  const diffMs = targetEndMs - now.getTime();

  return {
    remainingMinutes: Math.max(0, Math.ceil(diffMs / (60 * 1000))),
    isExpired: diffMs <= 0,
    targetEndTime,
  };
}

/**
 * Automatically checks out any active walk-in swimmers whose duration has elapsed.
 * Ensures live occupancy and capacity checks are always 100% accurate, even if
 * counter staff forgets to manually click "Check-Out".
 */
export async function autoCheckoutExpiredWalkIns(db: any = defaultPrisma): Promise<number> {
  const now = new Date();
  
  // Find all walk-ins currently marked ACTIVE
  const activeWalkIns = await db.walkIn.findMany({
    where: { status: "ACTIVE" },
  });

  if (!activeWalkIns || activeWalkIns.length === 0) {
    return 0;
  }

  const expiredIds: string[] = [];

  for (const w of activeWalkIns) {
    const durationHours = Number(w.durationHours) || 1;
    const durationMs = durationHours * 60 * 60 * 1000;
    const checkInMs = new Date(w.checkInTime).getTime();

    // If current time has reached or passed checkInTime + duration
    if (now.getTime() >= checkInMs + durationMs) {
      expiredIds.push(w.id);
    }
  }

  if (expiredIds.length > 0) {
    await db.walkIn.updateMany({
      where: { id: { in: expiredIds } },
      data: {
        status: "CHECKED_OUT",
        checkOutTime: now,
      },
    });
  }

  return expiredIds.length;
}
