"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense, Component, ErrorInfo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  X,
  Volume2,
  VolumeX,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { formatSlotTime } from "@/lib/timezone";

// ==========================================
// 1. Error Boundary Component
// Prevents any camera/DOM exception from crashing the React tree
// ==========================================
interface ErrorBoundaryProps {
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ScanErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ScanErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto p-6 bg-white rounded-3xl border border-red-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Scanner Encountered an Issue</h3>
            <p className="text-xs text-slate-500 mt-1">
              Your device camera or browser may have restricted scanner access. You can still look up passes manually.
            </p>
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1D68BD] hover:bg-[#155299] text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reload Scanner</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// 2. Main Scan Page Content
// ==========================================
function AdminScanContent() {
  const searchParams = useSearchParams();
  const urlCode = searchParams.get("code") || searchParams.get("ref");

  const [activeTab, setActiveTab] = useState<"CAMERA" | "MANUAL">("CAMERA");
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Admission state
  const [collectPaymentMethod, setCollectPaymentMethod] = useState<"CASH" | "UPI">("CASH");
  const [admitting, setAdmitting] = useState(false);

  // Camera scanner state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const scannerRef = useRef<any>(null);
  const isProcessingRef = useRef(false);
  const isStoppingRef = useRef(false);

  // Web Audio API beep sound for feedback
  const playBeep = useCallback((isSuccess = true) => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // AudioContext policy safe catch
    }
  }, [soundEnabled]);

  // Safely stop scanner instance
  const stopScannerSafely = useCallback(async () => {
    if (!scannerRef.current || isStoppingRef.current) return;
    isStoppingRef.current = true;
    try {
      const scanner = scannerRef.current;
      const isScanning =
        scanner.isScanning ||
        (typeof scanner.getState === "function" && scanner.getState() === 2);
      if (isScanning) {
        await scanner.stop();
      }
    } catch (err) {
      console.warn("Scanner stop safely handled", err);
    } finally {
      scannerRef.current = null;
      isStoppingRef.current = false;
    }
  }, []);

  // Verify Pass by code/ID
  const verifyCode = useCallback(async (codeToVerify: string) => {
    if (!codeToVerify || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Haptic feedback on mobile devices
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([80, 40, 80]);
      } catch {}
    }

    // Extract raw code if a full URL was scanned
    let cleanCode = codeToVerify.trim();
    if (cleanCode.includes("http://") || cleanCode.includes("https://")) {
      try {
        const url = new URL(cleanCode);
        cleanCode = url.searchParams.get("code") || url.searchParams.get("ref") || cleanCode;
      } catch {
        // Continue with raw code
      }
    }

    try {
      const res = await fetch(`/api/admin/bookings/scan?code=${encodeURIComponent(cleanCode)}`);
      const data = await res.json();

      if (!res.ok) {
        playBeep(false);
        throw new Error(data.error || "Pass verification failed.");
      }

      playBeep(true);
      setScanResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not verify QR code.");
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  }, [playBeep]);

  // Handle URL query parameter (?code=...) on page load
  useEffect(() => {
    if (urlCode && !scanResult) {
      setActiveTab("MANUAL");
      setManualCode(urlCode);
      verifyCode(urlCode);
    }
  }, [urlCode, scanResult, verifyCode]);

  // Setup and Manage HTML5 QR Code Scanner
  useEffect(() => {
    let isMounted = true;

    // If on MANUAL tab or if a scanResult is already showing, stop camera
    if (activeTab !== "CAMERA" || scanResult) {
      stopScannerSafely();
      return;
    }

    async function initScanner() {
      try {
        setCameraError(null);
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!isMounted) return;

        const scannerId = "qr-reader-viewport";
        const element = document.getElementById(scannerId);
        if (!element) return;

        // Clean any old scanner first
        await stopScannerSafely();
        if (!isMounted) return;

        const html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" }, // Back camera on mobile
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // QR code detected: safely pause/freeze camera before processing
            if (!isProcessingRef.current && isMounted) {
              try {
                if (html5QrCode.isScanning) {
                  html5QrCode.pause(true);
                }
              } catch {}
              verifyCode(decodedText);
            }
          },
          () => {} // Safe suppression of frame scanning errors
        );
      } catch (err: any) {
        if (!isMounted) return;
        console.warn("Camera init notification:", err?.message || err);
        setCameraError(
          "Camera unavailable or permission denied. Please allow camera access or use Manual Lookup below."
        );
      }
    }

    const timer = setTimeout(initScanner, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScannerSafely();
    };
  }, [activeTab, scanResult, stopScannerSafely, verifyCode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      verifyCode(manualCode.trim());
    }
  };

  const handleAdmit = async () => {
    if (!scanResult?.booking?.id) return;
    setAdmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const balanceAmount = scanResult.booking.balanceAmount || 0;
      const res = await fetch("/api/admin/bookings/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: scanResult.booking.id,
          paymentMethod: collectPaymentMethod,
          collectedAmount: balanceAmount > 0 ? balanceAmount : 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Admission failed.");
      }

      playBeep(true);
      setSuccessMsg(
        `${data.booking.customerName} (${data.booking.guestCount} Guests) admitted successfully!${
          balanceAmount > 0 ? ` Collected balance ₹${balanceAmount} via ${collectPaymentMethod}.` : ""
        }`
      );

      // Update local state to show already admitted
      setScanResult((prev: any) => ({
        ...prev,
        alreadyAdmitted: true,
        booking: {
          ...prev.booking,
          checkInStatus: "CHECKED_IN",
          balanceAmount: 0,
          totalPaid: prev.booking.totalAmount,
          paymentStatus: "PAID",
        },
      }));
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to admit booking.");
    } finally {
      setAdmitting(false);
    }
  };

  const handleResetScanner = () => {
    setScanResult(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setManualCode("");
    isProcessingRef.current = false;
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-16">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 text-[#1D68BD] flex items-center justify-center">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-900">QR Admission Scanner</h2>
              <p className="text-xs text-slate-500 mt-0.5">Scan customer booking pass on arrival</p>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition ${
              soundEnabled
                ? "bg-slate-50 text-slate-700 border-slate-200"
                : "bg-slate-100 text-slate-400 border-slate-200"
            }`}
            title={soundEnabled ? "Mute audio beep" : "Enable audio beep"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#1D68BD]" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Tab Switcher: Camera Scan vs Manual Lookup */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab("CAMERA");
              handleResetScanner();
            }}
            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === "CAMERA"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Scanner</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("MANUAL");
              handleResetScanner();
            }}
            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === "MANUAL"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Manual Lookup</span>
          </button>
        </div>
      </div>

      {/* CAMERA VIEWPORT CONTAINER:
          Kept persistently in DOM to prevent html5-qrcode crashes on unmount.
          Hidden via CSS when not on CAMERA tab or when viewing scan results. */}
      <div
        className={`bg-slate-900 rounded-3xl p-4 shadow-xl border border-slate-800 text-center relative overflow-hidden transition-all ${
          activeTab === "CAMERA" && !scanResult ? "block" : "hidden"
        }`}
      >
        <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Point camera at customer's Booking Pass QR</span>
        </div>

        <div className="relative mx-auto rounded-2xl overflow-hidden bg-black/60 max-w-sm aspect-square flex items-center justify-center">
          {/* HTML5 QR Code Container (Always mounted) */}
          <div id="qr-reader-viewport" className="w-full h-full min-h-[250px]" />

          {/* Target Reticle Overlay */}
          <div className="absolute inset-8 border-2 border-dashed border-sky-400/60 rounded-2xl pointer-events-none flex items-center justify-center">
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-pulse" />
          </div>

          {loading && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-bold gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
              <span>Verifying Booking Pass...</span>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="mt-3 p-3 bg-amber-500/20 border border-amber-400/30 rounded-xl text-amber-200 text-xs space-y-2">
            <p className="font-semibold">{cameraError}</p>
            <button
              type="button"
              onClick={() => setActiveTab("MANUAL")}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold rounded-lg text-xs transition"
            >
              Switch to Manual Lookup
            </button>
          </div>
        )}

        <p className="text-[10px] text-slate-400 mt-3">
          Supports mobile phone camera, tablet, or webcams.
        </p>
      </div>

      {/* Manual Lookup Form (Shown when tab is MANUAL and no active result) */}
      {activeTab === "MANUAL" && !scanResult && (
        <div className="bg-white rounded-3xl p-6 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900">Enter Booking ID or Phone Number</h3>
          <p className="text-xs text-slate-500">
            If customer's phone battery is drained or camera is unavailable, enter their Pass ID (e.g. MAK-20261109-001) or mobile number.
          </p>

          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. MAK-20261109-001 or 9876543210"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-4 top-4 pointer-events-none" />
            </div>

            <button
              type="submit"
              disabled={loading || !manualCode.trim()}
              className="w-full bg-[#1D68BD] hover:bg-[#155299] active:scale-98 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-md shadow-blue-700/20 transition flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Verify &amp; Load Pass</span>
            </button>
          </form>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Verification Result Card & Admission Panel */}
      {scanResult && (
        <div className="bg-white rounded-3xl border border-white shadow-[0_12px_40px_rgba(20,60,110,0.08)] overflow-hidden space-y-4">
          {/* Card Header Status */}
          <div
            className={`p-5 text-white ${
              scanResult.alreadyAdmitted
                ? "bg-slate-800"
                : scanResult.timingStatus === "DIFFERENT_DATE"
                ? "bg-amber-600"
                : scanResult.booking.type === "FAMILY"
                ? "bg-purple-900"
                : "bg-[#0F172A]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-sky-300 block">
                  Verified Booking Pass
                </span>
                <h3 className="text-xl font-black font-mono tracking-tight mt-0.5">
                  {scanResult.booking.id}
                </h3>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                  scanResult.alreadyAdmitted
                    ? "bg-slate-700 text-slate-300 border border-slate-600"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                }`}
              >
                {scanResult.alreadyAdmitted ? "Already Admitted" : "Valid Pass"}
              </span>
            </div>

            {/* Timing Pill */}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>{scanResult.timingMessage}</span>
              </span>
              <span className="font-mono text-[11px] text-slate-300">{scanResult.booking.bookingDate}</span>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 space-y-4 text-xs">
            {/* Customer & Swimmers Grid */}
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer</span>
                <span className="font-extrabold text-sm text-slate-900 block mt-0.5">
                  {scanResult.booking.customerName}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">{scanResult.booking.customerPhone}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Swimmers</span>
                <span className="font-black text-lg text-slate-900 block mt-0.5">
                  {scanResult.booking.guestCount} Guests
                </span>
                <span className="text-[10px] text-purple-700 font-bold uppercase">
                  {scanResult.booking.type === "FAMILY" ? "Exclusive Family" : "Public Session"}
                </span>
              </div>
            </div>

            {/* Session Time & Location */}
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Session Time</span>
                <span className="font-extrabold font-mono text-slate-900 block mt-0.5">
                  {formatSlotTime(scanResult.booking.startTime)} – {formatSlotTime(scanResult.booking.endTime)}
                </span>
                <span className="text-[11px] text-slate-500">
                  {scanResult.booking.durationHours} Hour{scanResult.booking.durationHours > 1 ? "s" : ""}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer Town</span>
                <span className="font-semibold text-slate-800 block mt-0.5">
                  {scanResult.booking.customerPlace || "Not specified"}
                </span>
              </div>
            </div>

            {/* Financial & Balance Details */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600">Total Booking Price:</span>
                <span className="font-black text-slate-900 font-mono">₹{scanResult.booking.totalAmount}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-[11px] font-bold">Paid Online:</span>
                <span className="font-black font-mono">₹{scanResult.booking.totalPaid}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-slate-900 block">Balance on Arrival:</span>
                  <span className="text-[10px] text-slate-400">Due before entering pool</span>
                </div>
                <span
                  className={`text-lg font-black font-mono ${
                    scanResult.booking.balanceAmount > 0 ? "text-rose-600" : "text-emerald-700"
                  }`}
                >
                  ₹{scanResult.booking.balanceAmount}
                </span>
              </div>
            </div>

            {/* If Balance Due: Payment Method Selector */}
            {scanResult.booking.balanceAmount > 0 && !scanResult.alreadyAdmitted && (
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-800">
                  Collect Balance (₹{scanResult.booking.balanceAmount}) via:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCollectPaymentMethod("CASH")}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                      collectPaymentMethod === "CASH"
                        ? "bg-[#1D68BD] text-white border-[#1D68BD] shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    Cash Counter
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollectPaymentMethod("UPI")}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                      collectPaymentMethod === "UPI"
                        ? "bg-[#9333EA] text-white border-[#9333EA] shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    UPI (GPay / PhonePe)
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              {!scanResult.alreadyAdmitted ? (
                <button
                  type="button"
                  onClick={handleAdmit}
                  disabled={admitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2"
                >
                  {admitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>
                    {admitting
                      ? "Admitting..."
                      : scanResult.booking.balanceAmount > 0
                      ? `Collect ₹${scanResult.booking.balanceAmount} & Admit (${scanResult.booking.guestCount} Guests)`
                      : `Admit Swimmers (${scanResult.booking.guestCount} Guests)`}
                  </span>
                </button>
              ) : (
                <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl text-center text-xs font-bold">
                  Swimmers were admitted to the pool earlier.
                </div>
              )}

              <button
                type="button"
                onClick={handleResetScanner}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-2xl text-xs transition"
              >
                Scan Next Swimmer / Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Fallback skeleton while Suspense resolves
function ScanPageSkeleton() {
  return (
    <div className="max-w-xl mx-auto space-y-4 pb-16 animate-pulse">
      <div className="bg-white rounded-3xl p-5 h-32 border border-slate-100" />
      <div className="bg-slate-900 rounded-3xl p-4 h-80 border border-slate-800" />
    </div>
  );
}

// ==========================================
// 3. Exported Component wrapped in Error Boundary and Suspense
// ==========================================
export default function AdminScanPage() {
  return (
    <ScanErrorBoundary>
      <Suspense fallback={<ScanPageSkeleton />}>
        <AdminScanContent />
      </Suspense>
    </ScanErrorBoundary>
  );
}
