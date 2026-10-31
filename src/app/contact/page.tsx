"use client";

import React, { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from "lucide-react";

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Contact Us</h1>
        <p className="text-slate-600 text-sm">
          Have questions about private bookings, timing, or swimming lessons? Get in touch with our team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Information & Hours */}
        <div className="space-y-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-lg">M.A.K Indoor Pool Facility</h3>

            <div className="space-y-4 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-ocean-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">Address</strong>
                  <span>Kalathingalpara, Kunnathparambi, Moonniyur, Malappuram district, Kerala — 676311</span>
                  <a
                    href="https://maps.google.com/?q=M.A.K+Indoor+pool+Moonniyur"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-cyan-700 hover:underline mt-1 font-medium"
                  >
                    View on Google Maps &rarr;
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-ocean-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">Direct Calls & WhatsApp</strong>
                  <a href="tel:+919947714716" className="text-slate-800 hover:text-cyan-700 font-mono">
                    +91 99477 14716
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-ocean-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">Email Inquiries</strong>
                  <span>info@makindoorpool.com</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-ocean-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">Operating Schedule</strong>
                  <span>Open Daily 9:00 AM – 11:00 PM (Monday through Sunday)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h3 className="font-bold text-slate-900 text-lg mb-4">Send Us a Message</h3>

          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-emerald-900">Message Received!</h4>
              <p className="text-xs text-emerald-700">
                Thank you, {name}. Our duty staff will contact you shortly on {phone}.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message / Question *</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-ocean-600 hover:bg-ocean-700 text-white font-bold py-3 rounded-xl text-sm transition shadow flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Submit Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

