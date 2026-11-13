"use client";

import React from "react";
import Image from "next/image";

interface MakLogoProps {
  light?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "full" | "horizontal" | "mark";
  showTagline?: boolean;
  className?: string;
  priority?: boolean;
}

export default function MakLogo({
  light = false,
  size = "md",
  variant = "full",
  showTagline = true,
  className = "",
  priority = false,
}: MakLogoProps) {
  // Height presets for the logo
  const heightStyles = {
    xs: { h: "h-6", px: 24, wFull: 44, wMark: 28 },
    sm: { h: "h-8 sm:h-9", px: 34, wFull: 62, wMark: 38 },
    md: { h: "h-10", px: 40, wFull: 73, wMark: 48 },
    lg: { h: "h-12 sm:h-14", px: 52, wFull: 95, wMark: 62 },
    xl: { h: "h-16 sm:h-20", px: 76, wFull: 138, wMark: 90 },
  };

  const selectedSize = heightStyles[size] || heightStyles.md;

  // 1. Full Stacked Logo (Official swimmer + M.A.K INDOOR POOL)
  if (variant === "full") {
    const logoSrc = light ? "/images/mak-logo-white.png" : "/images/mak-logo.png";
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        <img
          src={logoSrc}
          alt="M.A.K Indoor Pool"
          className={`${selectedSize.h} w-auto object-contain transition-transform duration-200 group-hover:scale-102`}
          loading={priority ? "eager" : "lazy"}
        />
      </div>
    );
  }

  // 2. Mark Only (Swimmer + Waves)
  if (variant === "mark") {
    const markSrc = light ? "/images/mak-logo-mark-white.png" : "/images/mak-logo-mark.png";
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        <img
          src={markSrc}
          alt="M.A.K Indoor Pool Mark"
          className={`${selectedSize.h} w-auto object-contain transition-transform duration-200 group-hover:scale-105`}
          loading={priority ? "eager" : "lazy"}
        />
      </div>
    );
  }

  // 3. Horizontal Lockup (Swimmer mark on left + Brand typography on right)
  const markSrc = light ? "/images/mak-logo-mark-white.png" : "/images/mak-logo-mark.png";

  const titleSizes = {
    xs: "text-xs tracking-tight",
    sm: "text-sm tracking-tight",
    md: "text-base tracking-tight",
    lg: "text-lg tracking-tight",
    xl: "text-2xl tracking-tight",
  };

  const subtitleSizes = {
    xs: "text-[8px] tracking-wider",
    sm: "text-[9px] tracking-widest",
    md: "text-[10px] tracking-widest",
    lg: "text-xs tracking-widest",
    xl: "text-sm tracking-widest",
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className="shrink-0 flex items-center justify-center">
        <img
          src={markSrc}
          alt="M.A.K Indoor Pool Mark"
          className={`${selectedSize.h} w-auto object-contain transition-transform duration-200 group-hover:scale-105`}
          loading={priority ? "eager" : "lazy"}
        />
      </div>
      <div className="leading-tight">
        <div
          className={`font-black font-sans ${titleSizes[size]} ${
            light ? "text-white" : "text-[#002F67]"
          }`}
        >
          M.A.K
        </div>
        {showTagline && (
          <div
            className={`font-bold uppercase ${subtitleSizes[size]} ${
              light ? "text-sky-400" : "text-[#0284C7]"
            }`}
          >
            Indoor Pool
          </div>
        )}
      </div>
    </div>
  );
}
