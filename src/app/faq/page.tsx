"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  HelpCircle,
  Clock,
  Lock,
  Droplets,
  Calendar,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

interface FAQItem {
  id: string;
  category: "BOOKINGS" | "PRIVACY" | "HYGIENE" | "FACILITIES";
  question: string;
  answer: string;
}

export default function FAQPage() {
  const [openId, setOpenId] = useState<string>("diff");
  const [activeTab, setActiveTab] = useState<string>("ALL");

  const faqs: FAQItem[] = [
    {
      id: "diff",
      category: "BOOKINGS",
      question: "What is the exact difference between Public Swimming and Exclusive Family Booking?",
      answer:
        "Public swimming (9:00 AM to 4:00 PM) is shared swimming for individuals and fitness training at ₹150/person/hour, strictly capped at 25 concurrent swimmers. Exclusive family booking (4:00 PM to 11:00 PM) locks the entire facility 100% private for your family or group (₹1,500/hr up to 12 persons, +₹100/hr per guest above 12). During family slots, the entrance doors are locked to outside visitors.",
    },
    {
      id: "advance",
      category: "BOOKINGS",
      question: "How does the ₹750 family booking advance work?",
      answer:
        "When booking a family slot online, our system requires a flat advance payment of ₹750 to immediately hold and lock the slot on our calendar. The remaining balance (total calculated cost minus the ₹750 advance) is paid upon arrival at our reception counter via Cash or UPI.",
    },
    {
      id: "guest-calc",
      category: "BOOKINGS",
      question: "How is the extra guest charge calculated if our family has more than 12 people?",
      answer:
        "The base rate of ₹1,500/hour covers up to 12 people. If you bring 14 guests for a 3-hour session, there are 2 extra guests. Each extra guest is charged ₹100/hour over the entire duration: 2 extra guests × ₹100 × 3 hours = ₹600 extra. Total price = (3 × ₹1,500) + ₹600 = ₹5,100. Pay ₹750 advance now, balance ₹4,350 at the counter.",
    },
    {
      id: "privacy-lock",
      category: "PRIVACY",
      question: "Can outside people or other visitors watch our family while we swim?",
      answer:
        "No. Our indoor pool is completely enclosed with high frosted architectural glazing that prevents anyone from looking in. During family sessions (4 PM to 11 PM), the street entrance is locked, and only your party has access to the pool deck, shower rooms, and changing suites.",
    },
    {
      id: "water-testing",
      category: "HYGIENE",
      question: "How is pool hygiene maintained, and how often is the water tested?",
      answer:
        "Water is filtered continuously through commercial silica sand filters and dual inline UV sterilizers, completing a full pool turnover every 4 hours. Our duty staff logs chlorine levels (maintained between 1.5 and 3.0 ppm) and pH (7.2 to 7.6) twice daily before opening and before the evening shift. You can review the daily water quality status right on our front desk board.",
    },
    {
      id: "swimwear",
      category: "FACILITIES",
      question: "What swimwear is mandatory, and do you provide costumes for rent?",
      answer:
        "Proper synthetic swimwear (nylon, polyester, or spandex swimsuits, trunks, rash guards, and modest burkinis) is mandatory for water hygiene. Cotton garments, jeans, and sarees are strictly prohibited in the pool basin. Sanitized rental costumes and swimming caps are available at the front desk for a nominal fee.",
    },
    {
      id: "kids-depth",
      category: "FACILITIES",
      question: "Is the pool safe for children, toddlers, and non-swimmers?",
      answer:
        "Yes! The pool features a graduated floor starting at a shallow 2.5 ft entry zone with broad steps where toddlers can sit and non-swimmers can stand with complete confidence. It slopes gently to 5.0 ft at the deep end. Certified flotation vests and kickboards are provided complimentary on deck.",
    },
    {
      id: "reschedule-rule",
      category: "BOOKINGS",
      question: "Can I reschedule my booking if our family plans change?",
      answer:
        "Yes. You can reschedule your booking online without any penalty up to 6 hours before your confirmed start time through our Self-Service Booking Portal. You may choose any other available slot on the calendar.",
    },
    {
      id: "cancellation-rule",
      category: "BOOKINGS",
      question: "What is the cancellation and refund policy?",
      answer:
        "Cancellation requests must be submitted at least 12 hours prior to the slot start time. By policy, refund approvals are processed exclusively by the Pool Owner. Once approved, the advance is refunded to your original payment method within 3 to 5 banking days. Cancellations within 12 hours forfeit the deposit.",
    },
  ];

  const categories = [
    { key: "ALL", label: "All Questions" },
    { key: "BOOKINGS", label: "Bookings & Payments" },
    { key: "PRIVACY", label: "Family Privacy" },
    { key: "HYGIENE", label: "Water Quality & Safety" },
    { key: "FACILITIES", label: "Facility & Attire" },
  ];

  const filteredFaqs =
    activeTab === "ALL" ? faqs : faqs.filter((f) => f.category === activeTab);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      {/* Editorial Header */}
      <div className="border-b border-slate-200 pb-6 max-w-3xl">
        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-xs font-semibold mb-2">
          <span>Knowledge Base</span>
          <span className="text-slate-400">•</span>
          <span>Frequently Answered Inquiries</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Clear answers regarding session pricing, family privacy protocols, water hygiene audits, and cancellation procedures.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveTab(cat.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === cat.key
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className={`bg-white border rounded-lg transition overflow-hidden ${
                isOpen ? "border-cyan-600 shadow-xs" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? "" : faq.id)}
                className="w-full text-left p-4 sm:p-5 font-bold text-xs sm:text-sm text-slate-900 flex justify-between items-center gap-4"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isOpen ? "bg-cyan-600" : "bg-slate-300"
                    }`}
                  />
                  <span>{faq.question}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
                    isOpen ? "rotate-180 text-cyan-700" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Direct Contact Help Box */}
      <div className="bg-[#0B192C] text-white rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-1.5 max-w-xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">
            STILL HAVE QUESTIONS?
          </span>
          <h3 className="text-base font-bold text-white">
            Speak directly with our duty supervisor in Aluva
          </h3>
          <p className="text-xs text-slate-300">
            Our front desk is open daily from 9:00 AM to 11:00 PM for phone calls and WhatsApp messages.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/contact"
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg text-xs border border-slate-700 transition"
          >
            Contact Desk
          </Link>
          <Link
            href="/book"
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition"
          >
            Book Online &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
