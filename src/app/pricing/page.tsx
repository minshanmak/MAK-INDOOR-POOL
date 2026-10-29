import React from "react";
import Link from "next/link";
import { Check, Info, Users, Lock, ArrowRight } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Transparent, Affordable Pricing</h1>
        <p className="text-slate-600 text-base">
          No hidden fees or unexpected charges. Select between affordable daily public swimming or exclusive, 100% private family pool sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Public Swimming Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-ocean-300 transition">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-ocean-50 text-ocean-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Users className="w-4 h-4" />
              Daily Public Swimming
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900">₹150</span>
                <span className="text-slate-500 text-sm font-medium">/ person / hour</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Available 9:00 AM – 4:00 PM Daily</p>
            </div>

            <ul className="space-y-3 text-sm text-slate-600 border-t border-slate-100 pt-6">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Access to the full indoor pool area</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Strict capacity limit (max 25 swimmers at a time)</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Clean shower facilities & changing rooms</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Full online payment or walk-in cash/UPI</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <Link
              href="/book"
              className="w-full inline-flex justify-center items-center gap-2 bg-ocean-600 hover:bg-ocean-700 text-white font-bold py-3.5 px-6 rounded-xl text-sm transition shadow-sm"
            >
              Book Public Slot &rarr;
            </Link>
          </div>
        </div>

        {/* Exclusive Family Booking Card */}
        <div className="bg-gradient-to-b from-ocean-950 to-ocean-900 text-white rounded-3xl p-8 border border-lagoon-500/40 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-lagoon-500 text-ocean-950 text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider">
            100% PRIVATE
          </div>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-ocean-800 text-lagoon-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Lock className="w-4 h-4" />
              Exclusive Family Booking
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white">₹1,500</span>
                <span className="text-ocean-300 text-sm font-medium">/ hour (up to 12 persons)</span>
              </div>
              <p className="text-xs text-lagoon-400 mt-1">Available 4:00 PM – 11:00 PM Daily</p>
            </div>

            <ul className="space-y-3 text-sm text-ocean-100 border-t border-ocean-800 pt-6">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-lagoon-400 shrink-0" />
                <span>Entire pool facility reserved exclusively for your family</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-lagoon-400 shrink-0" />
                <span>Includes up to 12 family members or friends</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-lagoon-400 shrink-0" />
                <span>Each additional person above 12 adds just ₹100/hr</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-lagoon-400 shrink-0" />
                <span>Only ₹750 advance needed to lock the slot online</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-lagoon-400 shrink-0" />
                <span>Balance payable at pool check-in</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <Link
              href="/book"
              className="w-full inline-flex justify-center items-center gap-2 bg-gradient-to-r from-lagoon-400 to-lagoon-500 hover:from-lagoon-300 hover:to-lagoon-400 text-ocean-950 font-bold py-3.5 px-6 rounded-xl text-sm transition shadow-lg"
            >
              Reserve Family Slot (₹750 Advance) &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Pricing Rules Notice Box */}
      <div className="max-w-4xl mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm text-slate-700 space-y-3">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <Info className="w-5 h-5 text-ocean-600" />
          <span>Pricing Policy & Examples</span>
        </div>
        <p className="leading-relaxed">
          <strong>Family Pricing Example:</strong> If your group consists of 14 people booking for 3 hours:
          Base price is 3 hrs × ₹1,500 = ₹4,500. Two extra guests above 12 add 2 × ₹100 × 3 hrs = ₹600.
          Total booking cost is ₹5,100. You pay ₹750 online now, and the remaining balance of ₹4,350 at the pool counter.
        </p>
      </div>
    </div>
  );
}
