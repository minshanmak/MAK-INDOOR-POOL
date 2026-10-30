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
  AlertCircle,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Navigation,
} from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("FAMILY_BOOKING");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !phone.trim() || !message.trim()) {
      setError("Please fill out your name, mobile number, and your message.");
      return;
    }

    if (phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit mobile phone number.");
      return;
    }

    setSubmitted(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      {/* Editorial Page Header */}
      <div className="border-b border-slate-200 pb-6 max-w-3xl">
        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-xs font-semibold mb-2">
          <span>Customer Operations Desk</span>
          <span className="text-slate-400">•</span>
          <span>Moonniyur, Malappuram</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Contact Desk &amp; Facility Location
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Reach our duty operations desk directly for private gathering inquiries, corporate sessions, or driving directions to M.A.K Indoor Pool in Moonniyur, Malappuram.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Authentic Operational Contact Channels */}
        <div className="lg:col-span-5 space-y-6">
          {/* Primary Operations Card */}
          <div className="bg-[#0B192C] text-white rounded-xl p-6 border border-slate-800 space-y-5">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
                AUTHENTIC FACILITY LOCATION &amp; CONTACT
              </span>
              <h2 className="text-lg font-bold text-white mt-1">M.A.K Indoor Pool</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Physical Address</strong>
                  <span className="text-slate-300 leading-relaxed block">
                    Kalathingalpara, Kunnathparambi, Moonniyur, Malappuram district, Kerala – 676311
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <a
                      href="https://maps.app.goo.gl/NUGrEFSQRYGn3PNA9"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00838F] hover:bg-[#007079] text-white font-bold text-[11px] shadow-xs transition"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Open in Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-slate-800">
                <Phone className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Direct Desk &amp; WhatsApp</strong>
                  <div className="mt-1">
                    <a
                      href="tel:+919947714716"
                      className="text-cyan-300 hover:text-white font-mono font-bold text-sm"
                    >
                      +91 99477 14716
                    </a>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Available during operating hours (9:00 AM – 11:00 PM)
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-slate-800">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Email Inquiries</strong>
                  <span className="text-slate-300 font-mono">desk@makindoorpool.com</span>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-slate-800">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Operating Schedule</strong>
                  <span className="text-slate-300">Open 7 days a week: 9:00 AM – 11:00 PM</span>
                  <div className="mt-1 text-[11px] text-slate-400">
                    <span className="text-cyan-400">Public Swimming:</span> 9 AM – 4 PM •{" "}
                    <span className="text-emerald-400">Family Private:</span> 4 PM – 11 PM
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://wa.me/919947714716?text=Hello%20M.A.K%20Indoor%20Pool,%20I%20have%20an%20inquiry%20regarding%20booking%20a%20slot."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat on WhatsApp Desk</span>
              </a>
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-xs text-slate-700 space-y-2">
            <h3 className="font-bold text-slate-900">Looking to check an existing booking?</h3>
            <p className="text-slate-600 leading-relaxed">
              If you have already reserved a slot, you can review your balance, view your receipt, reschedule, or cancel anytime through our self-service portal.
            </p>
            <div className="pt-1">
              <Link
                href="/booking-status"
                className="font-bold text-[#00838F] hover:text-[#007079] flex items-center gap-1"
              >
                <span>Access Self-Service Booking Portal</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Inquiry Form */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Send an Inquiry to Duty Operations
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Have a special group requirement or question? Our staff responds within 2 business hours.
            </p>
          </div>

          {submitted ? (
            <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-lg text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-sm text-emerald-950">Inquiry Logged Successfully</h3>
              <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{name}</strong>. Our duty supervisor has received your message regarding{" "}
                {subject === "FAMILY_BOOKING"
                  ? "family bookings"
                  : subject === "PUBLIC_SWIMMING"
                  ? "public swimming"
                  : "facility details"}{" "}
                and will reach out via mobile at <strong>{phone}</strong> shortly.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setName("");
                    setPhone("");
                    setEmail("");
                    setMessage("");
                  }}
                  className="text-xs font-bold text-emerald-900 underline hover:text-emerald-700"
                >
                  Send another inquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Faisal Rahman"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-cyan-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                    Mobile Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98470 XXXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-cyan-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="faisal@example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-cyan-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                    Inquiry Category
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-cyan-500 text-slate-900 font-medium"
                  >
                    <option value="FAMILY_BOOKING">Exclusive Family Booking Inquiry</option>
                    <option value="PUBLIC_SWIMMING">Public Swimming & Timings</option>
                    <option value="SPECIAL_EVENT">Private Event / Birthday Gathering</option>
                    <option value="WATER_QUALITY">Water Quality & Hygiene Inquiries</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                  Your Message or Question *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us your preferred date, expected guest count, or any questions about the facility..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-cyan-500 text-slate-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-lg text-xs transition flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Inquiry to Duty Desk</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* 2. Interactive Google Maps Embed & Regional Transit Guide */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden space-y-6 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#00838F] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
                Official Google Maps Location
              </span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                ★ 4.9 / 5.0 Rated
              </span>
            </div>
            <h2 className="text-xl font-black text-[#0A192F] mt-1.5">
              Finding M.A.K Indoor Pool in Moonniyur
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kalathingalpara, Kunnathparambi, Moonniyur, Malappuram district, Kerala – 676311
            </p>
          </div>

          <a
            href="https://maps.app.goo.gl/NUGrEFSQRYGn3PNA9"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#00838F] hover:bg-[#007079] active:scale-[0.98] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition inline-flex items-center gap-1.5 shrink-0 shadow-xs"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Open in Google Maps App</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Embedded Google Map iframe */}
        <div className="w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative shadow-inner">
          <iframe
            title="M.A.K Indoor Pool Location Map"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src="https://maps.google.com/maps?q=11.0532468,75.8871922&z=16&output=embed"
          />
        </div>

        {/* Regional Transit & Distance Guide */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-semibold">National Highway</span>
            <span className="font-bold text-slate-900 block">NH 66 Bypass</span>
            <span className="text-[10px] text-emerald-700 font-medium block">2 Mins</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-semibold">Commercial Hub</span>
            <span className="font-bold text-slate-900 block">Chemmad Town</span>
            <span className="text-[10px] text-emerald-700 font-medium block">5 Mins (2.5 km)</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-semibold">Campus &amp; Transit</span>
            <span className="font-bold text-slate-900 block">Calicut University</span>
            <span className="text-[10px] text-emerald-700 font-medium block">12 Mins (7 km)</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-semibold">Historical Town</span>
            <span className="font-bold text-slate-900 block">Tirurangadi</span>
            <span className="text-[10px] text-emerald-700 font-medium block">10 Mins (5 km)</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-semibold">Railway Station</span>
            <span className="font-bold text-slate-900 block">Parappanangadi</span>
            <span className="text-[10px] text-emerald-700 font-medium block">15 Mins (9.5 km)</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-semibold">Airport Transit</span>
            <span className="font-bold text-slate-900 block">Calicut Airport (CCJ)</span>
            <span className="text-[10px] text-emerald-700 font-medium block">25 Mins (18 km)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
