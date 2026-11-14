export interface GalleryPhotoItem {
  id: string;
  title: string;
  category: "POOL" | "KIDS" | "LOUNGE" | "FACILITIES" | "SAFETY";
  categoryLabel: string;
  desc: string;
  src: string;
  isFeatured?: boolean;
}

export const GALLERY_CATEGORIES = [
  { id: "ALL", label: "All Photos" },
  { id: "POOL", label: "Main Pool" },
  { id: "KIDS", label: "Kids Pool" },
  { id: "LOUNGE", label: "Lounge" },
  { id: "FACILITIES", label: "Facilities" },
  { id: "SAFETY", label: "Water & Safety" },
] as const;

export const DEFAULT_GALLERY_PHOTOS: GalleryPhotoItem[] = [
  {
    id: "gal-1",
    title: "Crystal Clear Main Indoor Pool",
    category: "POOL",
    categoryLabel: "Main Pool",
    desc: "Temperature-balanced indoor pool featuring 24/7 dual sand filtration and atmospheric underwater lighting.",
    src: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=85",
    isFeatured: true,
  },
  {
    id: "gal-2",
    title: "Dedicated Shallow Kids Pool",
    category: "KIDS",
    categoryLabel: "Kids Pool",
    desc: "Safe and shallow indoor splash pool built within the facility for toddlers and young children, included with all bookings.",
    src: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=85",
    isFeatured: true,
  },
  {
    id: "gal-3",
    title: "Supervised Kids Splash & Play Area",
    category: "KIDS",
    categoryLabel: "Kids Splash",
    desc: "Gentle water depth with complimentary flotation gear provided for a fun and secure family swim experience.",
    src: "https://images.unsplash.com/photo-1560090995-01632a28895b?auto=format&fit=crop&w=1200&q=85",
    isFeatured: true,
  },
  {
    id: "gal-4",
    title: "Reception & Family Waiting Lounge",
    category: "LOUNGE",
    categoryLabel: "Lounge Area",
    desc: "Spacious, air-conditioned waiting lounge for parents, families, and accompanying visitors.",
    src: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "gal-5",
    title: "Sanitized Shower & Pre-Swim Stalls",
    category: "FACILITIES",
    categoryLabel: "Showers",
    desc: "Private shower stalls with warm water and mandatory hygiene rinse stations.",
    src: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "gal-6",
    title: "Secure Lockers & Changing Rooms",
    category: "FACILITIES",
    categoryLabel: "Lockers",
    desc: "Keycard digital lockers and private changing suites ensuring 100% guest privacy.",
    src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "gal-7",
    title: "Evening Ambient Lighting",
    category: "POOL",
    categoryLabel: "Atmosphere",
    desc: "Warm evening illumination designed specially for exclusive family gatherings and celebrations.",
    src: "https://images.unsplash.com/photo-1565073624443-41a4a49c9535?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "gal-8",
    title: "Continuous Water Sanitation Lab",
    category: "SAFETY",
    categoryLabel: "Hygiene",
    desc: "High-grade UV sterilizers and twice-daily pH (7.2–7.6) and chlorine testing logs.",
    src: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=85",
  },
];

export function parseGalleryPhotos(rawJson: string | null | undefined): GalleryPhotoItem[] {
  if (!rawJson) return DEFAULT_GALLERY_PHOTOS;
  try {
    const parsed = JSON.parse(rawJson);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error("Failed to parse gallery JSON", err);
  }
  return DEFAULT_GALLERY_PHOTOS;
}

