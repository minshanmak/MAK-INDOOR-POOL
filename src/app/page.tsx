"use client";

import React from "react";
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
  Lock,
  Thermometer,
  Activity,
  CheckCircle,
} from "lucide-react";

export default function HomePage() {

  return (
    <div className="space-y-16 sm:space-y-24 pb-20 bg-[#F8FAFC]">
      {/* 1. HERO SECTION (Atmospheric Aquatic Luxury with Ambient Depth) */}
      <section className="relative min-h-[580px] sm:min-h-[640px] flex items-center bg-[#07172C] overflow-hidden">
        {/* Background Pool Photograph with Deep Vignette & Blur */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 sm:opacity-50 scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=2000&q=85')`,
          }}
        />
        {/* Refined gradient overlay for maximum text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#061220] via-[#07172C]/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061220] via-transparent to-transparent" />

        {/* Ambient aquatic glow */}
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-[#00838F]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 z-10 w-full">
          <div className="max-w-3xl space-y-6">
            {/* Live Operational Status Beacon */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-teal-500/30 text-xs font-semibold backdrop-blur-md shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-emerald-400">Open Daily: 9:00 AM – 11:00 PM</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">Moonniyur, Malappuram</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.08]">
              M.A.K{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-white bg-clip-text text-transparent">
                Indoor Pool
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-200 font-medium leading-relaxed max-w-2xl">
              Kerala’s purpose-built temperature-controlled indoor swimming sanctuary. Hospital-grade dual sand filtration, continuous hygiene testing, and 100% private family evening sessions.
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00838F]/20 border border-cyan-400/30 text-cyan-200 text-xs font-semibold backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Clean &amp; Hygienic Environment</span>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00838F]/20 border border-cyan-400/30 text-cyan-200 text-xs font-semibold backdrop-blur-xs">
                <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Family Friendly Facility</span>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00838F]/20 border border-cyan-400/30 text-cyan-200 text-xs font-semibold backdrop-blur-xs">
                <Award className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Affordable Pricing</span>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00838F]/20 border border-cyan-400/30 text-cyan-200 text-xs font-semibold backdrop-blur-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Safe &amp; Supervised</span>
              </div>
            </div>

            {/* Dual Actions: Primary High-Converting CTA + Secondary Outline */}
            <div className="flex flex-wrap items-center gap-3.5 pt-4">
              <Link
                href="/book"
                className="bg-[#00838F] hover:bg-[#007079] active:scale-[0.98] text-white font-bold px-7 py-3.5 rounded-xl text-xs sm:text-sm tracking-wide shadow-glow transition duration-150 inline-flex items-center gap-2 group"
              >
                <span>Book Your Slot Online</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/pricing"
                className="border border-white/60 hover:bg-white/10 hover:border-white text-white font-bold px-6 py-3.5 rounded-xl text-xs sm:text-sm tracking-wide backdrop-blur-xs transition duration-150"
              >
                View Prices &amp; Sessions
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom stats reassurance ribbon */}
        <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 border-t border-slate-800/80 backdrop-blur-md hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 grid grid-cols-4 divide-x divide-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2.5 px-4 justify-center">
              <Thermometer className="w-4 h-4 text-cyan-400 shrink-0" />
              <span><strong>28°C–30°C</strong> Heated Water</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 justify-center">
              <Users className="w-4 h-4 text-cyan-400 shrink-0" />
              <span><strong>25 Cap</strong> Daytime Limit</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 justify-center">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>100% Private</strong> Family Exclusivity</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 justify-center">
              <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
              <span><strong>Daily 4x</strong> Water Quality Tests</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 4 CORE PILLARS (Clean Modern Cards with Micro-Elevation) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y sm:divide-y-0 lg:divide-x divide-slate-100">
            {/* Feature 1 */}
            <div className="text-center space-y-2.5 pt-4 sm:pt-0 group">
              <div className="w-13 h-13 mx-auto rounded-2xl bg-teal-50 text-[#00838F] border border-teal-100 flex items-center justify-center transition-transform group-hover:scale-105">
                <Waves className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="font-bold text-sm text-[#0A192F]">Public Swimming</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Open sessions for individuals and families at ₹150/hr with strict capacity limits.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center space-y-2.5 pt-4 sm:pt-0 lg:pl-6 group">
              <div className="w-13 h-13 mx-auto rounded-2xl bg-teal-50 text-[#00838F] border border-teal-100 flex items-center justify-center transition-transform group-hover:scale-105">
                <Users className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="font-bold text-sm text-[#0A192F]">Family Exclusive Booking</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Private pool time for your family and friends with no outside visitors allowed.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center space-y-2.5 pt-4 sm:pt-0 lg:pl-6 group">
              <div className="w-13 h-13 mx-auto rounded-2xl bg-teal-50 text-[#00838F] border border-teal-100 flex items-center justify-center transition-transform group-hover:scale-105">
                <BadgeCheck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="font-bold text-sm text-[#0A192F]">Clean &amp; Well Maintained</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Dual sand filtration, regular water tests, and hospital-grade sanitized decks.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center space-y-2.5 pt-4 sm:pt-0 lg:pl-6 group">
              <div className="w-13 h-13 mx-auto rounded-2xl bg-teal-50 text-[#00838F] border border-teal-100 flex items-center justify-center transition-transform group-hover:scale-105">
                <HeartHandshake className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="font-bold text-sm text-[#0A192F]">Safe &amp; Friendly Staff</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Trained life-safety personnel and courteous reception to assist your visit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. OUR FACILITY SHOWCASE (Refined High-Resolution Architecture Tour) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-[#00838F] font-bold text-[11px] uppercase tracking-wider">
            <span>Facility Tour</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0A192F] tracking-tight">
            Our Facility
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Modern indoor aquatic center with pure water, private changing suites, and comfortable amenities for all age groups in Moonniyur, Malappuram district.
          </p>
        </div>

        {/* 3 Photography Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Photo 1: Swimming Basin */}
          <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-300 hover:shadow-float hover:-translate-y-1">
            <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
              <img
                src="https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80"
                alt="Main Indoor Swimming Pool Basin"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-300 block mb-0.5">
                  Main Basin
                </span>
                <span className="font-bold text-sm block">25m Temperature-Controlled Pool</span>
                <span className="text-[11px] text-slate-300 block mt-0.5">1.2m – 2.0m gradual depth • Anti-slip perimeter</span>
              </div>
            </div>
          </div>

          {/* Photo 2: Changing Rooms & Hot Showers */}
          <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-300 hover:shadow-float hover:-translate-y-1">
            <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
              <img
                src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"
                alt="Sanitized Changing Suites and Hot Showers"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-300 block mb-0.5">
                  Private Suites
                </span>
                <span className="font-bold text-sm block">Changing Rooms &amp; Hot Showers</span>
                <span className="text-[11px] text-slate-300 block mt-0.5">Individual stalls • Lockers • Heated water</span>
              </div>
            </div>
          </div>

          {/* Photo 3: Lounge & Spectator Area */}
          <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-300 hover:shadow-float hover:-translate-y-1">
            <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
              <img
                src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
                alt="Spectator & Family Lounge"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-300 block mb-0.5">
                  Reception
                </span>
                <span className="font-bold text-sm block">Spectator &amp; Family Lounge</span>
                <span className="text-[11px] text-slate-300 block mt-0.5">Air-conditioned • Glass pool view • Seating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SESSION COMPARISON & PRICING (Modern High-Conversion Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-[#00838F] font-bold text-[11px] uppercase tracking-wider">
            <span>Transparent Pricing</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0A192F] tracking-tight">
            Choose Your Swimming Session
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Guaranteed 100% private pool lockdown for family sessions, with shared daytime public swimming.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch pt-2">
          {/* Public Swimming Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#00838F] bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
                  DAYTIME SESSION • 9:00 AM – 4:00 PM
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">Shared Pool</span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#0A192F]">Daily Public Swimming</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1">
                  Open access swimming for individuals, fitness swimmers, and casual family visits. Capacity is strictly capped at 25 swimmers to guarantee space and clean water.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00838F] shrink-0" />
                  <span>₹150 per person per hour</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00838F] shrink-0" />
                  <span>Strict 25-person occupancy cap</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00838F] shrink-0" />
                  <span>Online advance booking &amp; walk-in counter admission</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00838F] shrink-0" />
                  <span>Free access to hot showers &amp; changing rooms</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-3xl font-black text-[#0A192F]">₹150</span>
                <span className="text-xs text-slate-500"> / person / hr</span>
              </div>
              <Link
                href="/book?type=PUBLIC"
                className="bg-[#00838F] hover:bg-[#007079] active:scale-[0.98] text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-xs transition inline-flex items-center gap-1.5"
              >
                <span>Book Public Session</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Family Exclusive Card */}
          <div className="bg-white border-2 border-[#00838F] rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-float transition flex flex-col justify-between space-y-6 relative overflow-hidden">
            {/* Top right "Most Popular" ribbon */}
            <div className="absolute top-0 right-0 bg-[#00838F] text-white text-[10px] font-black uppercase tracking-wider py-1 px-4 rounded-bl-xl shadow-xs">
              100% PRIVATE
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  FULL DAY &amp; EVENING • 9:00 AM – 11:00 PM
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#0A192F]">Family Exclusive Booking</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1">
                  The entire swimming pool facility, deck, and changing suites are locked exclusively for your family or group. Zero outside guests during your reservation.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>₹1,500 per hour (includes up to 12 persons)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Additional guests above 12: ₹100 per person per hour</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>₹750 online advance to authoritatively lock your slot</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Remaining balance payable at facility arrival (Cash / UPI)</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-3xl font-black text-[#0A192F]">₹1,500</span>
                <span className="text-xs text-slate-500"> / hr (up to 12)</span>
              </div>
              <Link
                href="/book?type=FAMILY"
                className="bg-[#00838F] hover:bg-[#007079] active:scale-[0.98] text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-xs transition inline-flex items-center gap-1.5"
              >
                <span>Book Family Slot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WATER QUALITY & HYGIENE STANDARD METRICS (Trust Reassurance) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0A192F] text-white rounded-2xl p-8 sm:p-10 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">
                Hospital-Grade Hygiene Assurance
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Scientific Water Purity Tested 4 Times Daily
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                Unlike outdoor open pools prone to monsoon mud and leaves, M.A.K Indoor Pool maintains strict automated sand filtration, continuous circulation, and certified pH levels.
              </p>
            </div>

            {/* Live Water Reading Dashboard Snapshot */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-700/80 rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pool Chemistry Log</span>
                </span>
                <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 font-bold">
                  OPTIMAL
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">pH Balance</span>
                  <span className="text-lg font-black font-mono text-cyan-300">7.4</span>
                  <span className="text-[9px] text-slate-500 block">Ideal: 7.2–7.6</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">Chlorine</span>
                  <span className="text-lg font-black font-mono text-cyan-300">1.8 ppm</span>
                  <span className="text-[9px] text-slate-500 block">Ideal: 1.5–2.0</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">Water Temp</span>
                  <span className="text-lg font-black font-mono text-cyan-300">29°C</span>
                  <span className="text-[9px] text-slate-500 block">Heated basin</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
