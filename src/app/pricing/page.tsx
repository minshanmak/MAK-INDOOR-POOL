"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Waves,
  Users2,
  CheckCircle2,
  ArrowRight,
  Clock,
  Calculator,
  ShieldCheck,
  Droplets,
  Calendar,
} from "lucide-react";

export default function PricingPage() {
  // Interactive test pricing calculator
  const [calcGuests, setCalcGuests] = useState(12);
  const [calcHours, setCalcHours] = useState(2);

  const basePrice = calcHours * 1500;
  const extraGuests = Math.max(0, calcGuests - 12);
  const extraPrice = extraGuests * 100 * calcHours;
  const totalPrice = basePrice + extraPrice;
  const advanceRequired = 750;
  const balanceAtCounter = Math.max(0, totalPrice - advanceRequired);

  return (
    <div className="bg-[#F0F5FA] text-slate-800 space-y-12 sm:space-y-16 pb-20">
      {/* 1. HERO HEADER BANNER (Consistent with Mockup) */}
      <section className="relative min-h-[280px] sm:min-h-[340px] flex items-center overflow-hidden bg-[#061426]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=2000&q=85')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#061426]/95 via-[#0A2647]/80 to-[#0A2647]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061426]/60 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 z-10 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="max-w-xl space-y-3 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-cyan-200">
              <span>M.A.K Indoor Pool</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Our Pricing
            </h1>
            <p className="text-xs sm:text-sm text-cyan-100 font-normal leading-relaxed max-w-lg">
              Simple and transparent pricing for all your swimming needs. No hidden charges or surge fees.
            </p>
          </div>

          {/* Operating Hours Frosted Pill */}
          <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-3xl p-4 text-white text-xs space-y-1.5 shadow-xl shrink-0">
            <div className="flex items-center gap-2 font-bold text-xs text-white">
              <Clock className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>Operating Hours: 9:00 AM – 11:00 PM</span>
            </div>
            <div className="text-[11px] text-cyan-100">
              • Public Swimming: 9:00 AM – 4:00 PM
            </div>
            <div className="text-[11px] text-cyan-100">
              • Family Bookings: 4:00 PM – 11:00 PM
            </div>
          </div>
        </div>
      </section>

      {/* 2. 2-COLUMN PRICING GRID (Clean Dual Plans) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Card 1: Public Swimming (Exact Component Sheet Match) */}
          <Link
            href="/book?type=PUBLIC"
            className="relative overflow-hidden bg-gradient-to-br from-[#EBF5FF] via-[#E1F0FE] to-[#D5EAFF] border border-sky-200 hover:border-sky-300 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-all group block space-y-5"
          >
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                <div className="w-8 h-8 rounded-xl bg-white text-[#0284C7] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Waves className="w-4 h-4" />
                </div>
                <span className="text-base font-extrabold">Public Swimming</span>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">₹150</span>
                  <span className="text-sm font-semibold text-slate-500">/ hour</span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">per person</div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 font-medium pt-2 border-t border-sky-200/60">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Pool access (9:00 AM – 4:00 PM)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Ideal for individuals and groups</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Clean and supervised environment</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Max 25 swimmers strict capacity cap</span>
                </div>
              </div>
            </div>

            {/* Decorative Ambient Waves (Exact UI Component Match) */}
            <svg
              className="absolute -bottom-2 -right-2 w-72 h-36 opacity-30 pointer-events-none"
              viewBox="0 0 200 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 60 C50 35 100 80 150 45 C180 25 200 55 220 45 L220 100 L0 100 Z"
                fill="#0284C7"
              />
            </svg>
          </Link>

          {/* Card 2: Exclusive Family Booking (Exact Component Sheet Match) */}
          <Link
            href="/book?type=FAMILY"
            className="relative overflow-hidden bg-gradient-to-br from-[#FAF5FF] via-[#F6EDFD] to-[#EEDEFB] border border-purple-200 hover:border-purple-300 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-all group block space-y-5"
          >
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                <div className="w-8 h-8 rounded-xl bg-white text-[#9333EA] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Users2 className="w-4 h-4" />
                </div>
                <span className="text-base font-extrabold">Exclusive Family Booking</span>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">₹1,500</span>
                  <span className="text-sm font-semibold text-slate-500">/ hour</span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">up to 12 people</div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 font-medium pt-2 border-t border-purple-200/60">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Private pool access (4:00 PM – 11:00 PM)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>₹100 per additional person / hour</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>₹750 advance required per booking</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>100% private: outside swimmers strictly prohibited</span>
                </div>
              </div>
            </div>

            {/* Decorative Ambient Waves (Exact UI Component Match) */}
            <svg
              className="absolute -bottom-2 -right-2 w-72 h-36 opacity-25 pointer-events-none"
              viewBox="0 0 200 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 60 C50 35 100 80 150 45 C180 25 200 55 220 45 L220 100 L0 100 Z"
                fill="#9333EA"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* 3. INTERACTIVE PRICING ESTIMATOR (iOS Clean Card Style) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#1D68BD] flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Family Slot Price Calculator
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Calculate the exact transparent rate for your group size and duration.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Control 1: Duration */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Duration (Hours)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setCalcHours(h)}
                    className={`flex-1 py-2 rounded-2xl text-xs font-bold transition-all ${
                      calcHours === h
                        ? "bg-[#1D68BD] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                  >
                    {h} {h === 1 ? "Hour" : "Hours"}
                  </button>
                ))}
              </div>
            </div>

            {/* Control 2: Guest Count */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Total Guests ({calcGuests} People)
              </label>
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-1.5 rounded-2xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setCalcGuests(Math.max(1, calcGuests - 1))}
                  className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-sm"
                >
                  -
                </button>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={calcGuests}
                  onChange={(e) => setCalcGuests(Number(e.target.value))}
                  className="flex-1 accent-[#1D68BD]"
                />
                <button
                  type="button"
                  onClick={() => setCalcGuests(Math.min(30, calcGuests + 1))}
                  className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-sm"
                >
                  +
                </button>
              </div>
              <span className="text-[11px] text-slate-400 block">
                Up to 12 guests included in base rate. ₹100/person/hr for extra guests.
              </span>
            </div>
          </div>

          {/* Breakdown Result Box */}
          <div className="bg-[#FAF5FF] border border-purple-100 rounded-2xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-xs font-semibold text-slate-600 block">Estimated Total Amount</span>
                <span className="text-3xl font-black text-slate-900 tracking-tight">₹{totalPrice.toLocaleString("en-IN")}</span>
              </div>
              <div className="text-left sm:text-right text-xs space-y-0.5">
                <div className="font-bold text-purple-700">Advance Required: ₹{advanceRequired}</div>
                <div className="text-slate-500">Balance at Counter: ₹{balanceAtCounter.toLocaleString("en-IN")}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-purple-100/80 text-[11px] text-slate-600 flex flex-wrap gap-4">
              <span>Base Rate: ₹{basePrice.toLocaleString("en-IN")} ({calcHours}h × ₹1,500)</span>
              {extraGuests > 0 && (
                <span>Extra Guests ({extraGuests} pers): +₹{extraPrice.toLocaleString("en-IN")}</span>
              )}
            </div>
          </div>

          <div className="text-center pt-2">
            <Link
              href={`/book?type=FAMILY`}
              className="inline-flex items-center gap-2 bg-[#9333EA] hover:bg-[#7E22CE] text-white font-extrabold px-8 py-3 rounded-full text-xs shadow-md transition active:scale-95"
            >
              <span>Book This Family Slot</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. "READY TO SWIM?" CTA BANNER (Exact Match) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#0077B6] via-[#0096C7] to-[#00B4D8] rounded-3xl p-6 sm:p-9 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Ready to Swim?
            </h2>
            <p className="text-cyan-100 text-xs sm:text-sm mt-1 max-w-xl font-normal leading-relaxed">
              Book your slot now and enjoy a clean and premium indoor pool.
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
