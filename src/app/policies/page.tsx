import React from "react";
import { ShieldAlert, RefreshCw, XCircle, LifeBuoy, CheckSquare } from "lucide-react";

export default function PoliciesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Pool Policies & Regulations</h1>
        <p className="text-slate-600 text-sm">
          Please review our operational, booking, cancellation, and safety rules to ensure a smooth and pleasant visit.
        </p>
      </div>

      <div className="space-y-8">
        {/* Booking & Rescheduling Policy */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 text-ocean-700">
            <RefreshCw className="w-6 h-6" />
            <h2 className="text-xl font-bold text-slate-900">Rescheduling & Booking Policy</h2>
          </div>
          <div className="text-sm text-slate-600 space-y-2 leading-relaxed">
            <p>
              <strong>Advance Window:</strong> Bookings can be made up to 30 days in advance via our website.
            </p>
            <p>
              <strong>Rescheduling Cutoff:</strong> Customers may reschedule their booking online free of charge up to <strong>6 hours before</strong> the confirmed start time, subject to slot availability on the new date.
            </p>
            <p>
              <strong>Price Differences:</strong> If rescheduling involves a change in duration or guest count, the price will be recalculated, and any difference can be settled at check-in.
            </p>
          </div>
        </div>

        {/* Cancellation & Refund Policy */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 text-red-600">
            <XCircle className="w-6 h-6" />
            <h2 className="text-xl font-bold text-slate-900">Cancellation & Refund Policy</h2>
          </div>
          <div className="text-sm text-slate-600 space-y-2 leading-relaxed">
            <p>
              <strong>Cancellation Cutoff:</strong> Cancellation requests must be submitted online or via WhatsApp at least <strong>12 hours prior</strong> to the scheduled booking start time.
            </p>
            <p>
              <strong>Slot Release Protocol:</strong> Submitting a cancellation request registers the request in our system but does not automatically release your slot until an authorized manager approves it.
            </p>
            <p>
              <strong>Refund Approval:</strong> All refunds are reviewed and approved exclusively by the Pool Owner. When approved, refunds are credited back to the original UPI / payment source within 3–5 banking days.
            </p>
            <p>
              <strong>No-Shows:</strong> No-shows or cancellations requested within 12 hours of the slot start time will forfeit the advance deposit (₹750).
            </p>
          </div>
        </div>

        {/* Pool Hygiene & Safety Regulations */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-600">
            <LifeBuoy className="w-6 h-6" />
            <h2 className="text-xl font-bold text-slate-900">Pool Hygiene & Safety Rules</h2>
          </div>
          <ul className="text-sm text-slate-600 space-y-3 leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Mandatory Pre-Shower:</strong> All swimmers must take a soap shower at our changing rooms before entering the pool.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Proper Swimwear:</strong> Synthetic swimsuits, nylon shorts, or burkinis are required. Cotton clothes, jeans, and sarees are strictly prohibited in the water.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>No Glassware or Food in Water:</strong> Glass bottles and food items are prohibited inside the pool basin. Snacks may be consumed in the lounge area.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Child Supervision:</strong> Children under 12 must be accompanied by an adult guardian at all times.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

