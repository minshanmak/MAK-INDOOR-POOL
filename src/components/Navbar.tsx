"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import MakLogo from "@/components/MakLogo";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);

  // References to navigation anchor links for measuring the sliding indicator position
  const navItemRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  // Lock to avoid scroll-spy bouncing intermediate tabs during smooth click-scrolling
  const isClickScrollingRef = useRef(false);
  const clickScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Nav items in exact sequential order
  const navItems = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "pricing", label: "Pricing" },
    { id: "gallery", label: "Gallery" },
    { id: "policies", label: "Policies" },
    { id: "faq", label: "FAQ" },
    { id: "contact", label: "Contact" },
  ];

  // Measure and update the iPhone liquid glass sliding indicator pill
  useEffect(() => {
    const updateIndicator = () => {
      const currentRef = navItemRefs.current[activeSection];
      if (currentRef) {
        setIndicatorStyle({
          left: currentRef.offsetLeft,
          width: currentRef.offsetWidth,
          opacity: 1,
        });
      }
    };

    updateIndicator();
    const rafId = requestAnimationFrame(updateIndicator);

    if (typeof document !== "undefined" && (document as any).fonts?.ready) {
      (document as any).fonts.ready.then(updateIndicator);
    }

    window.addEventListener("resize", updateIndicator);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeSection, pathname]);

  // Scroll-Spy & Dynamic Header Clear Glass Transition
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);

      if (pathname !== "/") {
        setIsPastHero(true);
        return;
      }

      // Detect when scrolled past the hero section
      const heroElement = document.getElementById("home");
      const heroHeight = heroElement ? heroElement.offsetHeight - 90 : 580;
      setIsPastHero(scrollY >= heroHeight);

      // If user clicked a tab, let smooth scroll finish without jittering intermediate tabs
      if (isClickScrollingRef.current) return;

      // Top boundary
      if (scrollY < 100) {
        setActiveSection("home");
        setIsPastHero(false);
        return;
      }

      // Bottom boundary
      if (
        window.innerHeight + scrollY >=
        document.documentElement.scrollHeight - 70
      ) {
        setActiveSection("contact");
        return;
      }

      const scrollPosition = scrollY + 160;
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

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (clickScrollTimeoutRef.current) {
        clearTimeout(clickScrollTimeoutRef.current);
      }
    };
  }, [pathname]);

  // Do not render public header on admin management routes or booking wizard
  if (pathname.startsWith("/admin") || pathname.startsWith("/book")) {
    return null;
  }

  // Determine if navbar is over light page content (after hero or on child routes)
  const isLightGlass = pathname !== "/" || isPastHero;

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    if (pathname === "/") {
      e.preventDefault();
      const element = document.getElementById(id);
      if (element) {
        // Prevent scroll-spy from jumping intermediate tabs during smooth scroll
        isClickScrollingRef.current = true;
        if (clickScrollTimeoutRef.current) {
          clearTimeout(clickScrollTimeoutRef.current);
        }

        // Instantly glide indicator to target tab with fluid iOS animation
        setActiveSection(id);
        setIsPastHero(id !== "home");

        // Native iOS spring smooth scrolling with exact navbar offset
        const yOffset = -75;
        const y =
          element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
        window.history.pushState(null, "", `#${id}`);

        // Re-enable scroll-spy once smooth scrolling completes
        clickScrollTimeoutRef.current = setTimeout(() => {
          isClickScrollingRef.current = false;
        }, 850);
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 inset-x-0 w-full z-50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isLightGlass
          ? "bg-white/80 backdrop-blur-2xl border-b border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-slate-900"
          : isScrolled
          ? "bg-[#061426]/90 backdrop-blur-2xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-white"
          : "bg-[#061426]/75 sm:bg-[#061426]/60 backdrop-blur-xl border-b border-white/10 shadow-sm text-white"
      }`}
    >
      {/* Specular top rim highlight for Apple liquid glass refraction */}
      <div
        className={`absolute inset-x-0 top-0 h-px pointer-events-none transition-opacity duration-300 ${
          isLightGlass
            ? "bg-gradient-to-r from-transparent via-slate-300/40 to-transparent"
            : "bg-gradient-to-r from-transparent via-white/30 to-transparent"
        }`}
      />

      <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-[70px]">
          {/* 1. Brand Logo with dynamic light/dark contrast */}
          <Link
            href="/"
            onClick={(e) => handleNavClick(e, "home")}
            className="flex items-center group py-2 select-none"
            aria-label="M.A.K Indoor Pool - Home"
          >
            <MakLogo size="sm" className="sm:hidden" light={!isLightGlass} showTagline={true} />
            <MakLogo size="md" className="hidden sm:flex" light={!isLightGlass} showTagline={true} />
          </Link>

          {/* 2. Desktop Navigation Links (iPhone Liquid Glass Capsule with GPU Sliding Pill) */}
          <nav
            className={`relative hidden lg:flex items-center p-1 rounded-full backdrop-blur-2xl transition-all duration-300 ${
              isLightGlass
                ? "bg-slate-900/[0.04] border border-slate-900/[0.08] shadow-inner"
                : "bg-white/[0.08] border border-white/[0.15] shadow-inner"
            }`}
          >
            {/* Liquid Glass Sliding Pill Indicator (GPU Hardware Accelerated) */}
            <div
              className={`absolute rounded-full pointer-events-none transition-all ${
                isLightGlass
                  ? "bg-slate-950 shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                  : "bg-white shadow-[0_4px_16px_rgba(0,0,0,0.3),0_1px_3px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.95)]"
              }`}
              style={{
                transform: `translate3d(${indicatorStyle.left}px, 0, 0)`,
                width: `${indicatorStyle.width}px`,
                left: 0,
                top: "4px",
                bottom: "4px",
                opacity: indicatorStyle.opacity,
                transition:
                  "transform 380ms cubic-bezier(0.16, 1, 0.3, 1), width 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease",
                willChange: "transform, width",
              }}
            />

            {navItems.map((item) => {
              const isActive = pathname === "/" && activeSection === item.id;
              const targetHref =
                pathname === "/" ? `#${item.id}` : `/#${item.id}`;

              return (
                <a
                  key={item.id}
                  ref={(el) => {
                    navItemRefs.current[item.id] = el;
                  }}
                  href={targetHref}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer select-none transition-colors duration-200 ${
                    isActive
                      ? isLightGlass
                        ? "text-white font-bold"
                        : "text-slate-950 font-bold"
                      : isLightGlass
                      ? "text-slate-600 hover:text-slate-950"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* 3. Right Action Group: Ceramic Book Now CTA */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link
              href="/book"
              className={`px-4.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
                isLightGlass
                  ? "bg-slate-950 hover:bg-slate-800 text-white shadow-[0_4px_16px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.2)]"
                  : "bg-white hover:bg-slate-100 text-slate-950 shadow-[0_4px_24px_rgba(255,255,255,0.25),inset_0_1px_1px_rgba(255,255,255,0.95)]"
              }`}
            >
              <span>Book Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 4. Mobile Hamburger & Quick CTA Toggle */}
          <div className="flex items-center gap-2 sm:hidden shrink-0">
            <Link
              href="/book"
              className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-xs transition active:scale-95 ${
                isLightGlass
                  ? "bg-slate-950 text-white"
                  : "bg-white text-slate-950"
              }`}
            >
              Book
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-xl border transition backdrop-blur-xl active:scale-95 ${
                isLightGlass
                  ? "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200/80"
                  : "bg-white/[0.12] border-white/20 text-white hover:bg-white/20"
              }`}
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu (iOS Frosted Glass) */}
      {mobileMenuOpen && (
        <div
          className={`sm:hidden backdrop-blur-3xl px-4 pt-3 pb-6 space-y-2 shadow-2xl transition-all border-b ${
            isLightGlass
              ? "bg-white/95 border-slate-200/80 text-slate-800"
              : "bg-[#061426]/95 border-white/[0.15] text-white"
          }`}
        >
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === "/" && activeSection === item.id;
              const targetHref =
                pathname === "/" ? `#${item.id}` : `/#${item.id}`;

              return (
                <a
                  key={item.id}
                  href={targetHref}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                    isActive
                      ? isLightGlass
                        ? "bg-slate-950 text-white font-bold shadow-xs"
                        : "bg-white text-slate-950 font-bold shadow-md"
                      : isLightGlass
                      ? "text-slate-600 hover:text-slate-950 hover:bg-slate-100/70"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
          <div
            className={`pt-3 border-t flex items-center gap-2 ${
              isLightGlass ? "border-slate-200" : "border-white/[0.15]"
            }`}
          >
            <Link
              href="/book"
              onClick={() => setMobileMenuOpen(false)}
              className={`w-full text-center py-2.5 rounded-full text-xs font-bold shadow-md transition active:scale-95 ${
                isLightGlass
                  ? "bg-slate-950 text-white hover:bg-slate-800"
                  : "bg-white text-slate-900 hover:bg-slate-100"
              }`}
            >
              Book Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
