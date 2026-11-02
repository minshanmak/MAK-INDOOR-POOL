import { prisma as defaultPrisma } from "@/lib/prisma";

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
