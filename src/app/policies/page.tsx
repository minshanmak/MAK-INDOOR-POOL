"use client";

import React from "react";
import Link from "next/link";
import {
  RefreshCw,
  XCircle,
  LifeBuoy,
  CheckCircle2,
  ArrowRight,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

export default function PoliciesPage() {
  return (
    <div className="bg-[#F0F5FA] text-slate-800 space-y-12 sm:space-y-16 pb-20">
      {/* 1. HERO HEADER BANNER (Consistent with Mockup) */}
      <section className="relative min-h-[280px] sm:min-h-[340px] flex items-center overflow-hidden bg-[#061426]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=2000&q=85')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#061426]/95 via-[#0A2647]/80 to-[#0A2647]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061426]/60 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 z-10 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="max-w-xl space-y-3 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-cyan-200">
              <span>M.A.K Indoor Pool</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Safety &amp; Policies
            </h1>
            <p className="text-xs sm:text-sm text-cyan-100 font-normal leading-relaxed max-w-lg">
              Clear rules regarding reservations, rescheduling, hygiene, and guest safety to ensure a smooth, enjoyable visit.
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-3xl p-4 text-white text-xs space-y-1.5 shadow-xl shrink-0">
            <div className="flex items-center gap-2 font-bold text-xs text-white">
              <ShieldCheck className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>Strictly Enforced Guidelines</span>
            </div>
            <div className="text-[11px] text-cyan-100">
              • Dedicated to your health and family privacy
            </div>
          </div>
        </div>
      </section>

      {/* 2. 3 POLICY CARDS (Clean Rounded Cards - Exact Match) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20 space-y-6">
        {/* Card 1: Booking & Rescheduling Policy */}
        <div className="bg-[#F0F8FF] border border-sky-100 rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E0F2FE] text-[#1D68BD] flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Rescheduling &amp; Booking Policy
              </h2>
              <span className="text-xs text-slate-500 font-medium">Advance reservations and slot adjustments</span>
            </div>
          </div>

          <div className="text-xs text-slate-700 space-y-2.5 leading-relaxed pt-2 border-t border-sky-100">
            <p>
              <strong className="text-slate-900 font-bold">Advance Window:</strong> Bookings can be made online up to 30 days in advance via our website. Instant confirmation receipt is generated upon payment.
            </p>
            <p>
              <strong className="text-slate-900 font-bold">Rescheduling Cutoff:</strong> Customers may reschedule their booking online free of charge up to <strong className="text-[#1D68BD]">6 hours before</strong> the confirmed start time, subject to slot availability on the target date.
            </p>
            <p>
              <strong className="text-slate-900 font-bold">Price Adjustments:</strong> If rescheduling involves a change in session duration or guest count, the price is automatically recalculated and any difference can be settled at check-in.
            </p>
          </div>
        </div>

        {/* Card 2: Cancellation & Refund Policy */}
        <div className="bg-[#FEF2F2] border border-rose-100 rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Cancellation &amp; Refund Policy
              </h2>
              <span className="text-xs text-slate-500 font-medium">Refund criteria and deposit safety</span>
            </div>
          </div>

          <div className="text-xs text-slate-700 space-y-2.5 leading-relaxed pt-2 border-t border-rose-100">
            <p>
              <strong className="text-slate-900 font-bold">Cancellation Cutoff:</strong> Cancellation requests must be submitted online or via customer care at least <strong className="text-[#DC2626]">12 hours prior</strong> to the scheduled booking start time.
            </p>
            <p>
              <strong className="text-slate-900 font-bold">Owner Approval Protocol:</strong> All cancellation requests and refund approvals are authorized directly by the Pool Owner to protect against fraudulent claims.
            </p>
            <p>
              <strong className="text-slate-900 font-bold">Refund Processing:</strong> Approved refunds are credited directly back to the original UPI ID or payment method within 3–5 banking business days.
            </p>
            <p>
              <strong className="text-slate-900 font-bold">No-Show Rule:</strong> No-shows or cancellations within 12 hours of session start time will forfeit the slot advance deposit.
            </p>
          </div>
        </div>

        {/* Card 3: Pool Hygiene & Safety Regulations */}
        <div className="bg-[#F0FDF8] border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#DCFCE7] text-[#059669] flex items-center justify-center shrink-0">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Pool Hygiene &amp; Safety Regulations
              </h2>
              <span className="text-xs text-slate-500 font-medium">Keeping water clean and swimmers safe</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-100 text-xs text-slate-700">
            <div className="flex items-start gap-2 bg-white/70 p-3 rounded-2xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong className="text-slate-900">Mandatory Shower:</strong> All swimmers must take a soap shower at our changing stalls before stepping into the pool.</span>
            </div>

            <div className="flex items-start gap-2 bg-white/70 p-3 rounded-2xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong className="text-slate-900">Proper Swimwear:</strong> Synthetic swimsuits, nylon trunks, or burkinis are required. Cotton clothes, jeans, and sarees are strictly prohibited.</span>
            </div>

            <div className="flex items-start gap-2 bg-white/70 p-3 rounded-2xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong className="text-slate-900">No Food in Basin:</strong> Food and glass bottles are prohibited in the water. Refreshments may be enjoyed in the lounge.</span>
            </div>

            <div className="flex items-start gap-2 bg-white/70 p-3 rounded-2xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong className="text-slate-900">Child Safety:</strong> Children under 12 must be supervised by an adult at all times. Free life jackets are provided.</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. "READY TO SWIM?" CTA BANNER (Exact Match) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#0077B6] via-[#0096C7] to-[#00B4D8] rounded-3xl p-6 sm:p-9 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Ready to Swim?
            </h2>
            <p className="text-cyan-100 text-xs sm:text-sm mt-1 max-w-xl font-normal leading-relaxed">
              Book your slot now and experience a clean, modern and family-friendly indoor pool.
            </p>
          </div>

          <Link
            href="/book"
            className="bg-white hover:bg-slate-100 active:scale-95 text-slate-900 font-black px-7 py-3 rounded-full text-xs sm:text-sm shadow-lg transition inline-flex items-center gap-2 shrink-0"
          >
            <span>Book Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
