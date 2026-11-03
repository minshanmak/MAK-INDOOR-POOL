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

  // Measure and update the liquid glass sliding indicator pill
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

  // Scroll-Spy to track active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);

      if (pathname !== "/") return;

      // If user clicked a tab, let smooth scroll finish without jittering intermediate tabs
      if (isClickScrollingRef.current) return;

      // Top boundary
      if (scrollY < 100) {
        setActiveSection("home");
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
        // Prevent scroll-spy from jumping tabs during smooth scroll
        isClickScrollingRef.current = true;
        if (clickScrollTimeoutRef.current) {
          clearTimeout(clickScrollTimeoutRef.current);
        }

        // Instantly glide indicator to target tab with fluid iOS animation
        setActiveSection(id);

        // Native iOS spring smooth scrolling with exact navbar offset
        const yOffset = -90;
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
    <header className="fixed top-3 sm:top-5 inset-x-0 z-50 flex flex-col items-center px-3 sm:px-4 pointer-events-none">
      {/* Haven-Style Unified Floating Island Capsule */}
      <div
        className={`pointer-events-auto flex items-center justify-between gap-1.5 sm:gap-3 lg:gap-4 pl-3.5 pr-2 sm:pl-4 sm:pr-2.5 py-1.5 rounded-full transition-all duration-300 max-w-fit w-auto text-slate-900 ${
          isScrolled
            ? "bg-white/85 backdrop-blur-2xl backdrop-saturate-200 border border-white/90 shadow-[0_10px_35px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)]"
            : "bg-white/75 backdrop-blur-2xl backdrop-saturate-200 border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)]"
        }`}
      >
        {/* 1. Brand Logo inside the floating island */}
        <Link
          href="/"
          onClick={(e) => handleNavClick(e, "home")}
          className="flex items-center gap-2 group py-1 pr-1 shrink-0 select-none"
          aria-label="M.A.K Indoor Pool - Home"
        >
          <MakLogo size="sm" showTagline={false} light={false} />
          <div className="hidden min-[460px]:block leading-none pr-1">
            <span className="font-black text-xs tracking-tight text-slate-900 block">
              M.A.K
            </span>
            <span className="text-[8.5px] font-bold text-[#00838F] block tracking-wider uppercase">
              INDOOR POOL
            </span>
          </div>
        </Link>

        {/* Subtle Vertical Divider */}
        <div className="hidden lg:block w-px h-5 bg-slate-300/60 my-auto" />

        {/* 2. Desktop Navigation Links (Unified track with sliding white pill indicator) */}
        <nav className="relative hidden lg:flex items-center p-1 rounded-full bg-slate-100/70 border border-slate-200/50">
          {/* Hardware-accelerated sliding liquid glass indicator */}
          <div
            className="absolute rounded-full pointer-events-none bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]"
            style={{
              transform: `translate3d(${indicatorStyle.left}px, 0, 0)`,
              width: `${indicatorStyle.width}px`,
              left: 0,
              top: "3px",
              bottom: "3px",
              opacity: indicatorStyle.opacity,
              transition:
                "transform 340ms cubic-bezier(0.16, 1, 0.3, 1), width 280ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease",
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
                className={`relative z-10 px-3 py-1 rounded-full text-xs font-semibold select-none transition-colors duration-200 ${
                  isActive
                    ? "text-slate-950 font-bold"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Subtle Vertical Divider */}
        <div className="hidden lg:block w-px h-5 bg-slate-300/60 my-auto" />

        {/* 3. Right Action Group: Login + Ceramic Book Now Button */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <Link
            href="/admin/login"
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 transition active:scale-95"
          >
            Login
          </Link>

          <Link
            href="/book"
            className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.25)] flex items-center gap-1.5 transition active:scale-95"
          >
            <span>Book Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4. Mobile Quick Action & Hamburger Toggle */}
        <div className="flex sm:hidden items-center gap-1.5 shrink-0">
          <Link
            href="/book"
            className="px-3 py-1 rounded-full text-xs font-bold text-white bg-slate-950 shadow-xs active:scale-95 transition"
          >
            Book
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-full bg-slate-100 text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 transition active:scale-95 border border-slate-200/60"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Glass Dropdown (Anchored directly under the floating island) */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto mt-2 w-full max-w-xs sm:hidden rounded-3xl bg-white/95 backdrop-blur-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,0,0,0.15)] p-3 space-y-2 transition-all">
          <nav className="flex flex-col space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === "/" && activeSection === item.id;
              const targetHref =
                pathname === "/" ? `#${item.id}` : `/#${item.id}`;

              return (
                <a
                  key={item.id}
                  href={targetHref}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-semibold cursor-pointer transition ${
                    isActive
                      ? "bg-slate-950 text-white font-bold shadow-xs"
                      : "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
            >
              Login
            </Link>
            <Link
              href="/book"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2 rounded-full text-xs font-bold bg-slate-950 text-white hover:bg-slate-800 shadow-sm transition"
            >
              Book Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
