"use client";

import React from "react";
import Link from "next/link";
import { Waves, MapPin, Phone, Mail, Clock, Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-ocean-950 text-ocean-200 border-t border-ocean-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-lagoon-500 flex items-center justify-center text-ocean-950">
                <Waves className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-white">M.A.K Indoor Pool</span>
            </div>
            <p className="text-sm text-ocean-300 leading-relaxed">
              Kerala's premium, temperature-controlled indoor pool. Daily public swimming and exclusive, 100% private family booking sessions.
            </p>
            <div className="flex items-center gap-2 text-xs text-lagoon-400">
              <Shield className="w-4 h-4" />
              <span>Certified Dual-Cycle Sand & UV Water Treatment</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Quick Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/book" className="hover:text-lagoon-400 transition-colors">Book Online</Link></li>
              <li><Link href="/pricing" className="hover:text-lagoon-400 transition-colors">Pricing & Packages</Link></li>
              <li><Link href="/gallery" className="hover:text-lagoon-400 transition-colors">Facility Gallery</Link></li>
              <li><Link href="/booking-status" className="hover:text-lagoon-400 transition-colors">Check Booking Status</Link></li>
              <li><Link href="/policies" className="hover:text-lagoon-400 transition-colors">Pool Rules & Policies</Link></li>
            </ul>
          </div>

          {/* Operating Schedule */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Daily Schedule</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-lagoon-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Public Swimming</strong>
                  <span className="text-ocean-300">9:00 AM – 4:00 PM (₹150/hr/person)</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-lagoon-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Exclusive Family Booking</strong>
                  <span className="text-ocean-300">4:00 PM – 11:00 PM (₹1,500/hr, max 12)</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Contact & Location</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-lagoon-400 shrink-0 mt-0.5" />
                <span>Near Metro Junction, Aluva, Ernakulam, Kerala - 683101</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-lagoon-400 shrink-0" />
                <span>+91 94470 12345 / +91 484 2621000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-lagoon-400 shrink-0" />
                <span>bookings@makindoorpool.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-ocean-800 text-xs text-ocean-400 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} M.A.K Indoor Pool. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/policies" className="hover:text-ocean-200">Cancellation Policy</Link>
            <Link href="/policies" className="hover:text-ocean-200">Refund Policy</Link>
            <Link href="/policies" className="hover:text-ocean-200">Pool Safety Rules</Link>
            <Link href="/admin/login" className="text-lagoon-400 hover:underline">Staff Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
