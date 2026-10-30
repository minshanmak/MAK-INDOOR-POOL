import React from "react";
import Link from "next/link";
import {
  Waves,
  ShieldCheck,
  CheckCircle2,
  Droplets,
  Lock,
  ArrowRight,
  Clock,
  Award,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      {/* Editorial Header */}
      <div className="border-b border-slate-200 pb-6 max-w-3xl">
        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-xs font-semibold mb-2">
          <span>Facility Profile</span>
          <span className="text-slate-400">•</span>
          <span>Moonniyur, Malappuram</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Purpose-Built for Hygiene, Comfort &amp; Complete Family Privacy
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Founded in Kalathingalpara, Moonniyur to provide families and fitness swimmers across Malappuram with a clean, fully enclosed, temperature-controlled indoor swimming environment free from monsoon weather and outdoor contamination.
        </p>
      </div>

      {/* Narrative Section: The Origin & Purpose */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-7 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Why We Built M.A.K Indoor Pool
          </h2>
          <p>
            Traditional outdoor pools in central Kerala face recurring challenges: harsh tropical sunlight, heavy monsoon downpours, leaves and debris falling into the water, and a general lack of privacy for families and modest swimmers.
          </p>
          <p>
            M.A.K Indoor Pool was constructed with a single operational objective: to deliver a hospital-grade, weather-independent swimming sanctuary where water quality is scientifically controlled and privacy is guaranteed.
          </p>
          <p>
            Our facility operates on a split schedule: morning and midday hours are dedicated to structured public swimming with a strict capacity ceiling of 25 swimmers, while evenings from 4:00 PM to 11:00 PM are reserved exclusively for private family bookings.
          </p>

          <div className="pt-2">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-700 hover:text-cyan-800"
            >
              <span>Review our operating schedule & rates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Operational Fast Facts Box */}
        <div className="md:col-span-5 bg-[#0B192C] text-white p-6 rounded-xl border border-slate-800 space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
            FACILITY AT A GLANCE
          </span>

          <div className="space-y-3 text-xs divide-y divide-slate-800">
            <div className="pt-2 first:pt-0">
              <span className="text-slate-400 block text-[11px]">Physical Location</span>
              <span className="font-semibold text-white">Kalathingalpara, Moonniyur, Malappuram – 676311</span>
            </div>
            <div className="pt-2">
              <span className="text-slate-400 block text-[11px]">Pool Dimensions</span>
              <span className="font-semibold text-white">25 meters × 10 meters (3 swim lanes)</span>
            </div>
            <div className="pt-2">
              <span className="text-slate-400 block text-[11px]">Graduated Depth</span>
              <span className="font-semibold text-white">2.5 ft shallow bay → 5.0 ft deep end</span>
            </div>
            <div className="pt-2">
              <span className="text-slate-400 block text-[11px]">Filtration Plant</span>
              <span className="font-semibold text-white">Dual #20 silica sand + 55W inline UV</span>
            </div>
            <div className="pt-2">
              <span className="text-slate-400 block text-[11px]">Daily Operating Schedule</span>
              <span className="font-semibold text-white">9:00 AM – 11:00 PM (Monday through Sunday)</span>
            </div>
          </div>
        </div>
      </div>

      {/* The 3 Non-Negotiable Operational Pillars */}
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-3">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Our Three Operational Standards
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            The rules and protocols enforced every single day by our management and duty staff
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="bg-white border border-slate-200 p-6 rounded-lg space-y-3 shadow-xs">
            <div className="w-9 h-9 rounded bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
              <Droplets className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              Twice-Daily Chemical Auditing
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We test free chlorine (1.5–3.0 ppm), pH (7.2–7.6), and water clarity using digital photometers before morning opening (8:30 AM) and before evening shift (3:30 PM). If readings fall outside tolerance, swimming is suspended until re-balanced.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white border border-slate-200 p-6 rounded-lg space-y-3 shadow-xs">
            <div className="w-9 h-9 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              Strict Evening Family Exclusivity
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When an exclusive family booking starts at 4:00 PM, entry doors are locked to all outside visitors. No walk-ins, spectators, or strangers are permitted. The entire 25m basin, changing rooms, and shower suites belong solely to your party.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white border border-slate-200 p-6 rounded-lg space-y-3 shadow-xs">
            <div className="w-9 h-9 rounded bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              Enforced 25-Swimmer Ceiling
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              During daytime public swimming (9 AM to 4 PM), we never overcrowd the pool basin. Our operational counter strictly caps concurrent swimmers to 25 people to ensure ample space, water hygiene, and immediate lifeguard visibility.
            </p>
          </div>
        </div>
      </div>

      {/* Safety & Compliance Checklist */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider text-xs">
          Safety Protocols & On-Deck Lifeguard Standards
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Continuous duty staff on deck with CPR and water-safety training</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Dedicated shallow 2.5 ft entry zone safe for non-swimmers and toddlers</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Sanitized buoyancy vests, kickboards, and flotation aids free of charge</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Mandatory pre-swim showers and synthetic swimwear regulation</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
        <span className="text-slate-600">
          Ready to experience Kerala’s premier indoor swimming facility?
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/policies"
            className="text-slate-700 hover:text-slate-900 font-semibold"
          >
            Review Pool Regulations
          </Link>
          <Link
            href="/book"
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2 rounded-lg transition"
          >
            Reserve Your Session &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
