"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  HelpCircle,
  ArrowRight,
  Clock,
  Phone,
  MessageCircle,
} from "lucide-react";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState("ALL");

  const faqs = [
    {
      category: "SESSIONS",
      q: "What is the difference between Public Swimming and Exclusive Family Booking?",
      a: "Public swimming (9:00 AM – 4:00 PM) is open to individual visitors and charges ₹150/person/hour with shared pool access (max 25 swimmers). Exclusive family booking (4:00 PM – 11:00 PM) reserves the entire pool 100% exclusively for your group (₹1,500/hr up to 12 persons, +₹100/hr for extra guests). No strangers or outside swimmers are admitted during family slots.",
    },
    {
      category: "PRICING",
      q: "How much advance payment is required for family bookings?",
      a: "A flat advance of ₹750 is required at the time of online reservation to hold and lock your slot. The remaining balance can be paid upon arrival at the pool counter via Cash or UPI.",
    },
    {
      category: "BOOKING",
      q: "Can I reschedule my booking if my plans change?",
      a: "Yes! You can reschedule your booking online up to 6 hours before your confirmed start time without any fee, as long as another slot is available.",
    },
    {
      category: "SAFETY",
      q: "Are swimming costumes / outfits provided or required?",
      a: "Proper synthetic or nylon swimwear (swimsuits, swim trunks, rashguards, burkinis) is mandatory for water hygiene. We also have sanitized rental costumes and swimming caps available at the reception counter for a nominal fee.",
    },
    {
      category: "SAFETY",
      q: "Is the pool deep? Is it safe for non-swimmers and toddlers?",
      a: "The pool features a gradual slope from a shallow 2.5 ft entry zone (ideal for children and beginners) up to 5 ft in the deep section. Flotation rings and kids life jackets are provided free of charge.",
    },
    {
      category: "SAFETY",
      q: "How clean is the water?",
      a: "We maintain hospital-grade water hygiene with continuous sand filtration and UV sterilizers. Our duty staff tests and logs the pH (7.2–7.6) and chlorine levels twice daily before shifts begin.",
    },
  ];

  const filteredFaqs =
    activeCategory === "ALL"
      ? faqs
      : faqs.filter((f) => f.category === activeCategory);

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
              Frequently Asked Questions
            </h1>
            <p className="text-xs sm:text-sm text-cyan-100 font-normal leading-relaxed max-w-lg">
              Everything you need to know about visiting, payments, safety, and booking M.A.K Indoor Pool.
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-3xl p-4 text-white text-xs space-y-1.5 shadow-xl shrink-0">
            <div className="flex items-center gap-2 font-bold text-xs text-white">
              <HelpCircle className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>Need Quick Help?</span>
            </div>
            <div className="text-[11px] text-cyan-100">
              • Call desk or chat on WhatsApp anytime
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY FILTER PILLS */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
        <div className="flex flex-wrap items-center gap-2 bg-white/80 backdrop-blur-md p-2 rounded-3xl border border-white shadow-xs max-w-max mx-auto">
          {[
            { id: "ALL", label: "All Questions" },
            { id: "SESSIONS", label: "Sessions & Timing" },
            { id: "PRICING", label: "Pricing & Advance" },
            { id: "BOOKING", label: "Booking & Rescheduling" },
            { id: "SAFETY", label: "Water & Safety" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                activeCategory === cat.id
                  ? "bg-[#1D68BD] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* 3. ACCORDION FAQ ITEMS (Clean Rounded Cards) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3.5">
        {filteredFaqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="bg-white border border-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(20,60,110,0.04)] transition"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full text-left p-5 sm:p-6 font-bold text-sm text-slate-900 flex justify-between items-center gap-4 hover:text-[#1D68BD] transition-colors"
              >
                <span>{faq.q}</span>
                <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 transition-transform ${isOpen ? "rotate-180 bg-sky-50 text-[#1D68BD]" : "text-slate-400"}`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 sm:px-6 pb-6 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3.5">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}

        {/* Still have questions? Assistance Box */}
        <div className="bg-[#F0F8FF] border border-sky-100 rounded-3xl p-6 sm:p-8 text-center space-y-3 mt-6">
          <h3 className="font-black text-slate-900 text-base">Still Have Questions?</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Our team is available every day between 9:00 AM and 11:00 PM to help you with booking inquiries and custom arrangements.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="tel:+919847123456"
              className="bg-[#1D68BD] hover:bg-[#155299] text-white font-bold px-5 py-2.5 rounded-full text-xs shadow-xs transition inline-flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>+91 9847 123 456</span>
            </a>
            <a
              href="https://wa.me/919947714716"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#10B981] hover:bg-[#059669] text-white font-bold px-5 py-2.5 rounded-full text-xs shadow-xs transition inline-flex items-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Us</span>
            </a>
          </div>
        </div>
      </section>

      {/* 4. "READY TO SWIM?" CTA BANNER (Exact Match) */}
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
