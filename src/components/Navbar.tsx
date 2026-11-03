"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import MakLogo from "@/components/MakLogo";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Do not render public header on admin management routes
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/pricing", label: "Pricing" },
    { href: "/gallery", label: "Gallery" },
    { href: "/about", label: "About" },
    { href: "/policies", label: "Policies" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#0284C7] backdrop-blur-md border-b border-white/20 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[70px]">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center group py-2"
            aria-label="M.A.K Indoor Pool - Home"
          >
            <MakLogo size="md" light={true} />
          </Link>

          {/* Desktop Navigation Links (Pill Style - Exact Mockup Match) */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/15 border border-white/25 p-1.5 rounded-full shadow-inner backdrop-blur-md">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-white text-[#0284C7] font-extrabold shadow-sm"
                      : "text-white/90 hover:text-white hover:bg-white/20"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Group: Login Pill + Book Now CTA (Exact Mockup Match) */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link
              href="/admin/login"
              className="bg-white/15 hover:bg-white/25 text-white border border-white/30 px-4 py-1.5 rounded-full text-xs font-bold transition backdrop-blur-xs"
            >
              Login
            </Link>

            <Link
              href="/book"
              className="bg-white hover:bg-sky-50 text-[#0284C7] font-extrabold px-4 py-1.5 rounded-full text-xs shadow-md flex items-center gap-1.5 transition active:scale-95"
            >
              <span>Book Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2 sm:hidden">
            <Link
              href="/book"
              className="bg-white text-[#0284C7] font-extrabold px-3 py-1.5 rounded-full text-xs shadow-xs"
            >
              Book
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white/15 text-white hover:bg-white/25 transition active:scale-95"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#0284C7] border-b border-white/20 px-4 pt-3 pb-6 space-y-2">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold ${
                    isActive
                      ? "bg-white text-[#0284C7] font-extrabold shadow-xs"
                      : "text-white/90 hover:text-white hover:bg-white/15"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="pt-3 border-t border-white/20 flex items-center gap-2">
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center bg-white/15 hover:bg-white/25 text-white py-2 rounded-full text-xs font-bold border border-white/25"
            >
              Login
            </Link>
            <Link
              href="/book"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center bg-white text-[#0284C7] py-2 rounded-full text-xs font-black shadow-md"
            >
              Book Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
