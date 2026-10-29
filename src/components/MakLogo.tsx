"use client";

import React from "react";
import { Waves } from "lucide-react";

export default function MakLogo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-md bg-[#00838F] flex items-center justify-center text-white shadow-xs">
        <Waves className="w-4 h-4 stroke-[2.5]" />
      </div>
      <div className="leading-tight">
        <div className={`font-black text-sm tracking-tight ${light ? "text-white" : "text-[#0A192F]"}`}>
          M.A.K
        </div>
        <div className={`text-[10px] font-semibold tracking-wide ${light ? "text-cyan-300" : "text-[#00838F]"}`}>
          Indoor Pool
        </div>
      </div>
    </div>
  );
}
