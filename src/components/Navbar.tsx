"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Waves, Menu, X, Globe, Phone, Clock, ArrowRight } from "lucide-react";
import { translations, Language } from "@/lib/i18n";

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
    { href: "/", label: t.home },
    { href: "/pricing", label: t.pricing },
    { href: "/gallery", label: t.gallery },
    { href: "/about", label: t.about },
    { href: "/policies", label: t.policies },
    { href: "/faq", label: t.faq },
    { href: "/contact", label: t.contact },
    { href: "/booking-status", label: t.checkBooking },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0B192C] text-slate-100 border-b border-slate-800/80">
      {/* Top Utility Ribbon */}
      <div className="bg-[#071322] px-4 py-1.5 text-xs text-slate-400 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              Open Daily: 9:00 AM – 11:00 PM
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline text-slate-400">
              Aluva, Ernakulam, Kerala
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="tel:+919447012345"
              className="hidden sm:flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors text-[11px]"
            >
              <Phone className="w-3 h-3 text-cyan-400" />
              <span>+91 94470 12345</span>
            </a>
            <span className="hidden sm:inline text-slate-700">|</span>
            <Link
              href="/admin/login"
              className="text-slate-400 hover:text-slate-200 text-[11px] font-medium transition"
            >
              Staff Portal &rarr;
            </Link>
            <span className="text-slate-700">|</span>
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-cyan-400 transition"
              title="Toggle Language"
            >
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>{lang === "en" ? "മലയാളം" : "English"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-cyan-600 flex items-center justify-center text-white shadow-sm transition group-hover:bg-cyan-500">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-white flex items-center gap-1 leading-none">
                M.A.K <span className="text-cyan-400 font-light">INDOOR POOL</span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium block mt-1">
                Private Aquatic Center
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "text-cyan-400 bg-slate-800/80 font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/book"
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs shadow-sm transition flex items-center gap-1.5"
            >
              <span>{t.bookNow}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/book"
              className="bg-cyan-500 text-slate-950 font-bold px-3 py-1.5 rounded-md text-xs"
            >
              {t.bookNow}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#071322] border-b border-slate-800 px-4 pt-2 pb-6 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                pathname === link.href
                  ? "text-cyan-400 bg-slate-800"
                  : "text-slate-300 hover:bg-slate-800/50"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-800 flex justify-between items-center px-3 text-xs">
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-cyan-400 font-semibold"
            >
              Staff Login &rarr;
            </Link>
            <button
              onClick={() => {
                toggleLanguage();
                setMobileMenuOpen(false);
              }}
              className="text-slate-300 flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              {lang === "en" ? "മലയാളം" : "English"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
