"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Waves, Users, Calculator, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* 1. Hero Header with Pool Photography & Dark Teal Overlay Matching Reference */}
      <section className="relative py-16 sm:py-20 bg-[#07172C] overflow-hidden text-center text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07172C]/85 via-[#07172C]/70 to-[#07172C]" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3 z-10">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Our Pricing
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 font-medium">
            Simple and transparent pricing for a great swimming experience.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 space-y-12">
        {/* 2. Side-by-Side Pricing Cards Matching Reference Image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Public Swimming */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-8 text-center flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Teal Swimmer Icon */}
              <div className="w-14 h-14 mx-auto rounded-full bg-cyan-50 text-[#00838F] flex items-center justify-center">
                <Waves className="w-7 h-7 stroke-[2.2]" />
              </div>

              <h2 className="text-xl font-bold text-[#0A192F]">Public Swimming</h2>

              <div>
                <div className="text-4xl font-black text-[#0A192F] font-mono">₹150</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  per person per hour
                </div>
              </div>

              {/* Checklist */}
              <ul className="space-y-2.5 text-xs text-slate-600 text-left pt-4 border-t border-slate-100 max-w-xs mx-auto">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#00838F] shrink-0" />
                  <span>Open swimming sessions</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#00838F] shrink-0" />
                  <span>Suitable for individuals and families</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#00838F] shrink-0" />
                  <span>Clean and safe environment</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#00838F] shrink-0" />
                  <span>Supervised by staff</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link
                href="/book?type=PUBLIC"
                className="w-full bg-[#00838F] hover:bg-[#007079] text-white font-bold py-3 rounded-lg text-xs shadow-xs transition duration-150 inline-block text-center"
              >
                Book Public Swimming
              </Link>
            </div>
          </div>

          {/* Card 2: Family Exclusive Booking */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-8 text-center flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Teal Family Icon */}
              <div className="w-14 h-14 mx-auto rounded-full bg-cyan-50 text-[#00838F] flex items-center justify-center">
                <Users className="w-7 h-7 stroke-[2.2]" />
              </div>

              <h2 className="text-xl font-bold text-[#0A192F]">Family Exclusive Booking</h2>

              <div>
                <div className="text-4xl font-black text-[#0A192F] font-mono">₹1,500</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  per hour (up to 12 people)
                </div>
              </div>

              {/* Checklist */}
              <ul className="space-y-2.5 text-xs text-slate-600 text-left pt-4 border-t border-slate-100 max-w-xs mx-auto">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#00838F] shrink-0" />
                  <span>Private pool time for your family</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#00838F] shrink-0" />
                  <span>Up to 12 people included</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#00838F] shrink-0" />
                  <span>Additional guests: ₹100 per person per hour</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#00838F] shrink-0" />
                  <span>Advance payment of ₹750 required</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#00838F] shrink-0" />
                  <span>Remaining amount to be paid on arrival</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link
                href="/book?type=FAMILY"
                className="w-full bg-[#00838F] hover:bg-[#007079] text-white font-bold py-3 rounded-lg text-xs shadow-xs transition duration-150 inline-block text-center"
              >
                Book Family Slot
              </Link>
            </div>
          </div>
        </div>

        {/* 3. Price Details Table Matching Reference Image */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-sm font-bold text-[#0A192F]">Price Details</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Service</th>
                  <th className="px-6 py-3.5 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 font-medium">Public swimming (per person per hour)</td>
                  <td className="px-6 py-4 text-right font-bold text-[#0A192F] font-mono">₹150</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 font-medium">Family exclusive booking (per hour, up to 12 people)</td>
                  <td className="px-6 py-4 text-right font-bold text-[#0A192F] font-mono">₹1,500</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 font-medium">Additional guest (above 12 people, per person per hour)</td>
                  <td className="px-6 py-4 text-right font-bold text-[#0A192F] font-mono">₹100</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 font-medium">Advance payment for family booking (per booking)</td>
                  <td className="px-6 py-4 text-right font-bold text-[#0A192F] font-mono">₹750</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Interactive Price Calculator Slider */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-2 text-[#00838F] font-bold text-xs uppercase tracking-wider">
            <Calculator className="w-4 h-4" />
            <span>Interactive Family Price Calculator</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Guest Count:</span>
                  <span className="text-[#00838F] font-mono">{calcGuests} Guests</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={calcGuests}
                  onChange={(e) => setCalcGuests(Number(e.target.value))}
                  className="w-full accent-[#00838F]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Duration:</span>
                  <span className="text-[#00838F] font-mono">{calcHours} Hour{calcHours > 1 ? "s" : ""}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={calcHours}
                  onChange={(e) => setCalcHours(Number(e.target.value))}
                  className="w-full accent-[#00838F]"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Calculated Total:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">₹{totalPrice}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Online Advance Required:</span>
                <span className="font-bold text-emerald-700 font-mono">₹{advanceRequired}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                <span>Remaining on Arrival:</span>
                <span className="font-bold text-slate-900 font-mono">₹{balanceAtCounter}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
