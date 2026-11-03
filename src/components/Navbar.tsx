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

  // Nav items in exact order matching reference mockup
  const navItems = [
    { id: "home", label: "Home" },
    { id: "pricing", label: "Pricing" },
    { id: "gallery", label: "Gallery" },
    { id: "about", label: "About" },
    { id: "policies", label: "Policies" },
    { id: "faq", label: "FAQ" },
    { id: "contact", label: "Contact" },
  ];

  // Scroll-Spy: Highlight active navbar pill as user scrolls
  useEffect(() => {
    if (pathname !== "/") return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140; // offset buffer for navbar
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
    <header className="sticky top-0 z-50 bg-[#061426]/95 backdrop-blur-md border-b border-white/10 text-white shadow-md">
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

          {/* Desktop Navigation Links (Pill Style - Exact Mockup Match) */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#0E2849]/70 border border-white/10 p-1.5 rounded-full shadow-inner backdrop-blur-md">
            {navItems.map((item) => {
              const isActive = pathname === "/" && activeSection === item.id;
              const targetHref = pathname === "/" ? `#${item.id}` : `/#${item.id}`;

              return (
                <a
                  key={item.id}
                  href={targetHref}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-[#0284C7] text-white font-bold shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Right Action Group: Login Pill + Book Now CTA (Exact Mockup Match) */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link
              href="/admin/login"
              className="bg-[#0E2849]/80 hover:bg-[#163D6C] text-white border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold transition backdrop-blur-xs"
            >
              Login
            </Link>

            <Link
              href="/book"
              className="bg-white hover:bg-slate-100 text-slate-900 font-extrabold px-4 py-1.5 rounded-full text-xs shadow-md flex items-center gap-1.5 transition active:scale-95"
            >
              <span>Book Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2 sm:hidden">
            <Link
              href="/book"
              className="bg-white text-slate-900 font-extrabold px-3 py-1.5 rounded-full text-xs shadow-xs"
            >
              Book
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition active:scale-95"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#061426] border-b border-white/10 px-4 pt-3 pb-6 space-y-2">
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === "/" && activeSection === item.id;
              const targetHref = pathname === "/" ? `#${item.id}` : `/#${item.id}`;

              return (
                <a
                  key={item.id}
                  href={targetHref}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    isActive
                      ? "bg-[#0284C7] text-white font-bold"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
          <div className="pt-3 border-t border-white/10 flex items-center gap-2">
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center bg-white/10 hover:bg-white/20 text-white py-2 rounded-full text-xs font-bold border border-white/20"
            >
              Login
            </Link>
            <Link
              href="/book"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center bg-white text-slate-900 py-2 rounded-full text-xs font-black shadow-md"
            >
              Book Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
