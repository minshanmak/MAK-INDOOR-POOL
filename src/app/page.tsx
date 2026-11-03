"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Waves,
  ShieldCheck,
  Calendar,
  Clock,
  Users,
  Users2,
  ArrowRight,
  Droplets,
  Layers,
  Image as ImageIcon,
  Play,
  Check,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  return (
    <div className="bg-[#F0F5FA] text-slate-800 space-y-12 sm:space-y-16 pb-16">
      {/* 1. HERO SECTION (Exact Match to Mockup) */}
      <section className="relative min-h-[520px] sm:min-h-[580px] lg:min-h-[620px] flex items-center overflow-hidden bg-[#061426]">
        {/* Background Swimming Pool Photograph */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=2000&q=85')`,
          }}
        />
        {/* Sleek Deep Oceanic Gradient Overlay (Exact Mockup Match) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#061426]/95 via-[#0A2647]/80 to-[#0A2647]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061426]/60 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 z-10 w-full flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
          {/* Left Hero Content */}
          <div className="max-w-2xl space-y-5 text-white">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white shadow-xs">
              <span>M.A.K Indoor Pool</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
              Premium Indoor <br />
              Swimming Experience
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-cyan-100/90 font-normal leading-relaxed max-w-lg">
              A clean, safe and family-friendly indoor pool for public swimming and exclusive family bookings.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/book"
                className="bg-white hover:bg-slate-100 active:scale-95 text-slate-900 font-extrabold px-6 py-2.5 rounded-full text-xs shadow-lg transition flex items-center gap-2"
              >
                <span>Book Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/pricing"
                className="bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md border border-white/25 text-white font-bold px-6 py-2.5 rounded-full text-xs transition"
              >
                View Pricing
              </Link>
            </div>

            {/* 4 Feature Badges Row (Exact Mockup Match) */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-5 pt-3 text-xs font-medium text-white/90">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-300" />
                <span>Clean &amp; Safe</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-300" />
                <span>Family Friendly</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-cyan-300" />
                <span>Well Maintained</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-300" />
                <span>Flexible Booking</span>
              </div>
            </div>
          </div>

          {/* Right Floating Frosted Glass Operating Hours Widget (Exact Mockup Match) */}
          <div className="bg-[#0A2647]/50 backdrop-blur-xl border border-white/20 rounded-3xl p-5 sm:p-6 text-white shadow-2xl space-y-4 w-full max-w-xs shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0 shadow-inner">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[10px] text-cyan-200 uppercase tracking-wider font-semibold block leading-tight">
                  Operating Hours
                </span>
                <span className="text-sm font-bold text-white block leading-tight">
                  9:00 AM – 11:00 PM
                </span>
              </div>
            </div>

            <div className="pt-1 space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5 text-cyan-100">
                <Waves className="w-4 h-4 text-cyan-300 shrink-0" />
                <span>Public Swimming: 9:00 AM – 4:00 PM</span>
              </div>
              <div className="flex items-center gap-2.5 text-cyan-100">
                <Users2 className="w-4 h-4 text-cyan-300 shrink-0" />
                <span>Family Bookings: 4:00 PM – 11:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 4 QUICK-ACTION CARDS (Overlapping Below Hero - Exact Match) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-12 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Book Your Slot */}
          <Link
            href="/book"
            className="bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.06)] hover:shadow-lg hover:-translate-y-0.5 transition-all group flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#1D68BD] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#1D68BD] transition-colors flex items-center gap-1">
                <span>Book Your Slot</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                <span>Check availability and book instantly</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
          </Link>

          {/* Card 2: Our Pricing */}
          <Link
            href="/pricing"
            className="bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.06)] hover:shadow-lg hover:-translate-y-0.5 transition-all group flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition-colors flex items-center gap-1">
                <span>Our Pricing</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                <span>Simple and transparent rates</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
          </Link>

          {/* Card 3: View Gallery */}
          <Link
            href="/gallery"
            className="bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.06)] hover:shadow-lg hover:-translate-y-0.5 transition-all group flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-teal-600 transition-colors flex items-center gap-1">
                <span>View Gallery</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                <span>Explore our pool and facilities</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
          </Link>

          {/* Card 4: Safety & Policies */}
          <Link
            href="/policies"
            className="bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.06)] hover:shadow-lg hover:-translate-y-0.5 transition-all group flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                <span>Safety &amp; Policies</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                <span>Booking, cancellation and safety rules</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* 3. ABOUT SECTION: "A Modern Indoor Pool for Everyone" (Exact Match) */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Ambient Decorative Wave Gradient on Right Edge (Exact Mockup Match) */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-gradient-to-l from-sky-200/40 via-sky-100/20 to-transparent rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Image with Play Button */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-md border border-white aspect-[16/10] group">
              <img
                src="https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80"
                alt="M.A.K Indoor Pool Facility"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/10 transition-colors" />

              {/* Circular Play Button in Center */}
              <button
                type="button"
                onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-white/95 hover:bg-white text-slate-900 flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95"
                aria-label="Play pool showcase video"
              >
                <Play className="w-5 h-5 fill-slate-900 translate-x-0.5" />
              </button>
            </div>
          </div>

          {/* Right Column: About Text & Highlights */}
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0284C7] block">
              About M.A.K Indoor Pool
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              A Modern Indoor Pool <br />
              for Everyone
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              M.A.K Indoor Pool offers a clean, safe and comfortable swimming environment for individuals, friends and families. Enjoy public swimming during the day or book exclusive time for your family in the evening.
            </p>

            <div className="space-y-2.5 pt-1 text-xs font-semibold text-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-sky-100 text-[#0284C7] flex items-center justify-center shrink-0 shadow-2xs">
                  <Waves className="w-3.5 h-3.5" />
                </div>
                <span>Public Swimming (9:00 AM – 4:00 PM)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-sky-100 text-[#0284C7] flex items-center justify-center shrink-0 shadow-2xs">
                  <Users2 className="w-3.5 h-3.5" />
                </div>
                <span>Exclusive Family Bookings (4:00 PM – 11:00 PM)</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition active:scale-95 shadow-xs"
              >
                <span>Learn More</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. STATS RIBBON (Soft Light Blue Rounded Container - Exact Mockup Match) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#E4F2FE] rounded-3xl p-5 sm:p-6 border border-sky-200/50 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y sm:divide-y-0 md:divide-x divide-sky-200/60 text-xs text-slate-700">
            {/* Stat 1 */}
            <div className="flex items-center gap-3 px-2 sm:px-4 justify-center">
              <div className="w-10 h-10 rounded-2xl bg-white text-[#0284C7] flex items-center justify-center shrink-0 shadow-xs">
                <Waves className="w-5 h-5 text-[#0284C7]" />
              </div>
              <div>
                <span className="font-extrabold text-base text-slate-900 block leading-tight">2</span>
                <span className="text-slate-600 font-medium block text-[11px] leading-tight">Swimming Modes</span>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="flex items-center gap-3 px-2 sm:px-4 justify-center pt-3 sm:pt-0">
              <div className="w-10 h-10 rounded-2xl bg-white text-[#0284C7] flex items-center justify-center shrink-0 shadow-xs">
                <Calendar className="w-5 h-5 text-[#0284C7]" />
              </div>
              <div>
                <span className="font-extrabold text-base text-slate-900 block leading-tight">12+</span>
                <span className="text-slate-600 font-medium block text-[11px] leading-tight">Hours Daily</span>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="flex items-center gap-3 px-2 sm:px-4 justify-center pt-3 sm:pt-0">
              <div className="w-10 h-10 rounded-2xl bg-white text-[#0284C7] flex items-center justify-center shrink-0 shadow-xs">
                <Users2 className="w-5 h-5 text-[#0284C7]" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-slate-900 block leading-tight">Family Friendly</span>
                <span className="text-slate-600 font-medium block text-[11px] leading-tight">Exclusive Bookings</span>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="flex items-center gap-3 px-2 sm:px-4 justify-center pt-3 sm:pt-0">
              <div className="w-10 h-10 rounded-2xl bg-white text-[#0284C7] flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-[#0284C7]" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-slate-900 block leading-tight">Safe &amp; Hygienic</span>
                <span className="text-slate-600 font-medium block text-[11px] leading-tight">Clean &amp; Well Maintained</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. "OUR PRICING" SECTION (Exact Match to Mockup) */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Our Pricing
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            Simple and transparent pricing for all your swimming needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Pricing Card 1: Public Swimming (Exact Component Sheet Match) */}
          <Link
            href="/book?type=PUBLIC"
            className="relative overflow-hidden bg-gradient-to-br from-[#EBF5FF] via-[#E1F0FE] to-[#D5EAFF] border border-sky-200 hover:border-sky-300 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-all group block space-y-4"
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
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">₹150</span>
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

          {/* Pricing Card 2: Exclusive Family Booking (Exact Component Sheet Match) */}
          <Link
            href="/book?type=FAMILY"
            className="relative overflow-hidden bg-gradient-to-br from-[#FAF5FF] via-[#F6EDFD] to-[#EEDEFB] border border-purple-200 hover:border-purple-300 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-all group block space-y-4"
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
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">₹1,500</span>
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

      {/* 6. "EXPLORE OUR POOL" (Gallery Showcase - Exact Match) */}
      <section id="gallery" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Explore Our Pool
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
              Take a look at our indoor pool, facilities and ambiance.
            </p>
          </div>

          <Link
            href="/gallery"
            className="bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-full font-bold text-xs text-slate-700 shadow-2xs inline-flex items-center gap-1.5 transition active:scale-95 shrink-0"
          >
            <span>View Gallery</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4 Photo Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Photo 1: Main Pool */}
          <div className="rounded-3xl overflow-hidden shadow-xs border border-white aspect-[4/3] relative group">
            <img
              src="https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80"
              alt="Main Indoor Heated Pool"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Photo 2: Lounge / Waiting Area */}
          <div className="rounded-3xl overflow-hidden shadow-xs border border-white aspect-[4/3] relative group">
            <img
              src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"
              alt="Lounge and Waiting Area"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Photo 3: Showers */}
          <div className="rounded-3xl overflow-hidden shadow-xs border border-white aspect-[4/3] relative group">
            <img
              src="https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80"
              alt="Showers and Sanitization Area"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Photo 4: Locker Room */}
          <div className="rounded-3xl overflow-hidden shadow-xs border border-white aspect-[4/3] relative group">
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80"
              alt="Secure Lockers and Changing Facility"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </div>
      </section>

      {/* 7. "READY TO SWIM?" CTA BANNER (Exact Match) */}
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
