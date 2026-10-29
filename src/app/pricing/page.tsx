"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Info, Users, Lock, ArrowRight, Calculator } from "lucide-react";

export default function PricingPage() {
  // Interactive test pricing calculator
  const [calcGuests, setCalcGuests] = useState(14);
  const [calcHours, setCalcHours] = useState(3);

  const basePrice = calcHours * 1500;
  const extraGuests = Math.max(0, calcGuests - 12);
  const extraPrice = extraGuests * 100 * calcHours;
  const totalPrice = basePrice + extraPrice;
  const advanceRequired = 750;
  const balanceAtCounter = Math.max(0, totalPrice - advanceRequired);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Editorial Header */}
      <div className="border-b border-slate-200 pb-6 max-w-3xl">
        <span className="text-xs uppercase font-bold text-cyan-700 tracking-wider">
          Official Rates & Billing Rules
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
          Transparent Pool Session Pricing
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          No hidden fees, surcharges, or membership requirements. Choose between affordable daily public swimming or 100% exclusive private family pool sessions.
        </p>
      </div>

      {/* Side-by-Side Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Public Swimming Card */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
                Daytime Public Swimming
              </span>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                SHARED POOL
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-slate-900">₹150</span>
                <span className="text-slate-500 text-xs font-semibold">/ person / hour</span>
              </div>
              <span className="text-xs text-slate-500 mt-1 block">9:00 AM – 4:00 PM Daily</span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700 pt-4 border-t border-slate-100">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Access to the full 25m indoor pool basin</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Strict 25-swimmer concurrent capacity cap</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Sanitized showers, changing rooms, and lockers</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Full online payment or walk-in cash/UPI accepted</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Link
              href="/book"
              className="w-full inline-flex justify-center items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition"
            >
              Book Public Slot &rarr;
            </Link>
          </div>
        </div>

        {/* Exclusive Family Booking Card */}
        <div className="bg-[#0B192C] text-white rounded-xl p-8 border border-slate-800 shadow-lg flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase font-bold tracking-wider text-cyan-400">
                Exclusive Family Booking
              </span>
              <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded">
                100% PRIVATE
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-white">₹1,500</span>
                <span className="text-slate-400 text-xs font-semibold">/ hour (up to 12 people)</span>
              </div>
              <span className="text-xs text-cyan-400 mt-1 block">4:00 PM – 11:00 PM Daily</span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Facility locked 100% exclusively for your family</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Base price includes up to 12 persons</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Each additional guest above 12 adds only ₹100/hour</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Flat ₹750 online advance required to hold slot</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Remaining balance settled upon arrival at the counter</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <Link
              href="/book"
              className="w-full inline-flex justify-center items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-xs transition"
            >
              Book Family Slot (₹750 Advance) &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive Family Price Calculator */}
      <div className="bg-slate-100 rounded-xl p-6 sm:p-8 border border-slate-200 space-y-6">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-cyan-700" />
          <h2 className="text-base font-bold text-slate-900">Interactive Family Price Calculator</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Duration: {calcHours} Hour(s)
            </label>
            <input
              type="range"
              min={1}
              max={6}
              value={calcHours}
              onChange={(e) => setCalcHours(Number(e.target.value))}
              className="w-full accent-cyan-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>1 hr</span>
              <span>2 hrs</span>
              <span>3 hrs</span>
              <span>4 hrs</span>
              <span>5 hrs</span>
              <span>6 hrs</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Total Guests: {calcGuests} Person(s)
            </label>
            <input
              type="range"
              min={1}
              max={30}
              value={calcGuests}
              onChange={(e) => setCalcGuests(Number(e.target.value))}
              className="w-full accent-cyan-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>1</span>
              <span>12 (Base)</span>
              <span>20</span>
              <span>30</span>
            </div>
          </div>
        </div>

        {/* Calculation Result Breakdown */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 text-xs space-y-2">
          <div className="flex justify-between text-slate-600">
            <span>Base Cost ({calcHours} hrs × ₹1,500):</span>
            <span className="font-semibold text-slate-900">₹{basePrice}</span>
          </div>
          {extraGuests > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Extra Guest Charge ({extraGuests} extra × ₹100 × {calcHours} hrs):</span>
              <span className="font-semibold text-slate-900">+₹{extraPrice}</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
            <span>Total Calculated Price:</span>
            <span className="text-cyan-700">₹{totalPrice}</span>
          </div>
          <div className="flex justify-between text-emerald-800 font-semibold bg-emerald-50 p-2 rounded text-[11px]">
            <span>Online Advance Due Today:</span>
            <span>₹{advanceRequired}</span>
          </div>
          <div className="flex justify-between text-slate-600 px-2 text-[11px]">
            <span>Remaining Balance Due at Counter:</span>
            <span className="font-bold">₹{balanceAtCounter}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
