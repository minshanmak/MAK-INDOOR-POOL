"use client";

import React, { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import MakLogo from "@/components/MakLogo";
import {
  Download,
  Share2,
  Calendar,
  Clock,
  Users,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  Waves,
  Info,
  X,
} from "lucide-react";
import { formatSlotTime } from "@/lib/timezone";

interface BookingPassProps {
  booking: {
    id: string;
    qrToken?: string | null;
    type: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    guestCount: number;
    customerName: string;
    customerPhone: string;
    customerPlace?: string | null;
    totalAmount: number;
    totalPaid: number;
    balanceAmount: number;
    paymentStatus: string;
    status: string;
  };
  showActions?: boolean;
}

export default function BookingPassCard({ booking, showActions = true }: BookingPassProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [walletModal, setWalletModal] = useState<{
    open: boolean;
    provider: "Apple" | "Google";
    message: string;
    missing?: string[];
  } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Generate QR code data URL (encodes the booking verification URL)
  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://makindoorpool.com";
    const scanPayload = `${origin}/admin/scan?code=${booking.qrToken || booking.id}`;

    QRCode.toDataURL(scanPayload, {
      width: 320,
      margin: 1,
      color: {
        dark: "#0F172A", // Deep Slate
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Code generation error", err));
  }, [booking.id, booking.qrToken]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(booking.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToAppleWallet = async () => {
    setAppleLoading(true);
    try {
      const res = await fetch(
        `/api/passes/apple?bookingId=${encodeURIComponent(booking.id)}&token=${encodeURIComponent(
          booking.qrToken || booking.customerPhone
        )}`
      );

      if (res.status === 412) {
        const data = await res.json();
        setWalletModal({
          open: true,
          provider: "Apple",
          message:
            data.message ||
            "Apple Wallet pass signing requires Apple Developer Certificate configuration.",
          missing: data.missing,
        });
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate Apple Wallet pass.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mak-pass-${booking.id}.pkpass`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || "Could not generate Apple Wallet pass.");
    } finally {
      setAppleLoading(false);
    }
  };

  const handleAddToGoogleWallet = async () => {
    setGoogleLoading(true);
    try {
      const res = await fetch(
        `/api/passes/google?bookingId=${encodeURIComponent(booking.id)}&token=${encodeURIComponent(
          booking.qrToken || booking.customerPhone
        )}`
      );

      if (res.status === 412) {
        const data = await res.json();
        setWalletModal({
          open: true,
          provider: "Google",
          message:
            data.message ||
            "Google Wallet integration requires Google Cloud Service Account configuration.",
          missing: data.missing,
        });
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.saveUrl) {
        throw new Error(data.error || "Failed to generate Google Wallet save link.");
      }

      window.open(data.saveUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      alert(err.message || "Could not generate Google Wallet pass.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleWhatsAppShare = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://makindoorpool.com";
    const passUrl = `${origin}/booking-status?ref=${booking.id}&phone=${booking.customerPhone}`;

    const text =
      `*M.A.K INDOOR POOL - DIGITAL ENTRY PASS*\n\n` +
      `*Pass ID:* ${booking.id}\n` +
      `*Session Type:* ${booking.type === "FAMILY" ? "Exclusive Family & Group" : "Public Swimming"}\n` +
      `*Date:* ${booking.bookingDate}\n` +
      `*Time:* ${formatSlotTime(booking.startTime)} – ${formatSlotTime(booking.endTime)}\n` +
      `*Guests:* ${booking.guestCount} Swimmers\n` +
      `*Guest Name:* ${booking.customerName}${booking.customerPlace ? ` (${booking.customerPlace})` : ""}\n\n` +
      `*Paid Online:* ₹${booking.totalPaid}\n` +
      (booking.balanceAmount > 0
        ? `*Balance Due at Counter:* ₹${booking.balanceAmount}\n`
        : `*Status:* Paid in Full [Verified]\n`) +
      `\n*View & Show Digital QR Pass:* \n${passUrl}\n\n` +
      `*Location:* Moonniyur, Malappuram, Kerala\n` +
      `Show this pass at the pool counter for instant admission!`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Client-side image generator for downloading the ticket
  const handleDownloadTicket = async () => {
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 920;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Card Background
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(0, 0, 600, 920);

      // Card Body
      ctx.fillStyle = "#FFFFFF";
      ctx.roundRect(30, 30, 540, 860, 24);
      ctx.fill();

      // Top Header (Navy)
      ctx.fillStyle = "#0F172A";
      ctx.beginPath();
      ctx.roundRect(30, 30, 540, 110, [24, 24, 0, 0]);
      ctx.fill();

      // Official Logo on Ticket
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        await new Promise((resolve) => {
          logoImg.onload = resolve;
          logoImg.onerror = resolve;
          logoImg.src = "/images/mak-logo-white.png";
        });
        if (logoImg.width > 0) {
          ctx.drawImage(logoImg, 50, 48, 120, 65);
        }
      } catch {}

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 20px system-ui, sans-serif";
      ctx.fillText("M.A.K INDOOR POOL", 185, 75);

      ctx.fillStyle = "#94A3B8";
      ctx.font = "12px system-ui, sans-serif";
      ctx.fillText("Digital Entry Pass • Moonniyur, Malappuram", 185, 100);

      // Pass Type Badge
      const isFamily = booking.type === "FAMILY";
      ctx.fillStyle = isFamily ? "#FAF5FF" : "#EFF6FF";
      ctx.roundRect(50, 160, 500, 40, 10);
      ctx.fill();

      ctx.fillStyle = isFamily ? "#7E22CE" : "#1D4ED8";
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.fillText(
        isFamily ? "EXCLUSIVE FAMILY SESSION" : "PUBLIC SWIMMING SESSION",
        70,
        185
      );

      // QR Code
      if (qrDataUrl) {
        const qrImg = new Image();
        qrImg.crossOrigin = "anonymous";
        await new Promise((resolve) => {
          qrImg.onload = resolve;
          qrImg.src = qrDataUrl;
        });
        ctx.drawImage(qrImg, 180, 220, 240, 240);
      }

      ctx.fillStyle = "#64748B";
      ctx.font = "12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Show this QR Code at the pool counter", 300, 485);

      // Perforated line
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = "#CBD5E1";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, 510);
      ctx.lineTo(570, 510);
      ctx.stroke();
      ctx.setLineDash([]);

      // Cutout circles
      ctx.fillStyle = "#F8FAFC";
      ctx.beginPath();
      ctx.arc(30, 510, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(570, 510, 16, 0, Math.PI * 2);
      ctx.fill();

      // Booking Details
      ctx.textAlign = "left";
      ctx.fillStyle = "#64748B";
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.fillText("BOOKING PASS ID", 60, 550);
      ctx.fillText("GUEST NAME", 330, 550);

      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 16px monospace";
      ctx.fillText(booking.id, 60, 575);
      ctx.font = "bold 15px system-ui, sans-serif";
      ctx.fillText(booking.customerName, 330, 575);

      // Row 2: Date & Time
      ctx.fillStyle = "#64748B";
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.fillText("DATE", 60, 620);
      ctx.fillText("SESSION TIME", 330, 620);

      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 15px system-ui, sans-serif";
      ctx.fillText(booking.bookingDate, 60, 645);
      ctx.fillText(`${formatSlotTime(booking.startTime)} – ${formatSlotTime(booking.endTime)}`, 330, 645);

      // Row 3: Swimmers & Place
      ctx.fillStyle = "#64748B";
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.fillText("SWIMMER COUNT", 60, 690);
      ctx.fillText("LOCATION / TOWN", 330, 690);

      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 15px system-ui, sans-serif";
      ctx.fillText(`${booking.guestCount} Swimmers`, 60, 715);
      ctx.fillText(booking.customerPlace || "Kerala", 330, 715);

      // Row 4: Financials
      ctx.fillStyle = "#F1F5F9";
      ctx.roundRect(50, 745, 500, 75, 12);
      ctx.fill();

      ctx.fillStyle = "#64748B";
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.fillText("PAID ONLINE", 70, 770);
      ctx.fillText("BALANCE ON ARRIVAL", 310, 770);

      ctx.fillStyle = "#15803D";
      ctx.font = "bold 18px monospace";
      ctx.fillText(`₹${booking.totalPaid}`, 70, 798);

      ctx.fillStyle = booking.balanceAmount > 0 ? "#DC2626" : "#15803D";
      ctx.font = "bold 18px monospace";
      ctx.fillText(booking.balanceAmount > 0 ? `₹${booking.balanceAmount}` : "₹0 (Fully Paid)", 310, 798);

      // Footer
      ctx.textAlign = "center";
      ctx.fillStyle = "#94A3B8";
      ctx.font = "11px system-ui, sans-serif";
      ctx.fillText("Helpline: +91 98470 12345 • info@makindoorpool.com", 300, 860);

      const downloadUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `MAK-Pool-Pass-${booking.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Ticket download error", err);
    } finally {
      setDownloading(false);
    }
  };

  const isFamily = booking.type === "FAMILY";

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* Boarding Pass Card */}
      <div
        ref={cardRef}
        className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_12px_40px_rgba(15,23,42,0.08)] overflow-hidden transition"
      >
        {/* Top Header Banner */}
        <div className="bg-[#0F172A] text-white p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-sky-400 block mb-1">
                Official Entry Pass
              </span>
              <MakLogo light={true} size="md" />
              <p className="text-[11px] text-slate-400 mt-1">Moonniyur, Malappuram, Kerala</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-sky-400 backdrop-blur-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase inline-flex items-center gap-1.5 ${
                isFamily
                  ? "bg-purple-900/60 text-purple-200 border border-purple-700/50"
                  : "bg-blue-900/60 text-blue-200 border border-blue-700/50"
              }`}
            >
              {isFamily ? <Lock className="w-3 h-3 text-purple-300" /> : <Waves className="w-3 h-3 text-blue-300" />}
              <span>{isFamily ? "Private Family Session" : "Public Swimming"}</span>
            </span>
            <span className="font-mono font-bold text-slate-300 text-[11px]">{booking.bookingDate}</span>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="p-6 bg-white text-center space-y-3">
          <div className="inline-block p-3 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-inner">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Pass for ${booking.id}`}
                className="w-48 h-48 mx-auto rounded-xl block"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-xl text-slate-400 text-xs">
                Generating QR...
              </div>
            )}
          </div>
          <p className="text-[11px] font-semibold text-slate-500">
            Show this QR code at the pool counter for instant admission
          </p>
        </div>

        {/* Perforated Divider */}
        <div className="relative h-5 bg-white flex items-center justify-between px-2 overflow-hidden">
          <div className="w-5 h-5 rounded-full bg-[#F0F5FA] -ml-4 border border-slate-200/60" />
          <div className="w-full border-t-2 border-dashed border-slate-200" />
          <div className="w-5 h-5 rounded-full bg-[#F0F5FA] -mr-4 border border-slate-200/60" />
        </div>

        {/* Pass Details */}
        <div className="p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Pass ID</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono font-black text-sm text-slate-900">{booking.id}</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="p-1 text-slate-400 hover:text-slate-800 transition"
                  title="Copy Pass ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Swimmers</span>
              <span className="font-extrabold text-sm text-slate-900 mt-0.5 block">
                {booking.guestCount} {booking.guestCount === 1 ? "Guest" : "Guests"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Guest Name</span>
              <span className="font-bold text-slate-900 block mt-0.5">
                {booking.customerName} {booking.customerPlace ? `(${booking.customerPlace})` : ""}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Session Time</span>
              <span className="font-bold text-slate-900 font-mono block mt-0.5">
                {formatSlotTime(booking.startTime)} – {formatSlotTime(booking.endTime)}
              </span>
            </div>
          </div>

          {/* Payment Pill Summary */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Paid Online</span>
              <span className="font-black text-emerald-700 text-sm font-mono">₹{booking.totalPaid}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Balance Due</span>
              <span
                className={`font-black text-sm font-mono ${
                  booking.balanceAmount > 0 ? "text-amber-700" : "text-emerald-700"
                }`}
              >
                {booking.balanceAmount > 0 ? `₹${booking.balanceAmount}` : "₹0 (Paid)"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons: WhatsApp + Download + Apple & Google Wallets */}
      {showActions && (
        <div className="space-y-2.5 pt-1">
          {/* WhatsApp Share Button */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4 stroke-[1.75]" />
            <span>Share Pass on WhatsApp</span>
          </button>

          {/* Download Image Button */}
          <button
            type="button"
            onClick={handleDownloadTicket}
            disabled={downloading}
            className="w-full bg-white hover:bg-slate-50 active:scale-98 border border-slate-200 text-slate-900 font-extrabold py-3 rounded-2xl text-xs shadow-sm transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-slate-600 stroke-[1.75]" />
            <span>{downloading ? "Preparing Pass..." : "Download Pass (Save to Photos / Files)"}</span>
          </button>

          {/* Digital Mobile Wallets: Apple Wallet & Google Wallet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* Apple Wallet Button */}
            <button
              type="button"
              onClick={handleAddToAppleWallet}
              disabled={appleLoading}
              className="min-h-[46px] w-full bg-black hover:bg-slate-900 active:scale-98 text-white font-bold py-2.5 px-4 rounded-2xl text-xs shadow-sm transition flex items-center justify-center gap-2 border border-black cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.73-7.98-12.13-14.71-6.19-9.51-11.08-20.2-14.67-32.06-3.59-11.86-5.39-23.2-5.39-34.02 0-14.88 3.73-27.24 11.19-37.07 7.46-9.84 16.92-14.85 28.38-15.04 4.58 0 9.8 1.18 15.66 3.55 5.86 2.37 9.53 3.61 11.01 3.72 1.83-.24 5.76-1.63 11.78-4.17 6.02-2.54 11.23-3.67 15.63-3.39 12.35.61 22.38 5.16 30.08 13.66-10.74 6.54-16.03 15.53-15.86 26.97.17 9.17 3.79 16.89 10.86 23.16 7.07 6.27 15.42 9.69 25.05 10.26-2.19 6.72-4.99 13.65-8.41 20.81zM119.22 33.11c0-7.46 2.65-14.43 7.95-20.91 5.3-6.48 11.83-10.42 19.59-11.82.25 1.54.38 2.88.38 4.02 0 7.37-2.73 14.39-8.19 21.05-5.46 6.66-12.06 10.59-19.8 11.79-.12-1.37-.18-2.61-.18-3.73l.25-.4z" />
              </svg>
              <span>{appleLoading ? "Preparing Pass..." : "Add to Apple Wallet"}</span>
            </button>

            {/* Google Wallet Button */}
            <button
              type="button"
              onClick={handleAddToGoogleWallet}
              disabled={googleLoading}
              className="min-h-[46px] w-full bg-white hover:bg-slate-50 active:scale-98 text-slate-800 font-bold py-2.5 px-4 rounded-2xl text-xs shadow-sm transition flex items-center justify-center gap-2 border border-slate-300 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
                <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
                <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.91l7.35-5.73z"/>
                <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
              </svg>
              <span>{googleLoading ? "Preparing Pass..." : "Add to Google Wallet"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Wallet Information / Diagnostic Modal */}
      {walletModal?.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#0284C7] flex items-center justify-center shrink-0">
                <Info className="w-5 h-5 stroke-[1.75]" />
              </div>
              <button
                type="button"
                onClick={() => setWalletModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[1.75]" />
              </button>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                {walletModal.provider} Wallet Pass Setup
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {walletModal.message}
              </p>
            </div>
            {walletModal.missing && walletModal.missing.length > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Required Environment Variables:
                </span>
                <ul className="text-[11px] font-mono text-slate-700 space-y-0.5">
                  {walletModal.missing.map((key) => (
                    <li key={key} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>{key}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-[11px] text-slate-400">
              Your instant entry QR code above is active and accepted at the pool counter. You can also tap "Download Pass" or "Share on WhatsApp".
            </p>
            <button
              type="button"
              onClick={() => setWalletModal(null)}
              className="w-full py-2.5 bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
