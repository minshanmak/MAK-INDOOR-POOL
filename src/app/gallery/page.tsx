"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Waves,
  ArrowRight,
  Clock,
  Sparkles,
  MapPin,
  CheckCircle2,
} from "lucide-react";

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState("ALL");

  const photos = [
    {
      title: "Crystal Clear Heated Main Pool",
      category: "POOL",
      categoryLabel: "Main Pool",
      desc: "Temperature-controlled indoor swimming pool with ambient underwater illumination and dual sand filtration.",
      src: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=85",
    },
    {
      title: "Reception & Family Lounge",
      category: "LOUNGE",
      categoryLabel: "Lounge Area",
      desc: "Spacious and comfortable waiting lounge for families, parents, and accompanying guests.",
      src: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=85",
    },
    {
      title: "Sanitized Shower & Wash Stalls",
      category: "FACILITIES",
      categoryLabel: "Showers",
      desc: "Separate high-pressure shower stalls with warm water and strict pre-swim hygiene protocols.",
      src: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=1200&q=85",
    },
    {
      title: "Secure Lockers & Changing Area",
      category: "FACILITIES",
      categoryLabel: "Lockers",
      desc: "Digital key lockers and dedicated changing rooms ensuring complete guest privacy.",
      src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=85",
    },
    {
      title: "Evening Ambient Lighting",
      category: "POOL",
      categoryLabel: "Atmosphere",
      desc: "Warm evening ambience created especially for exclusive private family slots and celebrations.",
      src: "https://images.unsplash.com/photo-1565073624443-41a4a49c9535?auto=format&fit=crop&w=1200&q=85",
    },
    {
      title: "Hospital-Grade Water Treatment",
      category: "SAFETY",
      categoryLabel: "Water Safety",
      desc: "Continuous filtration cycles and twice-daily pH and chlorine tests logged by certified operators.",
      src: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=85",
    },
  ];

  const filteredPhotos =
    activeCategory === "ALL"
      ? photos
      : photos.filter((p) => p.category === activeCategory);

  return (
    <div className="bg-[#F0F5FA] text-slate-800 space-y-12 sm:space-y-16 pb-20">
      {/* 1. HERO HEADER BANNER (Consistent with Mockup) */}
      <section className="relative min-h-[280px] sm:min-h-[340px] flex items-center overflow-hidden bg-[#07172C]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=2000&q=85')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07172C]/95 via-[#0A2647]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07172C] via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 z-10 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="max-w-xl space-y-3 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-cyan-200">
              <span>M.A.K Indoor Pool</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Explore Our Pool
            </h1>
            <p className="text-xs sm:text-sm text-cyan-100 font-normal leading-relaxed max-w-lg">
              Take a visual tour through our pristine indoor pool, modern amenities, family lounge, and hygiene facilities.
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-3xl p-4 text-white text-xs space-y-1.5 shadow-xl shrink-0">
            <div className="flex items-center gap-2 font-bold text-xs text-white">
              <Clock className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>Inspection Hours: 10:00 AM – 3:00 PM</span>
            </div>
            <div className="text-[11px] text-cyan-100">
              • Visitors and families welcome for pool tours
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY FILTER PILLS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
        <div className="flex flex-wrap items-center gap-2 bg-white/80 backdrop-blur-md p-2 rounded-3xl border border-white shadow-xs max-w-max mx-auto">
          {[
            { id: "ALL", label: "All Photos" },
            { id: "POOL", label: "Main Pool" },
            { id: "LOUNGE", label: "Lounge Area" },
            { id: "FACILITIES", label: "Showers & Lockers" },
            { id: "SAFETY", label: "Water Safety" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                activeCategory === cat.id
                  ? "bg-[#1D68BD] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* 3. PHOTO GALLERY GRID (Smooth Rounded Cards - Exact Match) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-3 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] hover:shadow-lg transition-all duration-300 group flex flex-col justify-between"
            >
              <div className="rounded-2xl overflow-hidden aspect-[16/11] relative">
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                  {item.categoryLabel}
                </div>
              </div>

              <div className="p-3 space-y-1">
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#1D68BD] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. "READY TO SWIM?" CTA BANNER (Exact Match) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#0E5296] via-[#1A6BA8] to-[#0A3D73] rounded-3xl p-6 sm:p-9 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Ready to Swim?
            </h2>
            <p className="text-cyan-100 text-xs sm:text-sm mt-1 max-w-xl font-normal leading-relaxed">
              Book your slot now and experience a clean, modern and family-friendly indoor pool.
            </p>
          </div>

          <Link
            href="/book"
            className="bg-white hover:bg-slate-100 active:scale-95 text-slate-900 font-black px-7 py-3 rounded-full text-xs sm:text-sm shadow-lg transition inline-flex items-center gap-2 shrink-0"
          >
            <span>Book Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
