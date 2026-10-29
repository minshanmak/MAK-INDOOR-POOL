"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Waves,
  ShieldCheck,
  Calendar,
  Clock,
  Users,
  Sparkles,
  ArrowRight,
  Droplets,
  HeartHandshake,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { translations, Language } from "@/lib/i18n";

export default function HomePage() {
  const [lang, setLang] = useState<Language>("en");

  useEffect(() => {
    const updateLang = () => {
      const saved = (localStorage.getItem("mak_lang") as Language) || "en";
      setLang(saved);
    };
    updateLang();
    window.addEventListener("languageChange", updateLang);
    return () => window.removeEventListener("languageChange", updateLang);
  }, []);

  const t = translations[lang];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-ocean-950 via-ocean-900 to-ocean-800 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-ocean-800/80 border border-ocean-700/80 px-4 py-1.5 rounded-full text-xs font-semibold text-lagoon-300 shadow-sm">
            <Sparkles className="w-4 h-4 text-lagoon-400" />
            <span>{t.tagline}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            {t.heroTitle}
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-ocean-200 leading-relaxed">
            {t.heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Link
              href="/book"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-gradient-to-r from-lagoon-500 to-ocean-500 hover:from-lagoon-400 hover:to-ocean-400 text-ocean-950 font-bold px-8 py-4 rounded-xl text-base shadow-xl shadow-lagoon-500/20 transition-all hover:scale-105"
            >
              <Calendar className="w-5 h-5" />
              {t.reserveSlot}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-ocean-800/80 hover:bg-ocean-700 text-white font-semibold px-6 py-4 rounded-xl text-base border border-ocean-700 transition"
            >
              {t.viewRates}
            </Link>
          </div>

          {/* Quick Schedule Pill Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto pt-8 text-left">
            <div className="bg-ocean-900/60 border border-ocean-700/60 p-5 rounded-2xl flex items-start gap-4">
              <div className="p-3 bg-ocean-800 rounded-xl text-lagoon-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-lagoon-400 tracking-wider">9:00 AM – 4:00 PM</span>
                <h3 className="font-bold text-lg text-white">Daily Public Swimming</h3>
                <p className="text-sm text-ocean-300 mt-1">
                  Shared sessions for individual swimmers and friends at ₹150/hr per person.
                </p>
              </div>
            </div>

            <div className="bg-ocean-900/60 border border-lagoon-500/30 p-5 rounded-2xl flex items-start gap-4 shadow-lg shadow-lagoon-950/40">
              <div className="p-3 bg-lagoon-950/80 border border-lagoon-700 rounded-xl text-lagoon-400">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-lagoon-300 tracking-wider">4:00 PM – 11:00 PM</span>
                <h3 className="font-bold text-lg text-white">Exclusive Family Booking</h3>
                <p className="text-sm text-ocean-300 mt-1">
                  100% private pool reservation for your family at ₹1,500/hr (up to 12 persons).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Designed for Family Comfort & Hygiene
          </h2>
          <p className="text-slate-600 mt-3 text-base">
            M.A.K Indoor Pool combines hospital-grade water purification with complete privacy and premium amenities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-ocean-300 transition group">
            <div className="w-12 h-12 rounded-xl bg-ocean-50 text-ocean-600 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <Droplets className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Dual Filtration & UV Sanitation</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Our water is continuously cycled through heavy-duty sand filters and UV sanitizers. pH and chlorine levels are tested and logged twice daily.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-lagoon-300 transition group">
            <div className="w-12 h-12 rounded-xl bg-lagoon-50 text-lagoon-600 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">100% Family Privacy</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              During evening family slots, the entrance is locked exclusively for your group. Private changing rooms, showers, and lounge seating available.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-300 transition group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Certified Lifeguard & Safety</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Life rings, kid-safe flotation vests, non-slip pool deck tile flooring, and safety equipment inspected before every operational shift.
            </p>
          </div>
        </div>
      </section>

      {/* Booking CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-ocean-900 to-ocean-950 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl border border-ocean-800">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to Book Your Pool Time?
            </h2>
            <p className="text-ocean-200 text-sm sm:text-base">
              Online booking takes less than 2 minutes. Secure your private family slot with just ₹750 advance payment.
            </p>
          </div>
          <Link
            href="/book"
            className="shrink-0 bg-gradient-to-r from-lagoon-400 to-lagoon-500 hover:from-lagoon-300 hover:to-lagoon-400 text-ocean-950 font-bold px-8 py-4 rounded-xl shadow-lg transition-transform hover:scale-105"
          >
            {t.reserveSlot}
          </Link>
        </div>
      </section>
    </div>
  );
}
