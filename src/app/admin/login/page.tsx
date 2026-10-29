"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Waves, Lock, Phone, AlertCircle, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed.");
      }
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (phone: string, pass: string) => {
    setIdentifier(phone);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-lagoon-500 selection:text-ocean-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-lagoon-500 to-ocean-500 flex items-center justify-center mx-auto shadow-xl shadow-ocean-950/60 mb-4">
          <Waves className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Staff & Management Portal</h2>
        <p className="mt-1 text-xs text-ocean-300">
          M.A.K Indoor Pool Operational Access Control
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="+919999900002 or owner@makpool.com"
                  className="w-full px-3 py-2.5 pl-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 text-slate-900"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2.5 pl-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 text-slate-900"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-ocean-600 to-lagoon-600 hover:from-ocean-500 hover:to-lagoon-500 text-white font-bold py-2.5 rounded-lg text-sm shadow transition"
            >
              {loading ? "Authenticating..." : "Sign In to Management"}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block text-center">
              Demonstration Accounts
            </span>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => fillDemoAccount("+919999900002", "Password@123")}
                className="p-2 border border-ocean-200 bg-ocean-50/50 hover:bg-ocean-100 text-ocean-950 font-bold rounded-lg text-center"
              >
                Pool Owner
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount("+919999900003", "Password@123")}
                className="p-2 border border-lagoon-200 bg-lagoon-50/50 hover:bg-lagoon-100 text-lagoon-950 font-bold rounded-lg text-center"
              >
                Duty Staff
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount("+919999900001", "Password@123")}
                className="p-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold rounded-lg text-center"
              >
                Super Admin
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-1">
              (All demo credentials pre-seeded with password: <code>Password@123</code>)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
