"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Waves,
  ShieldCheck,
  Calendar,
  Clock,
  Users,
  Users2,
  ArrowRight,
  Droplets,
  Layers,
  Image as ImageIcon,
  Play,
  CheckCircle2,
  Heart,
  Sparkles,
  Calculator,
  MapPin,
  Phone,
  Mail,
  Send,
  HelpCircle,
  ChevronDown,
  X,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  AlertCircle,
  RefreshCw,
  XCircle,
  LifeBuoy,
  ArrowDown,
} from "lucide-react";

export default function HomePage() {
  // Video Modal State
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  // Gallery State & Lightbox
  const [activeGalleryTab, setActiveGalleryTab] = useState("ALL");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Interactive Pricing Calculator State
  const [calcGuests, setCalcGuests] = useState(12);
  const [calcHours, setCalcHours] = useState(2);

  // FAQ State
  const [faqCategory, setFaqCategory] = useState("ALL");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    subject: "Family Booking",
    message: "",
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Gallery Photos Data
  const galleryPhotos = [
    {
      title: "Crystal Clear Main Indoor Pool",
      category: "POOL",
      categoryLabel: "Main Pool",
      desc: "Temperature-balanced indoor pool featuring 24/7 dual sand filtration and atmospheric underwater lighting.",
      src: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=85",
    },
    {
      title: "Reception & Family Waiting Lounge",
      category: "LOUNGE",
      categoryLabel: "Lounge Area",
      desc: "Spacious, air-conditioned waiting lounge for parents, families, and accompanying visitors.",
      src: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=85",
    },
    {
      title: "Sanitized Shower & Pre-Swim Stalls",
      category: "FACILITIES",
      categoryLabel: "Showers",
      desc: "Private shower stalls with warm water and mandatory hygiene rinse stations.",
      src: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=1200&q=85",
    },
    {
      title: "Secure Lockers & Changing Rooms",
      category: "FACILITIES",
      categoryLabel: "Lockers",
      desc: "Keycard digital lockers and private changing suites ensuring 100% guest privacy.",
      src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=85",
    },
    {
      title: "Evening Ambient Lighting",
      category: "POOL",
      categoryLabel: "Atmosphere",
      desc: "Warm evening illumination designed specially for exclusive family gatherings and celebrations.",
      src: "https://images.unsplash.com/photo-1565073624443-41a4a49c9535?auto=format&fit=crop&w=1200&q=85",
    },
    {
      title: "Continuous Water Sanitation Lab",
      category: "SAFETY",
      categoryLabel: "Hygiene",
      desc: "High-grade UV sterilizers and twice-daily pH (7.2–7.6) and chlorine testing logs.",
      src: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=85",
    },
  ];

  const filteredGallery =
    activeGalleryTab === "ALL"
      ? galleryPhotos
      : galleryPhotos.filter((p) => p.category === activeGalleryTab);

  // Pricing Calculations
  const basePrice = calcHours * 1500;
  const extraGuests = Math.max(0, calcGuests - 12);
  const extraPrice = extraGuests * 100 * calcHours;
  const totalPrice = basePrice + extraPrice;
  const advanceRequired = 750;
  const balanceAtCounter = Math.max(0, totalPrice - advanceRequired);

  // FAQ Data
  const faqs = [
    {
      category: "SESSIONS",
      q: "What is the difference between Public Swimming and Exclusive Family Booking?",
      a: "Public Swimming (9:00 AM – 4:00 PM) is open to individual visitors and charges ₹150/person/hour with shared pool access (max 25 swimmers). Exclusive Family Booking (4:00 PM – 11:00 PM) reserves the entire pool 100% exclusively for your group (₹1,500/hr up to 12 persons, +₹100/hr for extra guests). No strangers or outside swimmers are admitted during family slots.",
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
    faqCategory === "ALL"
      ? faqs
      : faqs.filter((f) => f.category === faqCategory);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.phone) return;
    setContactSubmitted(true);
  };

  return (
    <div className="bg-[#F0F5FA] text-slate-800 space-y-16 sm:space-y-20 pb-20 scroll-smooth">
      {/* =========================================================================
          1. HERO SECTION (#home) - Haven-Style Centered Minimalist Glass Aesthetic
         ========================================================================= */}
      <section
        id="home"
        className="scroll-mt-24 relative min-h-[660px] sm:min-h-[720px] lg:min-h-[780px] pt-28 sm:pt-36 lg:pt-40 pb-16 flex flex-col justify-between items-center overflow-hidden bg-slate-950 text-center"
      >
        {/* Background Indoor Swimming Pool Photograph - 2400x1600 Ultra HD, Edge-to-Edge Full Bleed */}
        <img
          src="/images/mak-indoor-pool.jpg?v=1"
          alt="M.A.K Indoor Pool Facility & Experience"
          className="absolute inset-0 w-full h-full object-cover object-center brightness-[1.04] contrast-[1.05] select-none pointer-events-none"
          loading="eager"
        />

        {/* Pure Neutral Scrim (Preserves real photo colors & clarity, zero blue wash) */}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/55" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 my-auto space-y-5 sm:space-y-6 w-full flex flex-col items-center">
          {/* Top Pill Badge (Operating Hours & Location - Haven "We just raised 20M" style) */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/25 backdrop-blur-xl border border-white/35 text-[11px] sm:text-xs font-semibold text-white shadow-xs transition hover:scale-105 max-w-[94vw]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="whitespace-nowrap">Open Daily: 9 AM – 11 PM</span>
            <span className="text-white/40">•</span>
            <span className="text-cyan-200 truncate">Moonniyur, Kerala</span>
          </div>

          {/* Main Headline (Haven Typography: Centered, Massive, Confident, Clean) */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.8)] max-w-3xl px-2">
            Swim in peace.
          </h1>

          {/* Subtitle (Haven Style: 2 relaxed, poetic lines) */}
          <p className="text-xs sm:text-base lg:text-lg text-white/95 font-medium leading-relaxed max-w-xl mx-auto drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)] px-3">
            A clean, private and temperature-controlled indoor pool. <br className="hidden sm:inline" />
            Designed for peaceful morning laps and exclusive evening family moments.
          </p>

          {/* Centered CTA Buttons (Thumb-friendly mobile column, desktop row) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3.5 pt-2 w-full max-w-xs sm:max-w-none">
            <Link
              href="/book"
              className="w-full sm:w-auto bg-white hover:bg-slate-100 active:scale-95 text-slate-950 font-black px-7 py-3 rounded-full text-xs sm:text-sm shadow-[0_4px_24px_rgba(255,255,255,0.35),inset_0_1px_1px_rgba(255,255,255,0.9)] transition flex items-center justify-center gap-2 group"
            >
              <span>Book Your Slot</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <button
              type="button"
              onClick={() => setIsPlayingVideo(true)}
              className="w-full sm:w-auto bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-xl border border-white/30 text-white font-bold px-6 py-3 rounded-full text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Watch Tour</span>
            </button>
          </div>

          {/* Subtle Feature Badges Row */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-6 pt-2 sm:pt-3 text-[11px] sm:text-xs font-semibold text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] px-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span>Clean &amp; Safe</span>
            </div>
            <span className="text-white/30 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span>Family Friendly</span>
            </div>
            <span className="text-white/30 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span>Well Maintained</span>
            </div>
            <span className="text-white/30 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span>Flexible Booking</span>
            </div>
          </div>
        </div>

        {/* Bottom Floating "SCROLL ↓" Pill (Exact Haven Match) */}
        <div className="relative z-10 pt-4">
          <a
            href="#about"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/25 text-[11px] font-bold text-white/90 tracking-widest uppercase shadow-xs transition hover:scale-105 active:scale-95"
          >
            <span>SCROLL</span>
            <ArrowDown className="w-3 h-3 animate-bounce" />
          </a>
        </div>
      </section>

      {/* =========================================================================
          2. 4 QUICK-ACTION CARDS (Overlapping Below Hero)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-12 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Book Your Slot */}
          <Link
            href="/book"
            className="bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.06)] hover:shadow-lg hover:-translate-y-0.5 transition-all group flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#1D68BD] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#1D68BD] transition-colors flex items-center gap-1">
                <span>Book Your Slot</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                <span>Check availability and book instantly</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
          </Link>

          {/* Card 2: Our Pricing */}
          <a
            href="#pricing"
            className="bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.06)] hover:shadow-lg hover:-translate-y-0.5 transition-all group flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition-colors flex items-center gap-1">
                <span>Our Pricing</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                <span>Simple and transparent rates</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
          </a>

          {/* Card 3: View Gallery */}
          <a
            href="#gallery"
            className="bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.06)] hover:shadow-lg hover:-translate-y-0.5 transition-all group flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-teal-600 transition-colors flex items-center gap-1">
                <span>View Gallery</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                <span>Explore our pool and facilities</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
          </a>

          {/* Card 4: Safety & Policies */}
          <a
            href="#policies"
            className="bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.06)] hover:shadow-lg hover:-translate-y-0.5 transition-all group flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                <span>Safety &amp; Policies</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                <span>Booking, cancellation and safety rules</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
          </a>
        </div>
      </section>

      {/* =========================================================================
          3. ABOUT SECTION (#about) - Exact Match to Reference Mockup
         ========================================================================= */}
      <section id="about" className="scroll-mt-24 relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Ambient Decorative Wave Gradient on Right Edge */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-gradient-to-l from-sky-200/40 via-sky-100/20 to-transparent rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Image with Play Button */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-md border border-white aspect-[16/10] group">
              <img
                src="https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80"
                alt="M.A.K Indoor Pool Facility"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/10 transition-colors" />

              {/* Circular Play Button in Center */}
              <button
                type="button"
                onClick={() => setIsPlayingVideo(true)}
                className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-white/95 hover:bg-white text-slate-900 flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95"
                aria-label="Play pool showcase video"
              >
                <Play className="w-5 h-5 fill-slate-900 translate-x-0.5" />
              </button>
            </div>
          </div>

          {/* Right Column: About Text & Highlights */}
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0284C7] block">
              About M.A.K Indoor Pool
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              A Modern Indoor Pool <br />
              for Everyone
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              M.A.K Indoor Pool offers a clean, safe and comfortable swimming environment for individuals, friends and families. Enjoy public swimming during the day or book exclusive time for your family in the evening.
            </p>

            <div className="space-y-2.5 pt-1 text-xs font-semibold text-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-sky-100 text-[#0284C7] flex items-center justify-center shrink-0 shadow-2xs">
                  <Waves className="w-3.5 h-3.5" />
                </div>
                <span>Public Swimming (9:00 AM – 4:00 PM)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-sky-100 text-[#0284C7] flex items-center justify-center shrink-0 shadow-2xs">
                  <Users2 className="w-3.5 h-3.5" />
                </div>
                <span>Exclusive Family Bookings (4:00 PM – 11:00 PM)</span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="#policies"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition active:scale-95 shadow-xs"
              >
                <span>Learn More</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* 4 Core Principles Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-900">Hospital-Grade Hygiene</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dual sand filtration running 24/7 with strict twice-daily chlorine (1.5–3.0 ppm) and pH testing.
            </p>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-900">100% Family Privacy</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              During exclusive family slots (4 PM – 11 PM), the pool is entirely locked for your group with zero outside visitors.
            </p>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-900">Strict Capacity Limits</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We cap public slots strictly to 25 swimmers to avoid overcrowding and ensure a calm experience.
            </p>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-900">All-Weather Comfort</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Fully enclosed indoor architecture prevents sunburns, tropical rain interference, and external debris.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. STATS RIBBON (Soft Light Blue Rounded Container - Exact Mockup Match)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#E4F2FE] rounded-3xl p-5 sm:p-6 border border-sky-200/50 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y sm:divide-y-0 md:divide-x divide-sky-200/60 text-xs text-slate-700">
            {/* Stat 1 */}
            <div className="flex items-center gap-3 px-2 sm:px-4 justify-center">
              <div className="w-10 h-10 rounded-2xl bg-white text-[#0284C7] flex items-center justify-center shrink-0 shadow-xs">
                <Waves className="w-5 h-5 text-[#0284C7]" />
              </div>
              <div>
                <span className="font-extrabold text-base text-slate-900 block leading-tight">2</span>
                <span className="text-slate-600 font-medium block text-[11px] leading-tight">Swimming Modes</span>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="flex items-center gap-3 px-2 sm:px-4 justify-center pt-3 sm:pt-0">
              <div className="w-10 h-10 rounded-2xl bg-white text-[#0284C7] flex items-center justify-center shrink-0 shadow-xs">
                <Calendar className="w-5 h-5 text-[#0284C7]" />
              </div>
              <div>
                <span className="font-extrabold text-base text-slate-900 block leading-tight">12+</span>
                <span className="text-slate-600 font-medium block text-[11px] leading-tight">Hours Daily</span>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="flex items-center gap-3 px-2 sm:px-4 justify-center pt-3 sm:pt-0">
              <div className="w-10 h-10 rounded-2xl bg-white text-[#0284C7] flex items-center justify-center shrink-0 shadow-xs">
                <Users2 className="w-5 h-5 text-[#0284C7]" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-slate-900 block leading-tight">Family Friendly</span>
                <span className="text-slate-600 font-medium block text-[11px] leading-tight">Exclusive Bookings</span>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="flex items-center gap-3 px-2 sm:px-4 justify-center pt-3 sm:pt-0">
              <div className="w-10 h-10 rounded-2xl bg-white text-[#0284C7] flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-[#0284C7]" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-slate-900 block leading-tight">Safe &amp; Hygienic</span>
                <span className="text-slate-600 font-medium block text-[11px] leading-tight">Clean &amp; Well Maintained</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. "OUR PRICING" SECTION (#pricing) - Exact Match to Mockup + Interactive Estimator
         ========================================================================= */}
      <section id="pricing" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Our Pricing
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            Simple and transparent pricing for all your swimming needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Pricing Card 1: Public Swimming */}
          <Link
            href="/book?type=PUBLIC"
            className="relative overflow-hidden bg-gradient-to-br from-[#EBF5FF] via-[#E1F0FE] to-[#D5EAFF] border border-sky-200 hover:border-sky-300 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-all group block space-y-4"
          >
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                <div className="w-8 h-8 rounded-xl bg-white text-[#0284C7] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Waves className="w-4 h-4" />
                </div>
                <span className="text-base font-extrabold">Public Swimming</span>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">₹150</span>
                  <span className="text-sm font-semibold text-slate-500">/ hour</span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">per person</div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 font-medium pt-2 border-t border-sky-200/60">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Pool access (9:00 AM – 4:00 PM)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Ideal for individuals and groups</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Clean and supervised environment</span>
                </div>
              </div>
            </div>

            {/* Decorative Ambient Waves */}
            <svg
              className="absolute -bottom-2 -right-2 w-72 h-36 opacity-30 pointer-events-none"
              viewBox="0 0 200 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 60 C50 35 100 80 150 45 C180 25 200 55 220 45 L220 100 L0 100 Z"
                fill="#0284C7"
              />
            </svg>
          </Link>

          {/* Pricing Card 2: Exclusive Family Booking */}
          <Link
            href="/book?type=FAMILY"
            className="relative overflow-hidden bg-gradient-to-br from-[#FAF5FF] via-[#F6EDFD] to-[#EEDEFB] border border-purple-200 hover:border-purple-300 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-all group block space-y-4"
          >
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                <div className="w-8 h-8 rounded-xl bg-white text-[#9333EA] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Users2 className="w-4 h-4" />
                </div>
                <span className="text-base font-extrabold">Exclusive Family Booking</span>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">₹1,500</span>
                  <span className="text-sm font-semibold text-slate-500">/ hour</span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">up to 12 people</div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 font-medium pt-2 border-t border-purple-200/60">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Private pool access (4:00 PM – 11:00 PM)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>₹100 per additional person / hour (above 12 people)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>₹750 advance required per booking</span>
                </div>
              </div>
            </div>

            {/* Decorative Ambient Waves */}
            <svg
              className="absolute -bottom-2 -right-2 w-72 h-36 opacity-25 pointer-events-none"
              viewBox="0 0 200 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 60 C50 35 100 80 150 45 C180 25 200 55 220 45 L220 100 L0 100 Z"
                fill="#9333EA"
              />
            </svg>
          </Link>
        </div>

        {/* Interactive Live Price Estimator */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_4px_20px_rgba(20,60,110,0.05)] mt-4 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-sky-50 text-[#0284C7] flex items-center justify-center shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Instant Family Price Estimator
                </h3>
                <p className="text-xs text-slate-500 font-normal">
                  Customize duration and party size to calculate total price &amp; advance deposit.
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
              Live Auto-Calculate
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Sliders & Controls */}
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-2">
                  <span>Number of Guests:</span>
                  <span className="text-[#0284C7] font-extrabold text-sm">
                    {calcGuests} {calcGuests === 1 ? "Person" : "People"}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  value={calcGuests}
                  onChange={(e) => setCalcGuests(parseInt(e.target.value))}
                  className="w-full accent-[#0284C7] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                  <span>1 guest</span>
                  <span>12 (Standard limit)</span>
                  <span>25 (Max capacity)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-2">
                  <span>Duration of Session:</span>
                  <span className="text-[#0284C7] font-extrabold text-sm">
                    {calcHours} {calcHours === 1 ? "Hour" : "Hours"}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setCalcHours(hrs)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        calcHours === hrs
                          ? "bg-[#0284C7] text-white border-[#0284C7] shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {hrs} hr{hrs > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Price Breakdown Summary */}
            <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-5 space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Base Rate ({calcHours} hrs × ₹1,500):</span>
                <span className="font-semibold text-slate-800">₹{basePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>
                  Extra Guests ({extraGuests} extra × ₹100/hr × {calcHours} hrs):
                </span>
                <span className="font-semibold text-slate-800">₹{extraPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-200">
                <span>Estimated Total:</span>
                <span className="text-[#0284C7] text-base">₹{totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium pt-1">
                <span>Advance Required Online:</span>
                <span className="font-bold">₹{advanceRequired}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Balance at Check-in:</span>
                <span className="font-bold text-slate-700">₹{balanceAtCounter.toLocaleString()}</span>
              </div>

              <div className="pt-2">
                <Link
                  href={`/book?type=FAMILY&guests=${calcGuests}&hours=${calcHours}`}
                  className="w-full bg-[#0284C7] hover:bg-[#0369a1] text-white py-2.5 rounded-xl font-bold text-xs text-center flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <span>Book With This Estimate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. "EXPLORE OUR POOL" SECTION (#gallery) - Interactive Showcase & Tabs
         ========================================================================= */}
      <section id="gallery" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Explore Our Pool
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
              Take a look at our indoor pool, facilities and ambiance.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-full border border-slate-200 shadow-2xs">
            {[
              { id: "ALL", label: "All Facilities" },
              { id: "POOL", label: "Main Pool" },
              { id: "LOUNGE", label: "Lounge" },
              { id: "FACILITIES", label: "Amenities" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveGalleryTab(tab.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  activeGalleryTab === tab.id
                    ? "bg-[#0284C7] text-white font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6 Photo Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGallery.map((photo, index) => (
            <div
              key={photo.title}
              onClick={() => setLightboxIndex(index)}
              className="group bg-white rounded-3xl overflow-hidden shadow-xs border border-white hover:shadow-md transition-all cursor-pointer flex flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={photo.src}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors" />
                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[11px] font-bold text-slate-800 shadow-2xs">
                  {photo.categoryLabel}
                </span>
              </div>
              <div className="p-4 space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#0284C7] transition-colors">
                  {photo.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {photo.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          7. "SAFETY & POLICIES" SECTION (#policies)
         ========================================================================= */}
      <section id="policies" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Safety &amp; Policies
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            Clear rules regarding reservations, rescheduling, hygiene, and guest safety.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Policy 1: Rescheduling */}
          <div className="bg-[#F0F8FF] border border-sky-100 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Rescheduling Policy</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Customers may reschedule their booking online free of charge up to <strong>6 hours before</strong> confirmed slot time, subject to availability.
            </p>
          </div>

          {/* Policy 2: Cancellations */}
          <div className="bg-[#FEF2F2] border border-rose-100 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Cancellation &amp; Refund</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Full advance deposit refunded for cancellations at least <strong>12 hours prior</strong> to start time. Late cancellations forfeit deposit.
            </p>
          </div>

          {/* Policy 3: Hygiene & Attire */}
          <div className="bg-[#F0FDF4] border border-emerald-100 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Hygiene &amp; Attire</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Synthetic/nylon swimwear is strictly mandatory. Cotton clothing, underwear, and oily hair products are forbidden in the pool.
            </p>
          </div>

          {/* Policy 4: Child Safety */}
          <div className="bg-[#FAF5FF] border border-purple-100 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Child Safety</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Gradual slope from 2.5 ft shallow zone up to 5 ft depth. Free flotation gear provided. Children below 12 must be supervised.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. "FREQUENTLY ASKED QUESTIONS" (#faq)
         ========================================================================= */}
      <section id="faq" className="scroll-mt-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            Everything you need to know about visiting, payments, safety, and booking.
          </p>

          {/* FAQ Category Filters */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3">
            {[
              { id: "ALL", label: "All Questions" },
              { id: "SESSIONS", label: "Sessions & Timing" },
              { id: "PRICING", label: "Pricing & Advance" },
              { id: "BOOKING", label: "Booking & Rescheduling" },
              { id: "SAFETY", label: "Safety & Hygiene" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFaqCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  faqCategory === cat.id
                    ? "bg-[#0284C7] text-white font-bold shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accordions */}
        <div className="space-y-3 pt-2">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={faq.q}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:text-[#0284C7] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#0284C7]" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          9. "CONTACT US" SECTION (#contact) - Info Cards + Message Form
         ========================================================================= */}
      <section id="contact" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Contact Us
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            Have questions about private family bookings, timings, or location? We are always here to assist you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Contact Details Cards */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-5">
              <h3 className="text-base font-extrabold text-slate-900">
                Facility &amp; Desk Information
              </h3>

              <div className="space-y-4 text-xs text-slate-700">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-2xl bg-sky-50 text-[#0284C7] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-slate-900 text-xs sm:text-sm">Pool Address</strong>
                    <span className="text-slate-500 leading-relaxed block mt-0.5">
                      Kalathingalpara, Kunnathparambi, Moonniyur, Malappuram district, Kerala — 676311
                    </span>
                    <a
                      href="https://maps.google.com/?q=M.A.K+Indoor+pool+Moonniyur"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[#0284C7] hover:underline font-bold mt-1 text-[11px]"
                    >
                      View on Google Maps &rarr;
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 pt-3 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-slate-900 text-xs sm:text-sm">Phone Support</strong>
                    <a
                      href="tel:+919847123456"
                      className="text-[#0284C7] hover:underline font-bold tabular-nums block mt-0.5"
                    >
                      +91 9847 123 456
                    </a>
                    <span className="text-slate-400 text-[11px]">Direct line for questions and instant support</span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 pt-3 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-slate-900 text-xs sm:text-sm">WhatsApp Concierge</strong>
                    <a
                      href="https://wa.me/919947714716"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-700 hover:underline font-bold block mt-0.5"
                    >
                      +91 99477 14716 (Chat Now)
                    </a>
                    <span className="text-slate-400 text-[11px]">Instant slot confirmation &amp; driving directions</span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 pt-3 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-slate-900 text-xs sm:text-sm">Desk Hours</strong>
                    <span className="text-slate-600 block mt-0.5">9:00 AM – 11:00 PM (Daily)</span>
                    <span className="text-slate-400 text-[11px]">Open 7 days a week including public holidays</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Enquiry Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)]">
              {contactSubmitted ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Message Received!</h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                    Thank you, <strong>{contactForm.name}</strong>. Our reception desk will call or WhatsApp you at <strong>{contactForm.phone}</strong> shortly.
                  </p>
                  <div className="pt-2">
                    <a
                      href="https://wa.me/919947714716"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat on WhatsApp Now</span>
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Send Us an Inquiry
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Nair"
                        value={contactForm.name}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, name: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0284C7] outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9847123456"
                        value={contactForm.phone}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, phone: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0284C7] outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Subject
                    </label>
                    <select
                      value={contactForm.subject}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, subject: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0284C7] outline-hidden bg-white"
                    >
                      <option value="Family Booking">Exclusive Family Booking Inquiry</option>
                      <option value="Public Swimming">Public Swimming Question</option>
                      <option value="Group Celebration">Special Group / Birthday Event</option>
                      <option value="Other">Other Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Message / Special Requests
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Let us know your preferred date, approximate number of people, or any questions..."
                      value={contactForm.message}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, message: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0284C7] outline-hidden resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#0284C7] hover:bg-[#0369a1] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Inquiry</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          10. "READY TO SWIM?" CTA BANNER (Exact Match)
         ========================================================================= */}
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

      {/* =========================================================================
          LIGHTBOX MODAL FOR GALLERY
         ========================================================================= */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition"
            aria-label="Close photo preview"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Previous */}
          <button
            type="button"
            onClick={() =>
              setLightboxIndex(
                (lightboxIndex - 1 + filteredGallery.length) %
                  filteredGallery.length
              )
            }
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center">
            <img
              src={filteredGallery[lightboxIndex].src}
              alt={filteredGallery[lightboxIndex].title}
              className="max-h-[70vh] w-auto rounded-2xl object-contain shadow-2xl"
            />
            <div className="text-center text-white mt-4 space-y-1">
              <h3 className="font-bold text-base sm:text-lg">
                {filteredGallery[lightboxIndex].title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
                {filteredGallery[lightboxIndex].desc}
              </p>
            </div>
          </div>

          {/* Navigation Next */}
          <button
            type="button"
            onClick={() =>
              setLightboxIndex((lightboxIndex + 1) % filteredGallery.length)
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition"
            aria-label="Next photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* =========================================================================
          VIDEO SHOWCASE MODAL
         ========================================================================= */}
      {isPlayingVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative bg-slate-900 border border-white/20 rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl">
            <button
              type="button"
              onClick={() => setIsPlayingVideo(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
              aria-label="Close video player"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 text-white text-center space-y-3">
              <h3 className="text-lg font-bold">M.A.K Indoor Pool Facility Tour</h3>
              <p className="text-xs text-slate-300">
                Experience our pristine indoor pool, changing suites, and family environment.
              </p>
              <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-black flex items-center justify-center relative">
                <img
                  src="https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80"
                  alt="Video thumbnail"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-[#0284C7] text-white flex items-center justify-center shadow-lg animate-pulse">
                    <Play className="w-6 h-6 fill-white translate-x-0.5" />
                  </div>
                  <span className="text-xs font-semibold text-white bg-black/50 px-3 py-1 rounded-full">
                    Facility Walkthrough Preview
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
