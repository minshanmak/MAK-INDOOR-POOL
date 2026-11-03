"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
} from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

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
              Contact Us
            </h1>
            <p className="text-xs sm:text-sm text-cyan-100 font-normal leading-relaxed max-w-lg">
              Have questions about private family bookings, timings, or location? We are always here to assist you.
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-3xl p-4 text-white text-xs space-y-1.5 shadow-xl shrink-0">
            <div className="flex items-center gap-2 font-bold text-xs text-white">
              <Clock className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>Desk Open Daily: 9:00 AM – 11:00 PM</span>
            </div>
            <div className="text-[11px] text-cyan-100">
              • Direct WhatsApp support available
            </div>
          </div>
        </div>
      </section>

      {/* 2. CONTACT CARDS (Clean Rounded Cards - Exact Match) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Contact Details Cards */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-6">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Facility &amp; Desk Information
              </h2>

              <div className="space-y-4 text-xs text-slate-700">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-2xl bg-sky-50 text-[#1D68BD] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-slate-900 text-sm">Pool Address</strong>
                    <span className="text-slate-500 leading-relaxed block mt-0.5">
                      Kalathingalpara, Kunnathparambi, Moonniyur, Malappuram district, Kerala — 676311
                    </span>
                    <a
                      href="https://maps.google.com/?q=M.A.K+Indoor+pool+Moonniyur"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[#1D68BD] hover:underline font-bold mt-1 text-[11px]"
                    >
                      View on Google Maps &rarr;
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 pt-2 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-slate-900 text-sm">Phone &amp; WhatsApp</strong>
                    <a href="tel:+919847123456" className="text-slate-800 hover:text-[#1D68BD] font-bold block mt-0.5 tabular-nums">
                      +91 9847 123 456
                    </a>
                    <a
                      href="https://wa.me/919947714716"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline font-bold text-[11px] block mt-0.5"
                    >
                      Chat on WhatsApp &rarr;
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 pt-2 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-slate-900 text-sm">Email Inquiries</strong>
                    <span className="text-slate-500 block mt-0.5">info@makindoorpool.com</span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 pt-2 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 text-[#D97706] flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-slate-900 text-sm">Operating Hours</strong>
                    <span className="text-slate-500 block mt-0.5">
                      Open Daily 9:00 AM – 11:00 PM (Monday through Sunday)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Send a Message Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-5">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Send Us a Message
              </h2>

              {submitted ? (
                <div className="p-8 bg-[#F0FDF8] border border-emerald-100 rounded-2xl text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h3 className="font-bold text-slate-900 text-base">Message Received!</h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Thank you, {name}. Our duty staff will contact you shortly on {phone}.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Message *</label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ask about private booking dates, party arrangements, or amenities..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-[#1D68BD] hover:bg-[#155299] active:scale-95 text-white font-extrabold px-6 py-3 rounded-full text-xs shadow-md transition inline-flex items-center gap-2"
                  >
                    <span>Send Message</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
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
              Book your slot now and enjoy a clean and premium indoor pool.
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
