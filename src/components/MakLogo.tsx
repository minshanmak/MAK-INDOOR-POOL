"use client";

import React from "react";

interface MakLogoProps {
  light?: boolean;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}

export default function MakLogo({
  light = false,
  size = "md",
  showTagline = true,
  className = "",
}: MakLogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const titleSizes = {
    sm: "text-xs tracking-tight",
    md: "text-sm tracking-tight",
    lg: "text-base tracking-tight",
  };

  const subtitleSizes = {
    sm: "text-[9px] tracking-wider",
    md: "text-[10px] tracking-wider",
    lg: "text-xs tracking-wide",
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className={`${iconSizes[size]} flex items-center justify-center shrink-0`}>
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transition-transform duration-200 group-hover:scale-105"
        >
          {/* Top Wave */}
          <path
            d="M3 11.5C7 8 11.5 14 16 11C20.5 8 25 14 29.5 11C31 10 32.5 10.5 33.5 11"
            stroke={light ? "#38BDF8" : "#00838F"}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Middle Wave */}
          <path
            d="M2.5 18C6.5 14.5 11 20.5 15.5 17.5C20 14.5 24.5 20.5 29 17.5C30.5 16.5 32 17 33.5 17.5"
            stroke={light ? "#00BCD4" : "#0097A7"}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Bottom Wave */}
          <path
            d="M3.5 24.5C7.5 21 12 27 16.5 24C21 21 25.5 27 30 24C31.5 23 32.5 23.5 33.5 24"
            stroke={light ? "#67E8F9" : "#00ACC1"}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={light ? "0.9" : "0.75"}
          />
        </svg>
      </div>
      <div className="leading-tight">
        <div
          className={`font-black ${titleSizes[size]} ${
            light ? "text-white" : "text-[#0A192F]"
          }`}
        >
          M.A.K
        </div>
        {showTagline && (
          <div
            className={`font-semibold uppercase ${subtitleSizes[size]} ${
              light ? "text-cyan-300" : "text-[#00838F]"
            }`}
          >
            Indoor Pool
          </div>
        )}
      </div>
    </div>
  );
}
