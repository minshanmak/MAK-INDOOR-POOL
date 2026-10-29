import React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  RefreshCw,
  XCircle,
  LifeBuoy,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertTriangle,
  Info,
} from "lucide-react";

export default function PoliciesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      {/* Editorial Header */}
      <div className="border-b border-slate-200 pb-6 max-w-3xl">
        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-xs font-semibold mb-2">
          <span>Facility Governance</span>
          <span className="text-slate-400">•</span>
          <span>Official Operational Rules</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Pool Regulations, Cancellation & Hygiene Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          These rules ensure the safety of our swimmers, hospital-grade water cleanliness, and transparent, fair billing for both public and exclusive family sessions.
        </p>
      </div>

      <div className="space-y-8">
        {/* Policy Section 1: Rescheduling & Booking */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center gap-3 text-cyan-800 border-b border-slate-100 pb-3">
            <RefreshCw className="w-5 h-5 text-cyan-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              1. Advance Reservations & Rescheduling Policy
            </h2>
          </div>

          <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Advance Booking Window
                </span>
                <span className="font-semibold text-slate-900 text-xs mt-0.5 block">
                  Up to 30 Days in Advance
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Real-time slot lock via online system
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Online Rescheduling Cutoff
                </span>
                <span className="font-semibold text-slate-900 text-xs mt-0.5 block">
                  Strictly 6 Hours Before Slot
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Zero penalty when rescheduled online
                </span>
              </div>
            </div>

            <p>
              <strong>Rescheduling Flexibility:</strong> Customers can reschedule confirmed sessions directly via our <Link href="/booking-status" className="font-bold text-cyan-700 underline">Self-Service Booking Portal</Link> up to 6 hours before the scheduled start time. You may select any alternative open date and time slot.
            </p>
            <p>
              <strong>Rate Adjustments:</strong> If your rescheduled session involves a different duration or an altered guest count, our authoritative pricing engine recalculates the bill automatically. Any positive balance difference is paid at the reception counter upon arrival.
            </p>
          </div>
        </div>

        {/* Policy Section 2: Cancellation & Refund Governance */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center gap-3 text-rose-800 border-b border-slate-100 pb-3">
            <XCircle className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              2. Cancellation Requests & Refund Protocol
            </h2>
          </div>

          <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong>Crucial Concurrency Rule:</strong> Submitting a cancellation request does not automatically release your locked pool slot. The slot remains held until an authorized pool manager reviews and approves the cancellation in the administrative queue.
              </div>
            </div>

            <div className="space-y-2">
              <p>
                <strong>Cancellation Window:</strong> Cancellation requests must be submitted online or directly to our desk at least <strong>12 hours before</strong> your booking start time.
              </p>
              <p>
                <strong>Owner-Only Refund Authority:</strong> By management policy, duty staff members are strictly prohibited from approving refunds. All refund calculations and approvals are conducted solely by the Pool Owner.
              </p>
              <p>
                <strong>Processing Timeline:</strong> Once approved by the Owner, funds are refunded to the original payment source (UPI / Card / Netbanking) within <strong>3 to 5 banking days</strong>.
              </p>
              <p>
                <strong>No-Shows & Late Cancellations:</strong> Cancellations submitted less than 12 hours before the session, or failure to arrive for a confirmed slot, forfeit the ₹750 advance deposit to cover the cost of the reserved private facility.
              </p>
            </div>
          </div>
        </div>

        {/* Policy Section 3: Hygiene & Water Safety Regulations */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center gap-3 text-emerald-800 border-b border-slate-100 pb-3">
            <LifeBuoy className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              3. Hygiene, Attire & Deck Safety Regulations
            </h2>
          </div>

          <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1">
                <strong className="text-slate-900 block text-xs">Mandatory Soap Pre-Shower</strong>
                <p className="text-[11px] text-slate-600">
                  Every swimmer must shower thoroughly with soap in our private shower suites before stepping into the pool. This preserves water purity and minimizes chloramine formation.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1">
                <strong className="text-slate-900 block text-xs">Synthetic Swimwear Mandatory</strong>
                <p className="text-[11px] text-slate-600">
                  Only nylon, spandex, or polyester swimsuits, swim trunks, and burkinis are permitted. Cotton clothes, denims, and sarees shed fibers that clog filtration pumps and are strictly banned.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1">
                <strong className="text-slate-900 block text-xs">No Glassware or Food in Water</strong>
                <p className="text-[11px] text-slate-600">
                  Glass containers and food items are prohibited on the pool wet-deck. Snacks and refreshments may be consumed only in the designated dry deck lounge.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1">
                <strong className="text-slate-900 block text-xs">Child Supervision Standards</strong>
                <p className="text-[11px] text-slate-600">
                  Children under 12 years must be supervised by an adult at all times. Non-toilet-trained toddlers must wear certified swim diapers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-slate-900 text-white rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
        <div>
          <span className="font-bold text-sm block">Have questions regarding a specific situation?</span>
          <span className="text-slate-400">Our duty staff is available daily to assist with booking questions.</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/contact"
            className="text-slate-300 hover:text-white font-semibold"
          >
            Contact Desk
          </Link>
          <Link
            href="/book"
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-lg transition"
          >
            Proceed to Booking &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
