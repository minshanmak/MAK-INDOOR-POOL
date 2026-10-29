"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Waves, Menu, X, Globe, ShieldCheck, Calendar, Phone } from "lucide-react";
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

  // Don't render public navbar on admin pages
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const navLinks = [
    { href: "/", label: t.home },
    { href: "/book", label: t.bookNow, highlight: true },
    { href: "/pricing", label: t.pricing },
    { href: "/gallery", label: t.gallery },
    { href: "/about", label: t.about },
    { href: "/contact", label: t.contact },
    { href: "/policies", label: t.policies },
    { href: "/faq", label: t.faq },
    { href: "/booking-status", label: t.checkBooking },
  ];

  return (
    <header className="sticky top-0 z-50 bg-ocean-950/95 backdrop-blur-md border-b border-ocean-800 text-white">
      {/* Operating Hours Top Bar */}
      <div className="bg-ocean-900 px-4 py-1.5 text-xs font-medium text-ocean-200 border-b border-ocean-800 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-lagoon-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t.safetyBadge}
          </span>
          <span className="hidden md:inline text-ocean-400">|</span>
          <span className="hidden md:inline">{t.operatingHours}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/login" className="hover:text-lagoon-300 transition-colors text-xs font-semibold">
            {t.staffLogin} &rarr;
          </Link>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 bg-ocean-800 hover:bg-ocean-700 px-2 py-0.5 rounded text-xs text-ocean-100 transition"
            title="Switch Language"
          >
            <Globe className="w-3 h-3 text-lagoon-400" />
            <span>{lang === "en" ? "മലയാളം" : "English"}</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-lagoon-500 to-ocean-500 flex items-center justify-center shadow-lg shadow-ocean-900/50">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white block leading-none">
                M.A.K <span className="text-lagoon-400">INDOOR POOL</span>
              </span>
              <span className="text-[10px] text-ocean-300 font-medium tracking-wider uppercase block mt-0.5">
                Aluva, Ernakulam
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              if (link.highlight) {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="ml-2 inline-flex items-center gap-1.5 bg-gradient-to-r from-lagoon-500 to-ocean-500 hover:from-lagoon-400 hover:to-ocean-400 text-ocean-950 font-bold px-4 py-2 rounded-lg text-sm shadow-md shadow-lagoon-500/20 transition-all hover:scale-105"
                  >
                    <Calendar className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "text-lagoon-400 bg-ocean-900/80"
                      : "text-ocean-100 hover:text-lagoon-300 hover:bg-ocean-900/40"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/book"
              className="bg-lagoon-500 hover:bg-lagoon-400 text-ocean-950 font-bold px-3 py-1.5 rounded-lg text-xs"
            >
              {t.bookNow}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-ocean-200 hover:text-white hover:bg-ocean-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-ocean-950 border-b border-ocean-800 px-4 pt-2 pb-6 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === link.href ? "text-lagoon-400 bg-ocean-900" : "text-ocean-100 hover:bg-ocean-900/50"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-ocean-800 flex justify-between items-center px-3">
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-lagoon-400"
            >
              {t.staffLogin} &rarr;
            </Link>
            <button
              onClick={() => {
                toggleLanguage();
                setMobileMenuOpen(false);
              }}
              className="text-xs text-ocean-200 flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === "en" ? "മലയാളം" : "English"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
