"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Phone, AlertCircle } from "lucide-react";
import MakLogo from "@/components/MakLogo";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/admin";

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
      router.push(redirectTarget);
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
    <div className="min-h-screen bg-[#071322] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="flex justify-center pb-1">
          <MakLogo light={true} size="xl" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Staff &amp; Ops Portal</h2>
          <p className="text-xs text-slate-400 mt-1">
            M.A.K Indoor Pool Operational Access Control
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl sm:px-8 border border-slate-200">
          {error && (
            <div className="mb-4 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                Registered Phone or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="+919999900002 or owner@makpool.com"
                  className="w-full px-3 py-2.5 pl-9 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-cyan-500 text-slate-900"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2.5 pl-9 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-cyan-500 text-slate-900"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs shadow-xs transition"
            >
              {loading ? "Authenticating..." : "Sign In to Operations"}
            </button>
          </form>

          {/* Demonstration Accounts Shortcut */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              Quick Demonstration Accounts
            </span>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => fillDemoAccount("+919999900002", "Password@123")}
                className="p-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold rounded-lg text-center transition"
              >
                Pool Owner
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount("+919999900003", "Password@123")}
                className="p-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold rounded-lg text-center transition"
              >
                Duty Staff
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount("+919999900001", "Password@123")}
                className="p-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold rounded-lg text-center transition"
              >
                Super Admin
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-1">
              (Pre-configured with demo password: <code>Password@123</code>)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#071322] flex items-center justify-center text-white text-xs">
          Loading login portal...
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
