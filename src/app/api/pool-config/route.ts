import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.poolSetting.findUnique({
      where: { id: "singleton_settings" },
    });

    return NextResponse.json({
      maxCapacity: settings?.maxCapacity ?? 25,
      holdTtlMinutes: settings?.holdTtlMinutes ?? 15,
      defaultPublicRate: settings?.defaultPublicRate ?? 150,
      defaultFamilyBaseRate: settings?.defaultFamilyBaseRate ?? 1500,
      familyBaseGuests: settings?.familyBaseGuests ?? 12,
      familyExtraRate: settings?.familyExtraRate ?? 100,
      openHour: settings?.openHour ?? 9,
      closeHour: settings?.closeHour ?? 23,
      publicEndHour: settings?.publicEndHour ?? 16,
      poolName: settings?.poolName || "M.A.K Indoor Pool",
      address: settings?.address || "Kalathingalpara, Moonniyur, Malappuram, Kerala",
      contactPhone: settings?.contactPhone || "+91 98470 12345",
    });
  } catch (err: any) {
    console.error("Error fetching pool config:", err);
    return NextResponse.json({
      maxCapacity: 25,
      holdTtlMinutes: 15,
      defaultPublicRate: 150,
      defaultFamilyBaseRate: 1500,
      familyBaseGuests: 12,
      familyExtraRate: 100,
      openHour: 9,
      closeHour: 23,
      publicEndHour: 16,
      poolName: "M.A.K Indoor Pool",
    });
  }
}
