"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Calendar,
  MessageCircle,
  Lock,
  ArrowRight,
  ExternalLink,
  Droplets,
  CheckCircle2,
} from "lucide-react";
import MakLogo from "@/components/MakLogo";

export default function Footer() {
  const pathname = usePathname();
  const [currentYear, setCurrentYear] = useState(2026);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  // Do not render public footer on admin pages
  if (pathname.startsWith("/admin")) {
    return null;
  }

  // Hide the pre-footer CTA on the booking page itself to avoid redundant actions
  const isBookingPage = pathname === "/book";

  return (
    <footer className="bg-[#050E17] text-slate-400 border-t border-slate-800 relative z-10 text-xs">
      {/* 1. PRE-FOOTER INVITATION BANNER (Smooth Transition from Content to Footer) */}
      {!isBookingPage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -translate-y-12 mb--12">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0A192F] via-[#0D253F] to-[#0A192F] border border-cyan-900/40 p-6 sm:p-10 shadow-2xl">
            {/* Subtle aquatic background glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#00838F]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 font-semibold text-[11px]">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Aluva’s Cleanest Indoor Heated Swimming Facility</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Ready to Experience M.A.K Indoor Pool?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Dual-filtration sand purification, strict 25-person daytime capacity, and 100% private family evening sessions. Book online with real-time slot locking.
                </p>

                {/* Feature Pills */}
                <div className="pt-2 flex flex-wrap gap-4 text-[11px] text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>₹150/hr Public Swim</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Exclusive Family Booking</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Zero Monsoon Exposure</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-2.5">
                <Link
                  href="/book"
                  className="bg-[#00838F] hover:bg-[#007079] active:scale-[0.98] text-white font-bold py-3 px-5 rounded-lg text-xs shadow-md transition flex items-center justify-center gap-2 text-center"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Your Swimming Slot</span>
                </Link>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="tel:+919447012345"
                    className="border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-semibold py-2.5 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 text-center"
                  >
                    <Phone className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Call Desk</span>
                  </a>

                  <a
                    href="https://wa.me/919447012345?text=Hello%20M.A.K%20Indoor%20Pool%2C%20I%20would%20like%20to%20enquire%20about%20booking%20a%20slot."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-emerald-900/60 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 font-semibold py-2.5 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 text-center"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN 4-COLUMN FOOTER BODY */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isBookingPage ? "pt-12" : "pt-4"} pb-12`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Column 1: Brand & Facility Excellence (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="inline-block group">
              <MakLogo light={true} size="lg" />
            </Link>

            <p className="text-slate-400 leading-relaxed text-[11px] pr-2">
              M.A.K Indoor Pool is Kerala’s premier temperature-controlled indoor aquatic center in Aluva, Ernakulam. Built to hospital-grade hygiene standards with continuous dual-filtration sand purifiers and 100% private family evening sessions.
            </p>

            {/* Quality Certifications & Assurance */}
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <div className="flex items-center gap-2 text-cyan-400 font-medium text-[11px]">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Certified Water Quality (pH 7.2–7.6 • Multi-Test Daily)</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-medium text-[11px]">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Guaranteed Deck Privacy for Family Bookings</span>
              </div>
            </div>
          </div>

          {/* Column 2: Operating Sessions & Rates (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Operating Sessions</span>
            </h4>

            <div className="space-y-2.5 text-[11px]">
              {/* Public Swimming Slot Card */}
              <div className="border-l-2 border-cyan-500 pl-3 py-1 bg-slate-900/40 rounded-r-lg">
                <span className="font-bold text-white block">Daytime Public Swimming</span>
                <span className="text-cyan-300 font-mono block">9:00 AM – 4:00 PM</span>
                <span className="text-slate-400 block mt-0.5">
                  ₹150 / person / hr • Max 25 capacity
                </span>
              </div>

              {/* Family Exclusive Slot Card */}
              <div className="border-l-2 border-emerald-500 pl-3 py-1 bg-slate-900/40 rounded-r-lg">
                <span className="font-bold text-white block">Exclusive Family Booking</span>
                <span className="text-emerald-300 font-mono block">4:00 PM – 11:00 PM</span>
                <span className="text-slate-400 block mt-0.5">
                  ₹1,500 / hr (up to 12) • ₹750 advance
                </span>
              </div>

              <div className="text-[10px] text-slate-500 pt-1">
                Open 7 days a week, including Sundays and public holidays.
              </div>
            </div>
          </div>

          {/* Column 3: Quick Links & Transparency (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Information
            </h4>

            <ul className="space-y-2 text-[11px]">
              <li>
                <Link href="/book" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                  <span>Book Online</span>
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                  <span>Pricing &amp; Calculator</span>
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                  <span>Facility Profile</span>
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                  <span>Photo Gallery</span>
                </Link>
              </li>
              <li>
                <Link href="/policies" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                  <span>Swimwear &amp; Hygiene Rules</span>
                </Link>
              </li>
              <li>
                <Link href="/policies" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                  <span>Cancellation Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                  <span>Frequently Asked Questions</span>
                </Link>
              </li>
              <li>
                <Link href="/booking-status" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors flex items-center gap-1">
                  <span>Lookup / Check Booking</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Location & Direct Contact (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Location &amp; Visit</span>
            </h4>

            <ul className="space-y-2.5 text-[11px]">
              <li>
                <span className="text-slate-300 font-semibold block">M.A.K Indoor Pool</span>
                <span className="text-slate-400 block leading-relaxed">
                  Near Metro Station &amp; Periyar Bypass, Aluva, Ernakulam, Kerala – 683101
                </span>
                <a
                  href="https://maps.google.com/?q=Aluva,Kerala"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium mt-1 text-[10px]"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>

              <li className="pt-1 border-t border-slate-800/80 space-y-1">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <a
                    href="tel:+919447012345"
                    className="text-slate-200 hover:text-white font-bold transition tabular-nums"
                  >
                    +91 94470 12345
                  </a>
                </div>
                <span className="text-[10px] text-slate-500 block pl-5.5">
                  Front Desk &amp; Inquiries (9 AM – 11 PM)
                </span>
              </li>

              <li className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <a
                  href="https://wa.me/919447012345?text=Hello%20M.A.K%20Indoor%20Pool%2C%20I%20would%20like%20to%20enquire%20about%20booking%20a%20slot."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition"
                >
                  Chat with Desk on WhatsApp
                </a>
              </li>

              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-slate-300">support@makindoorpool.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 3. BOTTOM COPYRIGHT & LEGAL BAR */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-slate-500">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <p>© {currentYear} M.A.K Indoor Pool. All rights reserved.</p>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span className="text-slate-400">Aluva, Kerala, India</span>
          </div>

          <div className="flex items-center gap-3.5 flex-wrap justify-center">
            <Link href="/policies" className="hover:text-slate-300 transition-colors">
              Rules &amp; Policies
            </Link>
            <span className="text-slate-700">•</span>
            <Link href="/policies" className="hover:text-slate-300 transition-colors">
              Refund Policy
            </Link>
            <span className="text-slate-700">•</span>
            <Link href="/booking-status" className="hover:text-slate-300 transition-colors">
              Self Service
            </Link>
            <span className="text-slate-700">•</span>
            <Link
              href="/admin/login"
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors inline-flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              <span>Staff Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
