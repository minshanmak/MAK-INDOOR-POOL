"use client";

import { useEffect } from "react";

export default function PricingRedirect() {
  useEffect(() => {
    window.location.replace("/#pricing");
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-[#061426] text-white">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-300">Redirecting to Pricing...</p>
      </div>
    </div>
  );
}
