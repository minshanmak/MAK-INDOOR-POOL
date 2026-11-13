"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense, Component, ErrorInfo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
  ArrowLeft,
  Coins,
  CreditCard,
} from "lucide-react";
import { formatSlotTime } from "@/lib/timezone";
import { offlineStore } from "@/lib/offline-store";

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
        <div className="max-w-xl mx-auto p-5 bg-white rounded-[12px] border-[0.5px] border-red-200 shadow-xs text-center space-y-3.5">
          <div className="w-10 h-10 rounded-[8px] bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Scanner encountered an issue</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Your device camera or browser may have restricted scanner access. You can still look up passes manually.
            </p>
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 bg-[#0284C7] hover:bg-[#0369a1] text-white rounded-[12px] text-xs font-bold transition shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Reload scanner</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// 2. Main Scan Page Content (Reference Pattern 4: Full-screen camera view, result card, single Admit button)
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
      // Offline fallback: Check cached bookings & offline HMAC verification
      const offlineCheck = offlineStore.verifyOfflinePass(cleanCode);
      if (offlineCheck.valid && offlineCheck.bookingId) {
        const cachedBookings = offlineStore.getCachedTodayBookings();
        const matchedBooking = cachedBookings.find(
          (b) => b.id.toLowerCase() === (offlineCheck.bookingId || "").toLowerCase()
        );

        if (matchedBooking) {
          playBeep(true);
          setScanResult({
            valid: true,
            alreadyAdmitted: matchedBooking.checkInStatus === "CHECKED_IN",
            timingStatus: "ON_TIME",
            timingMessage: "Verified offline (local cache)",
            isOffline: true,
            booking: {
              id: matchedBooking.id,
              customerName: matchedBooking.customerName,
              customerPhone: matchedBooking.customerPhone,
              customerPlace: (matchedBooking as any).customerPlace || "Counter Swimmer",
              guestCount: matchedBooking.guestCount,
              type: matchedBooking.type,
              bookingDate: matchedBooking.bookingDate || "Today",
              startTime: matchedBooking.startTime,
              endTime: matchedBooking.endTime,
              durationHours: matchedBooking.durationHours,
              totalAmount: matchedBooking.totalAmount,
              totalPaid: matchedBooking.advancePaid,
              balanceAmount: matchedBooking.balanceAmount,
            },
          });
          return;
        }
      }

      playBeep(false);
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
        if (typeof window === "undefined") return;

        // Verify camera hardware and secure HTTPS context
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError(
            "Camera hardware or secure context unavailable. Please use manual lookup below."
          );
          return;
        }

        const html5Module: any = await import("html5-qrcode");
        const Html5QrcodeClass =
          html5Module.Html5Qrcode || html5Module.default?.Html5Qrcode || html5Module.default;

        if (!Html5QrcodeClass) {
          throw new Error("Scanner module could not be loaded.");
        }

        if (!isMounted) return;

        const scannerId = "qr-reader-viewport";
        const element = document.getElementById(scannerId);
        if (!element) return;

        // Clean any old scanner first
        await stopScannerSafely();
        if (!isMounted) return;

        const html5QrCode = new Html5QrcodeClass(scannerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" }, // Back camera on mobile
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            if (!isProcessingRef.current && isMounted) {
              try {
                if (html5QrCode.isScanning) {
                  html5QrCode.pause(true);
                }
              } catch {}
              verifyCode(decodedText);
            }
          },
          () => {} // Suppress continuous frame errors
        );
      } catch (err: any) {
        if (!isMounted) return;
        console.warn("Camera init notification:", err?.message || err);
        setCameraError(
          "Camera unavailable or permission denied. Please allow camera access or use manual lookup below."
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

  // Single Admit action (collects balance if due and confirms admission)
  const handleAdmit = async () => {
    if (!scanResult?.booking?.id) return;
    setAdmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const balanceAmount = scanResult.booking.balanceAmount || 0;

      // Offline queue fallback
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        offlineStore.enqueueAction("CHECK_IN", {
          bookingId: scanResult.booking.id,
          paymentMethod: collectPaymentMethod,
          collectedAmount: balanceAmount > 0 ? balanceAmount : 0,
        });

        playBeep(true);
        setSuccessMsg(
          `${scanResult.booking.customerName} (${scanResult.booking.guestCount} guests) admitted offline. Saved on this device and queued for server sync.`
        );

        setScanResult((prev: any) => ({
          ...prev,
          alreadyAdmitted: true,
          booking: {
            ...prev.booking,
            checkInStatus: "CHECKED_IN",
            balanceAmount: 0,
            totalPaid: (prev.booking.totalPaid || 0) + balanceAmount,
            paymentStatus: "PAID",
          },
        }));
        return;
      }

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
        `${data.booking.customerName} (${data.booking.guestCount} guests) admitted successfully!${
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
    <div className="max-w-xl mx-auto space-y-4 pb-16 font-sans">
      {/* Top Header Card (Visual System: 12px radius, 0.5px border, sentence case) */}
      <div className="bg-white rounded-[12px] p-4 border-[0.5px] border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="w-9 h-9 rounded-[8px] bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95"
              title="Return to dashboard"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
            </Link>
            <div>
              <h2 className="font-bold text-sm text-slate-900 tracking-tight">QR admission scanner</h2>
              <p className="text-xs text-slate-500 font-normal">Scan customer booking pass on arrival</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`min-h-[44px] min-w-[44px] p-2.5 rounded-[12px] border-[0.5px] transition flex items-center justify-center ${
              soundEnabled
                ? "bg-sky-50 text-[#0284C7] border-sky-200"
                : "bg-slate-100 text-slate-400 border-slate-200"
            }`}
            title={soundEnabled ? "Mute audio beep" : "Enable audio beep"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#0284C7]" strokeWidth={1.75} />
            ) : (
              <VolumeX className="w-4 h-4" strokeWidth={1.75} />
            )}
          </button>
        </div>

        {/* Tab Switcher: Camera Scan vs Manual Lookup */}
        <div className="grid grid-cols-2 gap-2 mt-3.5 p-1 bg-slate-100 rounded-[12px] border-[0.5px] border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setActiveTab("CAMERA");
              handleResetScanner();
            }}
            className={`min-h-[44px] py-2 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === "CAMERA"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Camera className="w-4 h-4" strokeWidth={1.75} />
            <span>Camera scanner</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("MANUAL");
              handleResetScanner();
            }}
            className={`min-h-[44px] py-2 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === "MANUAL"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Search className="w-4 h-4" strokeWidth={1.75} />
            <span>Manual lookup</span>
          </button>
        </div>
      </div>

      {/* FULL-SCREEN / VIEWPORT CAMERA CONTAINER */}
      <div
        className={`bg-slate-900 rounded-[12px] p-4 shadow-xl border-[0.5px] border-slate-800 text-center relative overflow-hidden transition-all ${
          activeTab === "CAMERA" && !scanResult ? "block" : "hidden"
        }`}
      >
        <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Point camera at customer booking pass QR</span>
        </div>

        <div className="relative mx-auto rounded-[10px] overflow-hidden bg-black/60 max-w-sm aspect-square flex items-center justify-center">
          {/* HTML5 QR Code Container (Always mounted) */}
          <div id="qr-reader-viewport" className="w-full h-full min-h-[250px]" />

          {/* Viewfinder Target Reticle Overlay */}
          <div className="absolute inset-8 border-2 border-dashed border-sky-400/60 rounded-[12px] pointer-events-none flex items-center justify-center">
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-pulse" />
          </div>

          {loading && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-bold gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-sky-400" strokeWidth={1.75} />
              <span>Verifying booking pass...</span>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="mt-3 p-3 bg-amber-500/20 border border-amber-400/30 rounded-[8px] text-amber-200 text-xs space-y-2">
            <p className="font-semibold">{cameraError}</p>
            <button
              type="button"
              onClick={() => setActiveTab("MANUAL")}
              className="min-h-[44px] px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-[8px] text-xs transition"
            >
              Switch to manual lookup
            </button>
          </div>
        )}

        <p className="text-[10px] text-slate-400 mt-2.5">
          Supports mobile camera, tablet, or external webcam.
        </p>
      </div>

      {/* Manual Lookup Form */}
      {activeTab === "MANUAL" && !scanResult && (
        <div className="bg-white rounded-[12px] p-4 sm:p-5 border-[0.5px] border-slate-200 shadow-xs space-y-3.5">
          <h3 className="font-bold text-sm text-slate-900">Enter booking ID or phone number</h3>
          <p className="text-xs text-slate-500">
            If customer phone battery is drained or camera is unavailable, enter pass reference (e.g. MAK-20261113-001) or mobile number.
          </p>

          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. MAK-20261113-001 or 9876543210"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-3.5 pr-10 min-h-[48px] bg-slate-50 border-[0.5px] border-slate-200 rounded-[12px] text-xs font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-[#0284C7] transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-4 pointer-events-none" strokeWidth={1.75} />
            </div>

            <button
              type="submit"
              disabled={loading || !manualCode.trim()}
              className="w-full min-h-[44px] bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold py-2.5 rounded-[12px] text-xs transition flex items-center justify-center gap-2 shadow-xs"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={1.75} /> : <ShieldCheck className="w-4 h-4" strokeWidth={1.75} />}
              <span>Verify and load pass</span>
            </button>
          </form>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border-[0.5px] border-red-200 text-red-800 rounded-[12px] text-xs flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" strokeWidth={1.75} />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-800">
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border-[0.5px] border-emerald-200 text-emerald-800 rounded-[12px] text-xs flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" strokeWidth={1.75} />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      )}

      {/* RESULT CARD & ADMISSION PANEL (Single Admit Button) */}
      {scanResult && (
        <div className="bg-white rounded-[12px] border-[0.5px] border-slate-200 shadow-sm overflow-hidden space-y-3.5">
          {/* Status Header */}
          <div
            className={`p-4 text-white ${
              scanResult.alreadyAdmitted
                ? "bg-slate-800"
                : scanResult.timingStatus === "DIFFERENT_DATE"
                ? "bg-amber-600"
                : scanResult.booking.type === "FAMILY"
                ? "bg-purple-900"
                : "bg-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-sky-300 block">
                  Verified booking pass
                </span>
                <h3 className="text-lg font-extrabold font-mono tracking-tight mt-0.5">
                  {scanResult.booking.id}
                </h3>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-[8px] text-[10px] font-bold uppercase border-[0.5px] ${
                  scanResult.alreadyAdmitted
                    ? "bg-slate-700 text-slate-300 border-slate-600"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                }`}
              >
                {scanResult.alreadyAdmitted ? "Already admitted" : "Valid pass"}
              </span>
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />
                <span>{scanResult.timingMessage}</span>
              </span>
              <span className="font-mono text-[11px] text-slate-300">{scanResult.booking.bookingDate}</span>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-4 space-y-3.5 text-xs">
            {/* Customer & Swimmers Grid */}
            <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer</span>
                <span className="font-bold text-sm text-slate-900 block mt-0.5">
                  {scanResult.booking.customerName}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">{scanResult.booking.customerPhone}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Swimmers</span>
                <span className="font-extrabold text-base text-slate-900 block mt-0.5">
                  {scanResult.booking.guestCount} guests
                </span>
                <span className="text-[10px] text-purple-700 font-bold uppercase">
                  {scanResult.booking.type === "FAMILY" ? "Exclusive family" : "Public session"}
                </span>
              </div>
            </div>

            {/* Session Time */}
            <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Session time</span>
                <span className="font-bold font-mono text-slate-900 block mt-0.5">
                  {formatSlotTime(scanResult.booking.startTime)} – {formatSlotTime(scanResult.booking.endTime)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Duration</span>
                <span className="font-medium text-slate-700 block mt-0.5">
                  {scanResult.booking.durationHours} hour{scanResult.booking.durationHours > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Financial Details */}
            <div className="p-3 rounded-[10px] bg-slate-50 border-[0.5px] border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Total booking price:</span>
                <span className="font-bold text-slate-900 font-mono">₹{scanResult.booking.totalAmount}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-700">
                <span>Paid online:</span>
                <span className="font-bold font-mono">₹{scanResult.booking.totalPaid}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Balance on arrival:</span>
                  <span className="text-[10px] text-slate-400">Due before entering pool</span>
                </div>
                <span
                  className={`text-base font-extrabold font-mono ${
                    scanResult.booking.balanceAmount > 0 ? "text-rose-600" : "text-emerald-700"
                  }`}
                >
                  ₹{scanResult.booking.balanceAmount}
                </span>
              </div>
            </div>

            {/* Payment method selector if balance due */}
            {scanResult.booking.balanceAmount > 0 && !scanResult.alreadyAdmitted && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Collect balance (₹{scanResult.booking.balanceAmount}) via:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCollectPaymentMethod("CASH")}
                    className={`min-h-[44px] rounded-[10px] text-xs font-bold border-[0.5px] transition flex items-center justify-center gap-2 ${
                      collectPaymentMethod === "CASH"
                        ? "bg-[#0284C7] text-white border-[#0284C7] shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Coins className="w-4 h-4" strokeWidth={1.75} />
                    <span>Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollectPaymentMethod("UPI")}
                    className={`min-h-[44px] rounded-[10px] text-xs font-bold border-[0.5px] transition flex items-center justify-center gap-2 ${
                      collectPaymentMethod === "UPI"
                        ? "bg-purple-700 text-white border-purple-700 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" strokeWidth={1.75} />
                    <span>UPI</span>
                  </button>
                </div>
              </div>
            )}

            {/* SINGLE ADMIT BUTTON (Reference Pattern: Clean, prominent single Admit CTA) */}
            <div className="pt-2 space-y-2">
              {!scanResult.alreadyAdmitted ? (
                <button
                  type="button"
                  onClick={handleAdmit}
                  disabled={admitting}
                  className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold py-3 rounded-[12px] text-xs shadow-xs transition flex items-center justify-center gap-2"
                >
                  {admitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={1.75} />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                  )}
                  <span>
                    {admitting
                      ? "Admitting swimmers..."
                      : scanResult.booking.balanceAmount > 0
                      ? `Collect ₹${scanResult.booking.balanceAmount} & Admit`
                      : `Admit swimmers (${scanResult.booking.guestCount} guests)`}
                  </span>
                </button>
              ) : (
                <div className="p-3 bg-slate-100 text-slate-600 rounded-[10px] text-center text-xs font-bold">
                  Swimmers were already admitted to the pool earlier.
                </div>
              )}

              <button
                type="button"
                onClick={handleResetScanner}
                className="w-full min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-[12px] text-xs transition"
              >
                Scan next swimmer
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
      <div className="bg-white rounded-[12px] p-5 h-28 border-[0.5px] border-slate-200" />
      <div className="bg-slate-900 rounded-[12px] p-4 h-72 border-[0.5px] border-slate-800" />
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
