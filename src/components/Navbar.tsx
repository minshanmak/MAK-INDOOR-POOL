"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Globe,
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  Search,
  ChevronRight,
} from "lucide-react";
import { translations, Language } from "@/lib/i18n";
import MakLogo from "@/components/MakLogo";
import { getPoolHour } from "@/lib/timezone";

export default function Navbar() {
  const pathname = usePathname();
  const [lang, setLang] = useState<Language>("en");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSessionText, setCurrentSessionText] = useState("Public Swimming (Until 4 PM)");

  useEffect(() => {
    const saved = localStorage.getItem("mak_lang") as Language;
    if (saved && (saved === "en" || saved === "ml")) {
      setLang(saved);
    }

    // Determine current live session based on IST hour (Asia/Kolkata)
    const updateSessionStatus = () => {
      try {
        const istHour = getPoolHour();

        if (istHour >= 9 && istHour < 16) {
          setCurrentSessionText(
            lang === "ml"
              ? "പൊതു നീന്തൽ സെഷൻ (വൈകിട്ട് 4 വരെ)"
              : "Public Swimming (Until 4:00 PM)"
          );
        } else if (istHour >= 16 && istHour < 23) {
          setCurrentSessionText(
            lang === "ml"
              ? "പ്രത്യേക ഫാമിലി സെഷനുകൾ (രാത്രി 11 വരെ)"
              : "Family Exclusive Sessions (Until 11:00 PM)"
          );
        } else {
          setCurrentSessionText(
            lang === "ml"
              ? "പൂൾ അടച്ചിരിക്കുന്നു (രാവിലെ 9 ന് തുറക്കും)"
              : "Pool Closed (Opens at 9:00 AM)"
          );
        }
      } catch {
        // Fallback
        setCurrentSessionText("Public 9 AM - 4 PM • Family 9 AM - 11 PM");
      }
    };

    updateSessionStatus();
    const interval = setInterval(updateSessionStatus, 60000);
    return () => clearInterval(interval);
  }, [lang]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const toggleLanguage = () => {
    const nextLang: Language = lang === "en" ? "ml" : "en";
    setLang(nextLang);
    localStorage.setItem("mak_lang", nextLang);
    window.dispatchEvent(new Event("languageChange"));
  };

  const t = translations[lang];

  // Do not render public header on admin management routes
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const navLinks = [
    { href: "/", label: t.home || "Home" },
    { href: "/about", label: t.about || "About" },
    { href: "/pricing", label: t.prices || "Prices" },
    { href: "/gallery", label: t.gallery || "Gallery" },
    { href: "/policies", label: t.policies || "Policies" },
    { href: "/contact", label: t.contact || "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#07172C] text-slate-100 shadow-md">
      {/* MAIN NAVIGATION BAR (Deep Aquatic Midnight connected seamlessly with Hero) */}
      <div className="border-b border-slate-800/80 bg-[#07172C]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[72px]">
            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center group py-2"
              aria-label="M.A.K Indoor Pool - Home"
            >
              <MakLogo size="md" light={true} />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-7 lg:gap-8 h-full">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex items-center h-full text-[13px] font-semibold transition-colors duration-150 ${
                      isActive
                        ? "text-cyan-400 font-bold"
                        : "text-slate-200 hover:text-cyan-300"
                    }`}
                  >
                    <span>{link.label}</span>
                    {/* Active Bottom Indicator Bar */}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-cyan-400 rounded-t-full shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Group: Desk Contact, Language Switcher & Teal Book Now CTA */}
            <div className="hidden md:flex items-center gap-3 lg:gap-4">
              <a
                href="tel:+919947714716"
                className="hidden lg:flex flex-col text-right leading-tight group"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Quick Enquiries
                </span>
                <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors tabular-nums">
                  +91 99477 14716
                </span>
              </a>

              {/* Language Switcher Pill */}
              <button
                onClick={toggleLanguage}
                className="inline-flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700/80 transition-all text-xs font-semibold"
                title="Toggle Language (English / മലയാളം)"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>{lang === "en" ? "മലയാളം" : "English"}</span>
              </button>

              <Link
                href="/book"
                className="bg-[#00838F] hover:bg-[#007079] active:scale-[0.98] text-white font-bold px-5 py-2.5 rounded-lg text-xs shadow-xs hover:shadow transition-all duration-150 flex items-center gap-2 group"
              >
                <Calendar className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                <span>{t.bookNow || "Book Now"}</span>
              </Link>
            </div>

            {/* Mobile Controls: Book CTA + Hamburger Menu Toggle */}
            <div className="flex items-center gap-2.5 md:hidden">
              <Link
                href="/book"
                className="bg-[#00838F] hover:bg-[#007079] text-white font-bold px-3 py-1.5 rounded-md text-xs shadow-xs flex items-center gap-1"
              >
                <Calendar className="w-3 h-3" />
                <span>Book</span>
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MOBILE NAVIGATION DRAWER (Slide-Down Surface with Quick Actions) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 top-[72px] md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Menu Surface */}
          <div className="relative bg-[#07172C] border-b border-slate-800 text-slate-100 shadow-2xl max-h-[calc(100vh-72px)] overflow-y-auto px-4 py-5 space-y-5">
            {/* Live Operational Status Banner */}
            <div className="bg-slate-850/80 border border-slate-700/80 rounded-xl p-3 flex items-start gap-3 text-xs">
              <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div className="leading-tight">
                <span className="font-bold text-white block">
                  Open Daily: 9:00 AM – 11:00 PM
                </span>
                <span className="text-cyan-300 text-[11px] block mt-0.5">
                  {currentSessionText}
                </span>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-3 block mb-1">
                Navigation
              </span>
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold transition ${
                      isActive
                        ? "text-cyan-300 bg-slate-800/90 font-bold border-l-2 border-cyan-400"
                        : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    }`}
                  >
                    <span>{link.label}</span>
                    <ChevronRight
                      className={`w-4 h-4 ${
                        isActive ? "text-cyan-400" : "text-slate-500"
                      }`}
                    />
                  </Link>
                );
              })}
            </div>

            {/* Action Group: Direct Call, WhatsApp & Booking */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-3 block mb-1">
                Contact &amp; Reservations
              </span>

              <Link
                href="/book"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full bg-[#00838F] hover:bg-[#007079] text-white font-bold py-3 rounded-lg text-xs shadow-xs flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>{t.bookNow || "Book Swimming Slot Online"}</span>
              </Link>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href="tel:+919947714716"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-200 font-semibold text-xs hover:bg-slate-800 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Call Desk</span>
                </a>

                <a
                  href="https://wa.me/919947714716?text=Hello%20M.A.K%20Indoor%20Pool%2C%20I%20would%20like%20to%20enquire%20about%20booking%20a%20slot."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border border-emerald-800/80 bg-emerald-950/50 text-emerald-300 font-semibold text-xs hover:bg-emerald-900/60 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp</span>
                </a>
              </div>

              <Link
                href="/booking-status"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-slate-700 bg-slate-800/40 text-slate-300 font-semibold text-xs hover:bg-slate-800 transition text-center"
              >
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.checkBooking || "Lookup Existing Booking"}</span>
              </Link>
            </div>

            {/* Bottom Utility: Language Switcher & Staff Access */}
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center px-2 text-xs">
              <button
                onClick={() => {
                  toggleLanguage();
                  setMobileMenuOpen(false);
                }}
                className="inline-flex items-center gap-1.5 text-slate-300 font-medium py-1 px-2 rounded-md hover:bg-slate-800 transition"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>{lang === "en" ? "ഭാഷ: മലയാളം" : "Language: English"}</span>
              </button>

              <Link
                href="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-cyan-400 font-bold py-1 px-2 rounded-md hover:bg-slate-800 transition"
              >
                {t.staffLogin || "Staff Portal"} &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
