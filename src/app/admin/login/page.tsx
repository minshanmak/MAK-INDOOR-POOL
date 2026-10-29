"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Waves, Lock, Phone, AlertCircle, ShieldCheck, ArrowRight, User } from "lucide-react";

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
        throw new Error(data.error || "Login failed. Check your mobile/email and password.");
      }
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#071322] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="w-11 h-11 rounded-lg bg-cyan-600 flex items-center justify-center mx-auto text-white shadow-sm">
          <Waves className="w-5 h-5" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          M.A.K Operations Manager
        </h1>
        <p className="text-xs text-slate-400 font-mono">
          Authorized Pool Staff & Owner Control Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl sm:px-8 border border-slate-200 space-y-5">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                Registered Mobile or Email *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="+919999900002 or owner@makpool.com"
                  className="w-full px-3 py-2 pl-9 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-cyan-500 text-slate-900 font-mono"
                />
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 pl-9 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-cyan-500 text-slate-900 font-mono"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs shadow-xs transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{loading ? "Verifying Credentials..." : "Sign In to Operations"}</span>
            </button>
          </form>

          {/* 1-Click Demo Accounts Selector */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block text-center font-mono">
              Demo Credentials (1-Click Fill)
            </span>

            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => fillDemoAccount("+919999900002", "Password@123")}
                className="p-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-center font-medium transition"
              >
                <strong className="block text-slate-900 font-bold">Pool Owner</strong>
                <span className="text-[9px] text-slate-500">Full Scope</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount("+919999900003", "Password@123")}
                className="p-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-center font-medium transition"
              >
                <strong className="block text-slate-900 font-bold">Duty Staff</strong>
                <span className="text-[9px] text-slate-500">No Refunds</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount("+919999900001", "Password@123")}
                className="p-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-center font-medium transition"
              >
                <strong className="block text-slate-900 font-bold">Super Admin</strong>
                <span className="text-[9px] text-slate-500">Platform</span>
              </button>
            </div>
          </div>

          <div className="text-center pt-1">
            <Link
              href="/"
              className="text-[11px] text-cyan-700 hover:text-cyan-800 font-semibold inline-flex items-center gap-1"
            >
              <span>&larr; Back to Public Website</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
