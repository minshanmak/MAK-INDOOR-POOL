import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseGalleryPhotos, DEFAULT_GALLERY_PHOTOS } from "@/lib/default-gallery";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.poolSetting.findUnique({
      where: { id: "singleton_settings" },
      select: { galleryData: true, maxCapacity: true, holdTtlMinutes: true },
    });

    const photos = parseGalleryPhotos(settings?.galleryData);
    return NextResponse.json({
      photos,
      maxCapacity: settings?.maxCapacity ?? 25,
      holdTtlMinutes: settings?.holdTtlMinutes ?? 15,
    });
  } catch (err) {
    console.error("Error fetching gallery photos:", err);
    return NextResponse.json({ photos: DEFAULT_GALLERY_PHOTOS });
  }
}

