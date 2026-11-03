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
    <header className="fixed top-3.5 sm:top-5 inset-x-0 z-50 flex flex-col items-center px-3 sm:px-4 pointer-events-none">
      {/* Haven-Style Unified Floating Island Capsule */}
      <div className="pointer-events-auto flex items-center justify-between gap-4 sm:gap-6 lg:gap-8 px-3.5 sm:px-5 py-2 rounded-full transition-all duration-300 max-w-fit w-auto text-slate-900 bg-white/95 backdrop-blur-xl border border-white/90 shadow-[0_6px_28px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)]">
        {/* 1. Brand Logo inside the floating island */}
        <Link
          href="/"
          onClick={(e) => handleNavClick(e, "home")}
          className="flex items-center group py-0.5 shrink-0 select-none"
          aria-label="M.A.K Indoor Pool - Home"
        >
          <MakLogo size="sm" showTagline={true} light={false} />
        </Link>

        {/* 2. Desktop Navigation Links (Floating directly inside island without nested grey box) */}
        <nav className="relative hidden lg:flex items-center gap-0.5">
          {/* Hardware-accelerated sliding liquid glass indicator */}
          <div
            className="absolute rounded-full pointer-events-none bg-slate-100 border border-slate-200/50 shadow-xs"
            style={{
              transform: `translate3d(${indicatorStyle.left}px, 0, 0)`,
              width: `${indicatorStyle.width}px`,
              left: 0,
              top: "2px",
              bottom: "2px",
              opacity: indicatorStyle.opacity,
              transition:
                "transform 300ms cubic-bezier(0.16, 1, 0.3, 1), width 250ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease",
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
                className={`relative z-10 px-3.5 py-1.5 rounded-full text-xs font-semibold select-none transition-colors duration-200 ${
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

        {/* 3. Right Action Group: Login + Ceramic Book Now Button */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <Link
            href="/admin/login"
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-950 transition active:scale-95"
          >
            Login
          </Link>

          <Link
            href="/book"
            className="px-4 py-2 rounded-full text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.18),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center gap-1.5 transition active:scale-95"
          >
            <span>Book Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4. Mobile Quick Action & Hamburger Toggle */}
        <div className="flex sm:hidden items-center gap-1.5 shrink-0">
          <Link
            href="/book"
            className="px-3 py-1.5 rounded-full text-xs font-bold text-white bg-slate-950 shadow-xs active:scale-95 transition"
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
