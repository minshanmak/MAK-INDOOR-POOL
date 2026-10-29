import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.poolSetting.findUnique({
    where: { id: "singleton_settings" },
  });

  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Hard safety: Settings changes are OWNER or SUPER_ADMIN ONLY
  if (user.role !== "POOL_OWNER" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden: Only the Pool Owner can modify system settings." }, { status: 403 });
  }

  const body = await req.json();
  const {
    poolName,
    address,
    contactPhone,
    contactEmail,
    openHour,
    closeHour,
    publicEndHour,
    maxCapacity,
    defaultPublicRate,
    defaultFamilyBaseRate,
    familyBaseGuests,
    familyExtraRate,
    familyAdvanceAmount,
    holdTtlMinutes,
    maintenanceMode,
    maintenanceMessage,
    cancellationCutoffHours,
    rescheduleCutoffHours,
  } = body;

  const updated = await prisma.poolSetting.upsert({
    where: { id: "singleton_settings" },
    create: {
      id: "singleton_settings",
      poolName,
      address,
      contactPhone,
      contactEmail,
      openHour: Number(openHour),
      closeHour: Number(closeHour),
      publicEndHour: Number(publicEndHour),
      maxCapacity: Number(maxCapacity),
      defaultPublicRate: Number(defaultPublicRate),
      defaultFamilyBaseRate: Number(defaultFamilyBaseRate),
      familyBaseGuests: Number(familyBaseGuests),
      familyExtraRate: Number(familyExtraRate),
      familyAdvanceAmount: Number(familyAdvanceAmount),
      holdTtlMinutes: Number(holdTtlMinutes),
      maintenanceMode: Boolean(maintenanceMode),
      maintenanceMessage: maintenanceMessage || null,
      cancellationCutoffHours: Number(cancellationCutoffHours),
      rescheduleCutoffHours: Number(rescheduleCutoffHours),
    },
    update: {
      poolName,
      address,
      contactPhone,
      contactEmail,
      openHour: Number(openHour),
      closeHour: Number(closeHour),
      publicEndHour: Number(publicEndHour),
      maxCapacity: Number(maxCapacity),
      defaultPublicRate: Number(defaultPublicRate),
      defaultFamilyBaseRate: Number(defaultFamilyBaseRate),
      familyBaseGuests: Number(familyBaseGuests),
      familyExtraRate: Number(familyExtraRate),
      familyAdvanceAmount: Number(familyAdvanceAmount),
      holdTtlMinutes: Number(holdTtlMinutes),
      maintenanceMode: Boolean(maintenanceMode),
      maintenanceMessage: maintenanceMessage || null,
      cancellationCutoffHours: Number(cancellationCutoffHours),
      rescheduleCutoffHours: Number(rescheduleCutoffHours),
    },
  });

  await prisma.auditLog.create({
    data: {
      entityType: "SETTING",
      entityId: "singleton_settings",
      action: "UPDATE",
      performedByUserId: user.userId,
      userRole: user.role,
      details: `Owner updated pool settings. Public rate: ₹${defaultPublicRate}/hr, Family rate: ₹${defaultFamilyBaseRate}/hr, Capacity: ${maxCapacity}, Maintenance: ${maintenanceMode}`,
    },
  });

  return NextResponse.json({ success: true, settings: updated });
}
