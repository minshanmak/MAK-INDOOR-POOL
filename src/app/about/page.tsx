import React from "react";
import { Waves, Award, ShieldCheck, Heart, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-lagoon-50 text-lagoon-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <Award className="w-4 h-4" />
          About M.A.K Indoor Pool
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Our Mission & Standards</h1>
        <p className="text-slate-600 text-base max-w-2xl mx-auto">
          Founded to bring modern, hygienic, and privacy-conscious indoor swimming to families and fitness enthusiasts in Kerala.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
          <h2 className="text-2xl font-bold text-slate-900">Why M.A.K Indoor Pool?</h2>
          <p>
            Traditional outdoor pools in Kerala often suffer from harsh weather, monsoon debris, and a total lack of privacy for families. M.A.K Indoor Pool was built specifically to solve these challenges with an enclosed, climate-managed facility.
          </p>
          <p>
            Whether you want a casual morning swim for fitness, or want to book the entire facility exclusively for your family in the evening without outside interruptions, M.A.K provides a welcoming and safe environment.
          </p>
        </div>

        <div className="bg-ocean-950 text-white p-8 rounded-3xl border border-ocean-800 space-y-6">
          <h3 className="font-bold text-lg text-lagoon-400">Our Core Principles</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-lagoon-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white">Twice-Daily Water Audits</strong>
                <span className="text-ocean-200">Chlorine (1.5–3.0 ppm) and pH (7.2–7.6) are tested and logged every shift.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-lagoon-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white">Family Modesty & Privacy</strong>
                <span className="text-ocean-200">The entire center is locked exclusively for booked family slots (9 AM – 11 PM).</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Users className="w-5 h-5 text-lagoon-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white">Capacity Limits</strong>
                <span className="text-ocean-200">We never overcrowd public sessions—max 25 swimmers strictly enforced.</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

