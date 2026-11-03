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

  // Measure and update the iOS sliding indicator pill
  useEffect(() => {
    const currentRef = navItemRefs.current[activeSection];
    if (currentRef) {
      setIndicatorStyle({
        left: currentRef.offsetLeft,
        width: currentRef.offsetWidth,
        opacity: 1,
      });
    }
  }, [activeSection, pathname]);

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      const currentRef = navItemRefs.current[activeSection];
      if (currentRef) {
        setIndicatorStyle({
          left: currentRef.offsetLeft,
          width: currentRef.offsetWidth,
          opacity: 1,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeSection]);

  // Scroll-Spy & Dynamic Header Blur Transition
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 25);

      if (pathname !== "/") return;

      // Top boundary
      if (scrollY < 100) {
        setActiveSection("home");
        return;
      }

      // Bottom boundary
      if (
        window.innerHeight + scrollY >=
        document.documentElement.scrollHeight - 80
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
        // Native iOS spring smooth scrolling with exact navbar offset
        const yOffset = -75;
        const y =
          element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
        window.history.pushState(null, "", `#${id}`);
        setActiveSection(id);
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isScrolled
          ? "bg-[#030d1a]/70 backdrop-blur-2xl border-b border-white/[0.15] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
          : "bg-black/15 backdrop-blur-xl border-b border-white/10 shadow-none"
      } text-white`}
    >
      {/* Specular top rim highlight for Apple liquid glass effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[70px]">
          {/* Brand Logo with drop shadow */}
          <Link
            href="/"
            onClick={(e) => handleNavClick(e, "home")}
            className="flex items-center group py-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
            aria-label="M.A.K Indoor Pool - Home"
          >
            <MakLogo size="md" light={true} />
          </Link>

          {/* Desktop Navigation Links (iOS Liquid Glass Capsule with Sliding Pill) */}
          <nav className="relative hidden lg:flex items-center bg-white/[0.12] border border-white/[0.25] p-1 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
            {/* iOS Spring Sliding White Pill Indicator */}
            <div
              className="absolute rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.9)] transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
                top: "4px",
                bottom: "4px",
                opacity: indicatorStyle.opacity,
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
                  className={`relative z-10 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors duration-200 ${
                    isActive
                      ? "text-slate-950 font-extrabold"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Right Action Group: Clear Glass Login Pill + Ceramic Book Now CTA */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link
              href="/admin/login"
              className="bg-white/[0.12] hover:bg-white/[0.22] text-white border border-white/[0.25] px-4 py-1.5 rounded-full text-xs font-bold transition-all backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_4px_16px_rgba(0,0,0,0.15)] active:scale-95"
            >
              Login
            </Link>

            <Link
              href="/book"
              className="bg-white hover:bg-slate-100 text-slate-950 font-black px-4 py-1.5 rounded-full text-xs shadow-[0_4px_24px_rgba(255,255,255,0.25),inset_0_1px_1px_rgba(255,255,255,0.9)] flex items-center gap-1.5 transition active:scale-95"
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
              className="p-2 rounded-xl bg-white/[0.12] border border-white/20 text-white hover:bg-white/20 transition backdrop-blur-xl active:scale-95"
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
        <div className="sm:hidden bg-[#030d1a]/85 backdrop-blur-3xl border-b border-white/[0.15] px-4 pt-3 pb-6 space-y-2 shadow-2xl transition-all">
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
                  className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                    isActive
                      ? "bg-white text-slate-950 font-extrabold shadow-md"
                      : "text-white/80 hover:text-white hover:bg-white/10"
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
              className="flex-1 text-center bg-white/[0.12] hover:bg-white/20 text-white py-2 rounded-full text-xs font-bold border border-white/20 backdrop-blur-xl"
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
