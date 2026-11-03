"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Waves,
  ShieldCheck,
  Heart,
  Users2,
  Thermometer,
  Sparkles,
  ArrowRight,
  Clock,
  Play,
  CheckCircle2,
} from "lucide-react";

export default function AboutPage() {
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

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
              About M.A.K Indoor Pool
            </h1>
            <p className="text-xs sm:text-sm text-cyan-100 font-normal leading-relaxed max-w-lg">
              Kerala’s purpose-built indoor swimming facility in Moonniyur, designed for pristine water hygiene, safety, and complete family privacy.
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-3xl p-4 text-white text-xs space-y-1.5 shadow-xl shrink-0">
            <div className="flex items-center gap-2 font-bold text-xs text-white">
              <Clock className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>Location: Moonniyur, Malappuram</span>
            </div>
            <div className="text-[11px] text-cyan-100">
              • Kalathingalpara, Kunnathparambi, Kerala
            </div>
          </div>
        </div>
      </section>

      {/* 2. SHOWCASE & STORY (Exact Mockup Style) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Image with Play Button */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-md border border-slate-100 aspect-[16/10] group">
                <img
                  src="https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80"
                  alt="M.A.K Indoor Pool Facility"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/10 transition-colors" />

                <button
                  type="button"
                  onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95"
                  aria-label="Play pool showcase video"
                >
                  <Play className="w-5 h-5 fill-slate-900 translate-x-0.5" />
                </button>
              </div>
            </div>

            {/* Right Column: Mission Text */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1D68BD] block">
                Our Purpose
              </span>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                A Modern Indoor Pool <br />
                for Everyone
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Traditional outdoor pools in Kerala often suffer from harsh tropical weather, monsoon leaves, and a total lack of privacy for families. M.A.K Indoor Pool was built specifically to solve these challenges with an enclosed, climate-managed facility.
              </p>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Whether you want a casual morning swim for fitness, or want to book the entire facility exclusively for your family in the evening without outside interruptions, M.A.K provides a welcoming, sanitized, and safe environment.
              </p>

              <div className="space-y-2 pt-2 text-xs font-semibold text-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Public Swimming: 9:00 AM – 4:00 PM (₹150 / hr)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Exclusive Family Bookings: 4:00 PM – 11:00 PM (₹1,500 / hr)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 4 CORE PILLARS (Clean Pastel Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Our Core Principles
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            The values that guide daily operations and hospitality at M.A.K Indoor Pool.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#F0F8FF] border border-sky-100 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E0F2FE] text-[#1D68BD] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Hospital-Grade Hygiene</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dual sand filtration running 24/7 with strict twice-daily chlorine (1.5–3.0 ppm) and pH (7.2–7.6) testing.
            </p>
          </div>

          <div className="bg-[#FAF5FF] border border-purple-100 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">100% Family Privacy</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              During exclusive family slots (4 PM – 11 PM), the pool is entirely locked for your group with zero outside visitors.
            </p>
          </div>

          <div className="bg-[#F0FDF8] border border-emerald-100 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#DCFCE7] text-[#059669] flex items-center justify-center shrink-0">
              <Users2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Strict Capacity Limits</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We never overcrowd public sessions—max 25 swimmers strictly enforced for comfortable and safe swimming.
            </p>
          </div>

          <div className="bg-[#FEF9EE] border border-amber-100 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
              <Thermometer className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">All-Weather Comfort</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enclosed architecture shields you from scorching sun, heavy Kerala monsoons, dust, and wind.
            </p>
          </div>
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
