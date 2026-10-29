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
  Lock,
  CheckCircle2,
  Check,
  Phone,
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
      {/* Editorial Hero Section */}
      <section className="bg-[#0B192C] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Core Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1 rounded-md text-xs font-semibold text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                Aluva, Ernakulam • Temperature-Controlled Indoor Pool
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
                {lang === "en" ? (
                  <>
                    Private Family Sessions & <br />
                    Daily Public Swimming
                  </>
                ) : (
                  <>
                    സമ്പൂർണ്ണ ഫാമിലി പ്രൈവസിയും <br />
                    ദിനേനയുള്ള നീന്തൽ സെഷനുകളും
                  </>
                )}
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                {lang === "en"
                  ? "Experience hospital-grade crystal-clear water with dual sand and UV filtration. Complete exclusive privacy for families in the evening, and structured public swimming during the day."
                  : "ഉന്നത നിലവാരത്തിലുള്ള വെള്ളം, കർശന ശുചിത്വം, സമ്പൂർണ്ണ ഫാമിലി പ്രൈവസി എന്നിവയോടൊപ്പം മികച്ച നീന്തൽ അനുഭവം."}
              </p>

              {/* Direct Booking CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  href="/book"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-3.5 rounded-lg text-sm shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Reserve a Slot Online</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/pricing"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-5 py-3.5 rounded-lg text-sm transition text-center"
                >
                  View Rates & Rules
                </Link>
              </div>

              {/* Trust Metrics Bar */}
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="font-bold text-base text-white block">2.5 – 5.0 ft</span>
                  <span className="text-slate-400">Gradual Depth (Kids Safe)</span>
                </div>
                <div>
                  <span className="font-bold text-base text-white block">1.5 – 3.0 ppm</span>
                  <span className="text-slate-400">Tested Chlorine Balance</span>
                </div>
                <div>
                  <span className="font-bold text-base text-white block">25 Max</span>
                  <span className="text-slate-400">Public Swimmer Cap</span>
                </div>
              </div>
            </div>

            {/* Right Column: High-contrast Session Schedule Card */}
            <div className="lg:col-span-5 space-y-4">
              {/* Family Session Card */}
              <div className="bg-[#10243E] border border-cyan-500/30 rounded-xl p-6 text-white shadow-lg space-y-3 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 block">
                      EVENING SESSION • 4:00 PM – 11:00 PM
                    </span>
                    <h3 className="text-xl font-bold text-white mt-0.5">Exclusive Family Booking</h3>
                  </div>
                  <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded">
                    100% PRIVATE
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  The entire pool facility is locked exclusively for your family or private group. No outside visitors allowed.
                </p>

                <div className="pt-2 border-t border-slate-700/60 flex justify-between items-baseline">
                  <div>
                    <span className="text-2xl font-black text-white">₹1,500</span>
                    <span className="text-xs text-slate-400"> / hour (up to 12 people)</span>
                  </div>
                  <span className="text-xs text-cyan-300 font-semibold">
                    ₹750 Advance to lock
                  </span>
                </div>

                <Link
                  href="/book"
                  className="block text-center w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded-lg text-xs transition"
                >
                  Book Family Slot &rarr;
                </Link>
              </div>

              {/* Public Swimming Card */}
              <div className="bg-[#10243E]/60 border border-slate-700 rounded-xl p-5 text-white space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                      DAYTIME SESSION • 9:00 AM – 4:00 PM
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5">Daily Public Swimming</h3>
                  </div>
                  <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">
                    SHARED POOL
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Individual swimming, fitness training, and casual dips with live monitored capacity limit (max 25 swimmers).
                </p>

                <div className="pt-2 border-t border-slate-700/60 flex justify-between items-baseline">
                  <div>
                    <span className="text-2xl font-black text-white">₹150</span>
                    <span className="text-xs text-slate-400"> / person / hour</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    Walk-ins & online booking
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Operational Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-slate-200 pb-4 mb-8">
          <span className="text-xs uppercase font-bold text-cyan-700 tracking-wider">
            Water Quality & Facility Standards
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Built for Hygiene, Safety, and Total Comfort
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
              <Droplets className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Hospital-Grade Water Quality</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Continuous multi-stage silica sand filtration and UV sterilizers recycle pool water every 4 hours. Chlorine (1.5–3.0 ppm) and pH (7.2–7.6) are logged twice daily.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Guaranteed Evening Privacy</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When you book a family slot from 4:00 PM onwards, our doors are locked exclusively for your group. Private changing rooms and shower stalls are dedicated to your party.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Family & Child Safety</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Graduated steps with a dedicated 2.5 ft shallow zone, anti-slip deck tiles, life rings, and child-safe flotation vests provided at no extra charge.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Formula Overview Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-10 border border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <span className="text-xs uppercase font-bold text-cyan-400 tracking-wider">
                Clear & Predictable Pricing
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                How Exclusive Family Pricing Works
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Base rate is <strong>₹1,500/hour for up to 12 persons</strong>. If your family gathering has more than 12 guests, each additional guest is just <strong>₹100/hour</strong>.
                You only pay a <strong>₹750 advance</strong> online to hold the slot. The remaining balance is paid at the pool counter.
              </p>
              <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-xs text-slate-300 font-mono">
                Example: 3 Hours with 14 Guests = (3 × ₹1,500) + (2 extra × ₹100 × 3 hrs) = ₹5,100 total. Pay ₹750 online now, balance ₹4,350 at the counter.
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3">
              <Link
                href="/book"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3.5 px-6 rounded-lg text-sm text-center shadow-sm transition"
              >
                Book Family Slot Online &rarr;
              </Link>
              <Link
                href="/pricing"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg text-xs text-center border border-slate-700 transition"
              >
                Review Full Pricing Table
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
