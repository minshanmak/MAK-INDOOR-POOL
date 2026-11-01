"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "What is the difference between Public Swimming and Exclusive Family Booking?",
      a: "Public swimming (9:00 AM – 4:00 PM) is open to individual visitors and charges ₹150/person/hour with shared pool access (max 25 swimmers). Exclusive family booking (9:00 AM – 11:00 PM) reserves the entire pool 100% exclusively for your group (₹1,500/hr up to 12 persons, +₹100/hr for extra guests). No strangers or outside swimmers are admitted during family slots.",
    },
    {
      q: "How much advance payment is required for family bookings?",
      a: "A flat advance of ₹750 is required at the time of online reservation to hold and lock your slot. The remaining balance can be paid upon arrival at the pool counter via Cash or UPI.",
    },
    {
      q: "Can I reschedule my booking if my plans change?",
      a: "Yes! You can reschedule your booking online up to 6 hours before your confirmed start time without any fee, as long as another slot is available.",
    },
    {
      q: "Are swimming costumes / outfits provided or required?",
      a: "Proper synthetic or nylon swimwear (swimsuits, swim trunks, rashguards, burkinis) is mandatory for water hygiene. We also have sanitized rental costumes and swimming caps available at the reception counter for a nominal fee.",
    },
    {
      q: "Is the pool deep? Is it safe for non-swimmers and toddlers?",
      a: "The pool features a gradual slope from a shallow 2.5 ft entry zone (ideal for children and beginners) up to 5 ft in the deep section. Flotation rings and kids life jackets are provided free of charge.",
    },
    {
      q: "How clean is the water?",
      a: "We maintain hospital-grade water hygiene with continuous sand filtration and UV sterilizers. Our duty staff tests and logs the pH (7.2–7.6) and chlorine levels twice daily before shifts begin.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-ocean-50 text-ocean-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="w-4 h-4" />
          Got Questions?
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Frequently Asked Questions</h1>
        <p className="text-slate-600 text-sm">
          Everything you need to know about visiting and booking M.A.K Indoor Pool.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full text-left p-6 font-bold text-slate-900 flex justify-between items-center gap-4 hover:text-ocean-600"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen && (
                <div className="px-6 pb-6 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

