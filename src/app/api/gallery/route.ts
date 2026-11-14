import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseGalleryPhotos, DEFAULT_GALLERY_PHOTOS } from "@/lib/default-gallery";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.poolSetting.findUnique({
      where: { id: "singleton_settings" },
      select: { galleryData: true },
    });

    const photos = parseGalleryPhotos(settings?.galleryData);
    return NextResponse.json({ photos });
  } catch (err) {
    console.error("Error fetching gallery photos:", err);
    return NextResponse.json({ photos: DEFAULT_GALLERY_PHOTOS });
  }
}

