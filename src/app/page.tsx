"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Waves,
  ShieldCheck,
  Calendar,
  Clock,
  Users,
  ArrowRight,
  Droplets,
  Sparkles,
  HeartHandshake,
  CheckCircle2,
  Check,
  BadgeCheck,
  Award,
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
    <div className="space-y-16 pb-20 bg-[#F8FAFC]">
      {/* 1. Hero Section matching reference image */}
      <section className="relative min-h-[520px] sm:min-h-[580px] flex items-center bg-[#07172C] overflow-hidden">
        {/* Background Pool Photograph with Refined Dark Gradient Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-45 sm:opacity-55 scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07172C] via-[#07172C]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07172C] via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 z-10 w-full">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              M.A.K Indoor Pool
            </h1>

            <p className="text-base sm:text-lg text-slate-200 font-medium leading-relaxed">
              A Clean, Safe and Family Friendly Indoor Swimming Experience
            </p>

            {/* Feature Pills Matching Reference */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00838F]/25 border border-[#00BCD4]/40 text-cyan-200 text-xs font-semibold backdrop-blur-xs">
                <div className="w-4 h-4 rounded-full bg-[#00838F] flex items-center justify-center text-white shrink-0">
                  <Sparkles className="w-2.5 h-2.5" />
                </div>
                <span>Clean &amp; Hygienic Environment</span>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00838F]/25 border border-[#00BCD4]/40 text-cyan-200 text-xs font-semibold backdrop-blur-xs">
                <div className="w-4 h-4 rounded-full bg-[#00838F] flex items-center justify-center text-white shrink-0">
                  <Users className="w-2.5 h-2.5" />
                </div>
                <span>Family Friendly Facility</span>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00838F]/25 border border-[#00BCD4]/40 text-cyan-200 text-xs font-semibold backdrop-blur-xs">
                <div className="w-4 h-4 rounded-full bg-[#00838F] flex items-center justify-center text-white shrink-0">
                  <Award className="w-2.5 h-2.5" />
                </div>
                <span>Affordable Pricing</span>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00838F]/25 border border-[#00BCD4]/40 text-cyan-200 text-xs font-semibold backdrop-blur-xs">
                <div className="w-4 h-4 rounded-full bg-[#00838F] flex items-center justify-center text-white shrink-0">
                  <ShieldCheck className="w-2.5 h-2.5" />
                </div>
                <span>Safe &amp; Supervised</span>
              </div>
            </div>

            {/* Two Action Buttons Matching Reference */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <Link
                href="/book"
                className="bg-[#00838F] hover:bg-[#007079] text-white font-bold px-6 py-3 rounded-lg text-xs tracking-wide shadow-md transition duration-150 inline-flex items-center gap-2"
              >
                <span>Book Your Slot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/pricing"
                className="border border-white/70 hover:bg-white/10 text-white font-bold px-6 py-3 rounded-lg text-xs tracking-wide backdrop-blur-2xs transition duration-150"
              >
                View Prices
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 4 Core Features Matching Reference Image */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y sm:divide-y-0 lg:divide-x divide-slate-100">
            {/* Feature 1 */}
            <div className="text-center space-y-2 pt-4 sm:pt-0">
              <div className="w-12 h-12 mx-auto rounded-full bg-cyan-50 text-[#00838F] flex items-center justify-center">
                <Waves className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="font-bold text-sm text-[#0A192F]">Public Swimming</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Open sessions for individuals and families
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center space-y-2 pt-4 sm:pt-0 lg:pl-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-cyan-50 text-[#00838F] flex items-center justify-center">
                <Users className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="font-bold text-sm text-[#0A192F]">Family Exclusive Booking</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Private pool time for your family and friends
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center space-y-2 pt-4 sm:pt-0 lg:pl-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-cyan-50 text-[#00838F] flex items-center justify-center">
                <BadgeCheck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="font-bold text-sm text-[#0A192F]">Clean &amp; Well Maintained</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Regular water checks and maintenance
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center space-y-2 pt-4 sm:pt-0 lg:pl-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-cyan-50 text-[#00838F] flex items-center justify-center">
                <HeartHandshake className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="font-bold text-sm text-[#0A192F]">Safe &amp; Friendly Staff</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Trained staff to ensure a safe experience
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. "Our Facility" Showcase Matching Reference Image */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0A192F] tracking-tight">
            Our Facility
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Modern indoor pool with clean water, comfortable facilities and a safe environment for all age groups.
          </p>
        </div>

        {/* 3 Photography Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Photo 1: Swimming Basin */}
          <div className="group bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden transition hover:shadow-md">
            <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
              <img
                src="https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80"
                alt="Main Indoor Swimming Pool"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-3 left-3 text-white">
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-300 block">
                  Main Basin
                </span>
                <span className="font-bold text-sm">25m Temperature-Controlled Pool</span>
              </div>
            </div>
          </div>

          {/* Photo 2: Changing Rooms & Hot Showers */}
          <div className="group bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden transition hover:shadow-md">
            <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
              <img
                src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"
                alt="Changing Suites and Showers"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-3 left-3 text-white">
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-300 block">
                  Private Suites
                </span>
                <span className="font-bold text-sm">Changing Rooms &amp; Hot Showers</span>
              </div>
            </div>
          </div>

          {/* Photo 3: Lounge & Spectator Area */}
          <div className="group bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden transition hover:shadow-md">
            <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
              <img
                src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
                alt="Lounge & Spectator Area"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-3 left-3 text-white">
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-300 block">
                  Reception
                </span>
                <span className="font-bold text-sm">Spectator &amp; Family Lounge</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Session Schedules & Pricing Breakdown Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Public Swimming Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#00838F] bg-teal-50 px-2.5 py-1 rounded">
                  DAYTIME SESSION • 9:00 AM – 4:00 PM
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">Shared Pool</span>
              </div>
              <h3 className="text-xl font-black text-[#0A192F]">Daily Public Swimming</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Open access swimming for individuals, fitness swimmers, and casual family visits. Capacity is capped at 25 swimmers to guarantee space and clean water.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#00838F]" />
                  <span>₹150 per person per hour</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#00838F]" />
                  <span>Walk-ins and online advance bookings accepted</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-[#0A192F]">₹150</span>
                <span className="text-xs text-slate-500"> / person / hr</span>
              </div>
              <Link
                href="/book?type=PUBLIC"
                className="bg-[#00838F] hover:bg-[#007079] text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs transition"
              >
                Book Public Session
              </Link>
            </div>
          </div>

          {/* Family Exclusive Card */}
          <div className="bg-white border-2 border-[#00838F]/30 rounded-xl p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-4 relative">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  EVENING SESSION • 4:00 PM – 11:00 PM
                </span>
                <span className="text-xs font-bold text-[#00838F] bg-teal-50 px-2 py-0.5 rounded">
                  100% PRIVATE
                </span>
              </div>
              <h3 className="text-xl font-black text-[#0A192F]">Family Exclusive Booking</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The entire pool facility and changing suites are locked exclusively for your family or private group. No outside guests are admitted during your booking.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#00838F]" />
                  <span>₹1,500 per hour (includes up to 12 persons)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#00838F]" />
                  <span>Additional guests: ₹100 per person per hour</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#00838F]" />
                  <span>₹750 advance payment to confirm slot</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-[#0A192F]">₹1,500</span>
                <span className="text-xs text-slate-500"> / hr (up to 12)</span>
              </div>
              <Link
                href="/book?type=FAMILY"
                className="bg-[#00838F] hover:bg-[#007079] text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs transition"
              >
                Book Family Slot
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
