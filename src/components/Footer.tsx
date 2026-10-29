"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Waves, MapPin, Phone, Mail, Clock, ShieldCheck } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  // Do not render public footer on admin pages
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="bg-[#071322] text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Brand & Facility */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-cyan-600 flex items-center justify-center text-white">
                <Waves className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-white tracking-tight">M.A.K Indoor Pool</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Kerala’s purpose-built temperature-controlled indoor swimming facility. Dual-filtration sand sanitizers, daily water testing, and 100% private family evening sessions.
            </p>
            <div className="inline-flex items-center gap-1.5 text-cyan-400 font-medium text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Certified Water Quality Standards</span>
            </div>
          </div>

          {/* Column 2: Hours & Sessions */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Operating Sessions
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li className="border-l-2 border-cyan-500 pl-2">
                <strong className="text-white block">Public Swimming</strong>
                <span>9:00 AM – 4:00 PM</span>
                <span className="block text-slate-500">₹150 / hr / person (Max 25 cap)</span>
              </li>
              <li className="border-l-2 border-emerald-500 pl-2">
                <strong className="text-white block">Exclusive Family Booking</strong>
                <span>4:00 PM – 11:00 PM</span>
                <span className="block text-slate-500">₹1,500 / hr up to 12 persons (+₹100/extra)</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Navigation */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Information & Policies
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link href="/book" className="hover:text-cyan-400 transition-colors">Book Online</Link></li>
              <li><Link href="/pricing" className="hover:text-cyan-400 transition-colors">Pricing & Formulas</Link></li>
              <li><Link href="/gallery" className="hover:text-cyan-400 transition-colors">Facility Tour</Link></li>
              <li><Link href="/booking-status" className="hover:text-cyan-400 transition-colors">Lookup / Manage Booking</Link></li>
              <li><Link href="/policies" className="hover:text-cyan-400 transition-colors">Cancellation & Refund Rules</Link></li>
              <li><Link href="/policies" className="hover:text-cyan-400 transition-colors">Swimwear & Hygiene Rules</Link></li>
              <li><Link href="/faq" className="hover:text-cyan-400 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Column 4: Location & Contact */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Location & Contact
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>Near Metro Junction, Aluva, Ernakulam, Kerala – 683101</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <a href="tel:+919447012345" className="hover:text-white transition">
                  +91 94470 12345
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>bookings@makindoorpool.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Open 7 Days a Week</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} M.A.K Indoor Pool. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/policies" className="hover:text-slate-400">Policies</Link>
            <span className="text-slate-700">•</span>
            <Link href="/booking-status" className="hover:text-slate-400">Self Service</Link>
            <span className="text-slate-700">•</span>
            <Link href="/admin/login" className="text-cyan-400 hover:underline">
              Staff Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
