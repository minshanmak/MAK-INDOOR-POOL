"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Globe, Phone, ArrowRight } from "lucide-react";
import { translations, Language } from "@/lib/i18n";
import MakLogo from "@/components/MakLogo";

export default function Navbar() {
  const pathname = usePathname();
  const [lang, setLang] = useState<Language>("en");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("mak_lang") as Language;
    if (saved && (saved === "en" || saved === "ml")) {
      setLang(saved);
    }
  }, []);

  const toggleLanguage = () => {
    const nextLang: Language = lang === "en" ? "ml" : "en";
    setLang(nextLang);
    localStorage.setItem("mak_lang", nextLang);
    window.dispatchEvent(new Event("languageChange"));
  };

  const t = translations[lang];

  // Do not render public header on admin pages
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const navLinks = [
    { href: "/", label: t.home || "Home" },
    { href: "/about", label: t.about || "About" },
    { href: "/pricing", label: "Prices" },
    { href: "/gallery", label: t.gallery || "Gallery" },
    { href: "/policies", label: t.policies || "Policies" },
    { href: "/contact", label: t.contact || "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/90 shadow-xs">
      {/* Top Utility Ribbon */}
      <div className="bg-[#0B192C] text-slate-300 px-4 py-1 text-[11px] border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              Open Daily: 9:00 AM – 11:00 PM
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline text-slate-400">
              Aluva, Ernakulam, Kerala
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="tel:+919447012345"
              className="hidden sm:flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
            >
              <Phone className="w-3 h-3 text-[#00BCD4]" />
              <span>+91 94470 12345</span>
            </a>
            <span className="hidden sm:inline text-slate-700">|</span>
            <Link
              href="/booking-status"
              className="text-slate-300 hover:text-white transition"
            >
              Check Booking
            </Link>
            <span className="text-slate-700">|</span>
            <Link
              href="/admin/login"
              className="text-cyan-400 hover:text-cyan-300 font-medium transition"
            >
              Staff Portal &rarr;
            </Link>
            <span className="text-slate-700">|</span>
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1 font-semibold text-slate-300 hover:text-cyan-400 transition"
              title="Toggle Language"
            >
              <Globe className="w-3 h-3 text-[#00BCD4]" />
              <span>{lang === "en" ? "മലയാളം" : "English"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Clean White Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <MakLogo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs font-semibold transition-colors ${
                    isActive
                      ? "text-[#00838F] border-b-2 border-[#00838F] pb-1 -mb-1"
                      : "text-slate-600 hover:text-[#00838F]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Teal Book Now Button */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/book"
              className="bg-[#00838F] hover:bg-[#007079] text-white font-bold px-5 py-2.5 rounded-lg text-xs shadow-xs transition duration-150 ease-in-out flex items-center gap-1.5"
            >
              <span>Book Now</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/book"
              className="bg-[#00838F] text-white font-bold px-3 py-1.5 rounded-md text-xs shadow-xs"
            >
              Book Now
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-1 shadow-md">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                pathname === link.href
                  ? "text-[#00838F] bg-teal-50 font-bold"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100 flex justify-between items-center px-3 text-xs">
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[#00838F] font-bold"
            >
              Staff Login &rarr;
            </Link>
            <button
              onClick={() => {
                toggleLanguage();
                setMobileMenuOpen(false);
              }}
              className="text-slate-600 flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5 text-[#00838F]" />
              {lang === "en" ? "മലയാളം" : "English"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
