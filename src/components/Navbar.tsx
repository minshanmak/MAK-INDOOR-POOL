"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import MakLogo from "@/components/MakLogo";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  // Nav items in exact sequential order matching the one-page landing sections
  const navItems = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "pricing", label: "Pricing" },
    { id: "gallery", label: "Gallery" },
    { id: "policies", label: "Policies" },
    { id: "faq", label: "FAQ" },
    { id: "contact", label: "Contact" },
  ];

  // Scroll-Spy: Highlight active navbar pill as user scrolls
  useEffect(() => {
    if (pathname !== "/") return;

    const handleScroll = () => {
      // If at top of the page
      if (window.scrollY < 120) {
        setActiveSection("home");
        return;
      }

      // If at bottom of the page
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 80
      ) {
        setActiveSection("contact");
        return;
      }

      const scrollPosition = window.scrollY + 160; // offset buffer for navbar
      // Check sections from bottom up
      const sectionOrder = [
        "contact",
        "faq",
        "policies",
        "gallery",
        "pricing",
        "about",
        "home",
      ];

      for (const id of sectionOrder) {
        const element = document.getElementById(id);
        if (element) {
          const top = element.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  // Do not render public header on admin management routes
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    if (pathname === "/") {
      e.preventDefault();
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", `#${id}`);
        setActiveSection(id);
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#030d1a]/55 backdrop-blur-2xl border-b border-white/[0.12] text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all">
      {/* Specular top rim highlight for Apple liquid glass effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[70px]">
          {/* Brand Logo */}
          <Link
            href="/"
            onClick={(e) => handleNavClick(e, "home")}
            className="flex items-center group py-2"
            aria-label="M.A.K Indoor Pool - Home"
          >
            <MakLogo size="md" light={true} />
          </Link>

          {/* Desktop Navigation Links (iOS Glass Capsule - Ultra Refined) */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/[0.08] border border-white/[0.22] p-1.5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
            {navItems.map((item) => {
              const isActive = pathname === "/" && activeSection === item.id;
              const targetHref = pathname === "/" ? `#${item.id}` : `/#${item.id}`;

              return (
                <a
                  key={item.id}
                  href={targetHref}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] text-white font-bold shadow-[0_0_18px_rgba(56,189,248,0.55),inset_0_1px_1px_rgba(255,255,255,0.7)] border border-sky-200/50"
                      : "text-slate-200/90 font-medium hover:text-white hover:bg-white/[0.12] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Right Action Group: iOS Glass Login Pill + Book Now CTA */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link
              href="/admin/login"
              className="bg-white/[0.08] hover:bg-white/[0.18] text-white border border-white/[0.22] px-4 py-1.5 rounded-full text-xs font-bold transition-all backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_4px_16px_rgba(0,0,0,0.2)] active:scale-95"
            >
              Login
            </Link>

            <Link
              href="/book"
              className="bg-white/95 hover:bg-white text-slate-950 font-black px-4 py-1.5 rounded-full text-xs shadow-[0_4px_24px_rgba(255,255,255,0.3),inset_0_1px_1px_rgba(255,255,255,0.9)] flex items-center gap-1.5 transition active:scale-95"
            >
              <span>Book Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2 sm:hidden">
            <Link
              href="/book"
              className="bg-white text-slate-950 font-black px-3 py-1.5 rounded-full text-xs shadow-xs"
            >
              Book
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white/[0.08] border border-white/20 text-white hover:bg-white/15 transition backdrop-blur-xl active:scale-95"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu (iOS Frosted Glass) */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#030d1a]/80 backdrop-blur-3xl border-b border-white/[0.15] px-4 pt-3 pb-6 space-y-2 shadow-2xl">
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === "/" && activeSection === item.id;
              const targetHref = pathname === "/" ? `#${item.id}` : `/#${item.id}`;

              return (
                <a
                  key={item.id}
                  href={targetHref}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                    isActive
                      ? "bg-gradient-to-r from-[#0284c7] to-[#38bdf8] text-white font-bold shadow-md border border-sky-300/40"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
          <div className="pt-3 border-t border-white/[0.15] flex items-center gap-2">
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center bg-white/[0.08] hover:bg-white/15 text-white py-2 rounded-full text-xs font-bold border border-white/20 backdrop-blur-xl"
            >
              Login
            </Link>
            <Link
              href="/book"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center bg-white text-slate-950 py-2 rounded-full text-xs font-black shadow-md"
            >
              Book Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
