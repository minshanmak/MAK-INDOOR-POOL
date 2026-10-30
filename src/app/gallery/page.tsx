"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Waves,
  ShieldCheck,
  Droplets,
  Lock,
  ArrowRight,
  Maximize2,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";

interface FacilityZone {
  id: string;
  category: string;
  title: string;
  spec: string;
  specs: { label: string; value: string }[];
  description: string;
  safetyFeatures: string[];
}

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  const facilityZones: FacilityZone[] = [
    {
      id: "main-basin",
      category: "AQUATICS",
      title: "25-Meter Main Indoor Basin",
      spec: "25m × 10m • 2.5 ft to 5.0 ft Graduated Depth",
      specs: [
        { label: "Water Volume", value: "185,000 Liters" },
        { label: "Graduated Slope", value: "2.5 ft → 5.0 ft" },
        { label: "Turnover Rate", value: "Every 4 Hours" },
        { label: "Lane Capacity", value: "3 Marked Lanes" },
      ],
      description:
        "Engineered with a gently sloping non-slip ceramic floor that allows toddlers and non-swimmers to comfortably stand in the 2.5 ft shallow zone while offering full stroke clearance in the 5.0 ft deep end.",
      safetyFeatures: [
        "Continuous perimeter overflow gutter",
        "Anti-entrapment dual main drains",
        "Recessed step alcoves with marine-grade 316 stainless rails",
      ],
    },
    {
      id: "filtration-plant",
      category: "WATER HYGIENE",
      title: "Commercial Sand & UV Treatment Plant",
      spec: "Multi-Stage Silica Filtration + Dual 55W UV Disinfection",
      specs: [
        { label: "Filtration Media", value: "#20 Grade Silica Sand" },
        { label: "Secondary Disinfection", value: "Germicidal UV-C (254nm)" },
        { label: "Target Free Chlorine", value: "1.5 – 3.0 ppm" },
        { label: "Target pH Range", value: "7.2 – 7.6" },
      ],
      description:
        "Continuous recirculating filtration system that strips micro-particles and neutralizes 99.9% of waterborne pathogens without the harsh chlorine odor common in municipal public pools.",
      safetyFeatures: [
        "Twice-daily digital photometer chemical audits",
        "Automated dosing pumps with emergency shutoff",
        "Full volume turnover 6 times in 24 hours",
      ],
    },
    {
      id: "family-suites",
      category: "PRIVACY",
      title: "Private Family Changing Suites",
      spec: "Dedicated Changing, Showers & Restrooms for Exclusive Sessions",
      specs: [
        { label: "Hot Water", value: "Instant Gas Geysers" },
        { label: "Changing Stalls", value: "Individual Lockable Units" },
        { label: "Lockers", value: "Keyed Waterproof Lockers" },
        { label: "Privacy Rating", value: "100% Lockable Doors" },
      ],
      description:
        "Spacious, non-slip tiled changing suites designed for families with children. Heated rain showers, diaper-changing counters, and secure storage lockers keep your personal belongings safe while you swim.",
      safetyFeatures: [
        "Antimicrobial floor tiling with continuous drainage",
        "Sanitized after every family session",
        "Direct private access to pool deck",
      ],
    },
    {
      id: "deck-lounge",
      category: "FACILITY",
      title: "Enclosed Pool Deck & Spectator Lounge",
      spec: "Climate-Controlled Viewing Deck & Parent Lounge",
      specs: [
        { label: "Ventilation", value: "Cross-draft Humidity Extraction" },
        { label: "Deck Surface", value: "R11 Anti-Slip Ceramic Tile" },
        { label: "Seating", value: "Waterproof Rattan Loungers" },
        { label: "Sightlines", value: "Full 360° Pool Basin View" },
      ],
      description:
        "A quiet, air-circulated deck area overlooking the entire pool basin. Ideal for parents supervising children or family members who prefer relaxing with a warm drink while others swim.",
      safetyFeatures: [
        "Lifebuoys and reach poles mounted every 8 meters",
        "First-aid response kit and AED station on deck",
        "Dry-zone separation prevents slipping",
      ],
    },
    {
      id: "safety-shallow",
      category: "AQUATICS",
      title: "Dedicated Toddler & Learn-to-Swim Zone",
      spec: "2.5 ft Entry Steps with Integrated Seating Ledge",
      specs: [
        { label: "Water Depth", value: "Strict 2.5 ft Constant" },
        { label: "Entry Style", value: "Broad Graduated Roman Steps" },
        { label: "Aids Provided", value: "Arm bands, kickboards & vests" },
        { label: "Supervision Zone", value: "Within arm's length" },
      ],
      description:
        "The shallow bay features broad submerged steps where toddlers can sit and splash safely. Certified flotation vests and kickboards are provided complimentary for all visiting children.",
      safetyFeatures: [
        "High-contrast tile edge markers",
        "Zero sudden drops or steep transitions",
        "Complimentary sanitized kids life jackets",
      ],
    },
    {
      id: "night-lighting",
      category: "PRIVACY",
      title: "Evening Ambient Lighting & Atmosphere",
      spec: "Warm Deck Illumination + Submerged Soft LED Beams",
      specs: [
        { label: "Lighting Color", value: "Warm 3000K & Deep Cyan" },
        { label: "Exclusive Hours", value: "4:00 PM – 11:00 PM" },
        { label: "Audio", value: "Bluetooth Deck Speakers Available" },
        { label: "Center Status", value: "Doors Locked to Public" },
      ],
      description:
        "During exclusive family hours (4 PM to 11 PM), overhead glare is dimmed in favor of soothing submerged pool lights and warm architectural sconces, creating a calm, celebratory ambiance for family gatherings.",
      safetyFeatures: [
        "IP68 waterproof underwater luminaires",
        "Battery backup emergency egress lighting",
        "Complete exterior privacy with frosted architectural glazing",
      ],
    },
  ];

  const categories = ["ALL", "AQUATICS", "WATER HYGIENE", "PRIVACY", "FACILITY"];

  const filteredZones =
    activeCategory === "ALL"
      ? facilityZones
      : facilityZones.filter((z) => z.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      {/* Editorial Page Header */}
      <div className="border-b border-slate-200 pb-6 max-w-3xl">
        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-xs font-semibold mb-2">
          <span>Moonniyur Facility Tour</span>
          <span className="text-slate-400">•</span>
          <span>Technical Specifications &amp; Standards</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Facility Architecture & Water Infrastructure
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Inspect our 25-meter indoor pool basin, multi-stage silica sand filtration plant, private family changing suites, and dedicated toddler shallow zones before your visit.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-3">
        <span className="text-xs font-semibold text-slate-500 mr-2">Filter Zone:</span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeCategory === cat
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {cat === "ALL" ? "All Zones (6)" : cat}
          </button>
        ))}
      </div>

      {/* Facility Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredZones.map((zone) => (
          <div
            key={zone.id}
            className="bg-white border border-slate-200/90 rounded-lg overflow-hidden shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
          >
            <div>
              {/* Technical Spec Blueprint Header */}
              <div className="bg-[#0B192C] text-white p-5 border-b border-slate-800">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                    {zone.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">ZONE SPEC</span>
                </div>
                <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                  {zone.title}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">{zone.spec}</p>
              </div>

              {/* Engineering Metrics Matrix */}
              <div className="grid grid-cols-2 gap-px bg-slate-100 border-b border-slate-200 text-xs">
                {zone.specs.map((s, idx) => (
                  <div key={idx} className="bg-white p-3">
                    <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                      {s.label}
                    </span>
                    <span className="font-bold text-slate-800 tabular-nums text-xs mt-0.5 block">
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Description Body */}
              <div className="p-5 space-y-4 text-xs text-slate-600 leading-relaxed">
                <p>{zone.description}</p>

                <div className="space-y-1.5 pt-3 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-800 tracking-wider block">
                    Safety & Hygiene Controls
                  </span>
                  {zone.safetyFeatures.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2 text-[11px] text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Card Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Daily verified hygiene</span>
              <Link
                href="/book"
                className="text-cyan-700 hover:text-cyan-800 font-bold flex items-center gap-1"
              >
                <span>Reserve Slot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Facility Inspection Invitation */}
      <div className="bg-[#0B192C] text-white rounded-xl p-8 border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
              Walk-in Deck Inspection
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Prefer to see the pool before reserving?
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              You are welcome to inspect our pool basin, water clarity, and changing rooms any day between <strong>10:00 AM and 3:00 PM</strong> during public swimming hours. Our duty staff will show you around.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link
              href="/contact"
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2.5 rounded-lg text-xs border border-slate-700 transition text-center"
            >
              Get Directions to Moonniyur
            </Link>
            <Link
              href="/book"
              className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-xs transition text-center"
            >
              Book a Slot Online &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
