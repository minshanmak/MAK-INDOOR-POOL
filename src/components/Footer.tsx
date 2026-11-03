"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Phone,
  MapPin,
  MessageCircle,
  Instagram,
  Youtube,
  Facebook,
} from "lucide-react";
import MakLogo from "@/components/MakLogo";

export default function Footer() {
  const pathname = usePathname();

  // Do not render public footer on admin management pages
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="bg-gradient-to-b from-[#0284C7] to-[#0369A1] text-sky-100 border-t border-sky-400/30 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Column 1: Brand Info */}
          <div className="space-y-3 lg:col-span-1">
            <Link href="/" aria-label="M.A.K Indoor Pool">
              <MakLogo size="md" light={true} />
            </Link>
            <p className="text-sky-100/80 text-xs leading-relaxed max-w-xs pt-1">
              A clean, safe and family-friendly indoor pool experience.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-tight">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/book" className="hover:text-white transition-colors">
                  Book Now
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-white transition-colors">
                  Gallery
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Information */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-tight">Information</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/policies" className="hover:text-white transition-colors">
                  Policies
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Us */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-tight">Contact Us</h4>
            <ul className="space-y-2.5 text-xs text-sky-100">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
                <a href="tel:+919847123456" className="hover:text-white transition-colors tabular-nums">
                  +91 9847 123 456
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
                <span>Calicut, Kerala</span>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <a
                  href="https://wa.me/919947714716"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          {/* Column 5: Follow Us */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-tight">Follow Us</h4>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition active:scale-95"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition active:scale-95"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition active:scale-95"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & MishGa Attribution */}
        <div className="mt-12 pt-6 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-sky-200/90 text-center sm:text-left">
          <p>© 2026 M.A.K Indoor Pool. All rights reserved.</p>
          <p>
            Developed by{" "}
            <a
              href="https://mishga.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline font-black transition-colors"
            >
              MishGa
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
