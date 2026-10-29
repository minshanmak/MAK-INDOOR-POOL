import React from "react";
import Link from "next/link";
import { Sparkles, Waves, Shield, Eye } from "lucide-react";

export default function GalleryPage() {
  const images = [
    {
      title: "Crystal Clear Pool Water",
      category: "Main Pool",
      desc: "Temperature-controlled 25m indoor swimming pool with ambient underwater LED illumination.",
    },
    {
      title: "Private Family Lounge Deck",
      category: "Family Zone",
      desc: "Comfortable seating area for families and parents overseeing kids swimming safely.",
    },
    {
      title: "Dual Sand & UV Filtration System",
      category: "Water Safety",
      desc: "Commercial filtration room cycling pool volume every 4 hours with twice-daily chemical balance logs.",
    },
    {
      title: "Spacious Private Changing Rooms",
      category: "Amenities",
      desc: "Individual family and gender-separated shower stalls with hot water and secure locker storage.",
    },
    {
      title: "Toddler & Kids Safety Shallow Zone",
      category: "Safety Zone",
      desc: "Graduated entry step with dedicated 2.5ft shallow zone equipped with safety flotation aids.",
    },
    {
      title: "Evening Ambient Lighting",
      category: "Atmosphere",
      desc: "Soothing nighttime lights designed for exclusive family gatherings and celebrations.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Facility Gallery</h1>
        <p className="text-slate-600 text-sm">
          Take a visual tour through M.A.K Indoor Pool's state-of-the-art facilities, pool deck, and hygiene infrastructure.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((item, idx) => (
          <div
            key={idx}
            className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
          >
            {/* Visual aquatic placeholder illustration */}
            <div className="h-48 bg-gradient-to-tr from-ocean-900 via-ocean-800 to-lagoon-900 flex items-center justify-center text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#5eead4_1px,transparent_1px)] [background-size:12px_12px]" />
              <div className="text-center p-4 z-10 space-y-2">
                <Waves className="w-10 h-10 text-lagoon-400 mx-auto group-hover:scale-110 transition duration-300" />
                <span className="text-xs uppercase font-extrabold tracking-widest text-lagoon-300 block">
                  {item.category}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-2">
              <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-ocean-50 border border-ocean-200 rounded-2xl p-8 text-center max-w-2xl mx-auto space-y-4">
        <h3 className="text-xl font-bold text-ocean-950">Want to visit or inspect before booking?</h3>
        <p className="text-sm text-ocean-800">
          Walk-in inspections are welcome daily between 10:00 AM and 3:00 PM. Our duty staff will happily guide you through the pool deck.
        </p>
        <Link
          href="/book"
          className="inline-block bg-ocean-600 hover:bg-ocean-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition"
        >
          Book Your Session Now &rarr;
        </Link>
      </div>
    </div>
  );
}
