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

  const handleWhatsAppShare = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://makindoorpool.com";
    const passUrl = `${origin}/booking-status?ref=${booking.id}&phone=${booking.customerPhone}`;

    const text =
      `🏊 *M.A.K INDOOR POOL - DIGITAL ENTRY PASS* 🏊\n\n` +
      `*Pass ID:* ${booking.id}\n` +
      `*Session Type:* ${booking.type === "FAMILY" ? "Exclusive Family & Group" : "Public Swimming"}\n` +
      `*Date:* ${booking.bookingDate}\n` +
      `*Time:* ${formatSlotTime(booking.startTime)} – ${formatSlotTime(booking.endTime)}\n` +
      `*Guests:* ${booking.guestCount} Swimmers\n` +
      `*Guest Name:* ${booking.customerName}${booking.customerPlace ? ` (${booking.customerPlace})` : ""}\n\n` +
      `*Paid Online:* ₹${booking.totalPaid}\n` +
      (booking.balanceAmount > 0
        ? `*Balance Due at Counter:* ₹${booking.balanceAmount}\n`
        : `*Status:* Paid in Full ✅\n`) +
      `\n📲 *View & Show Digital QR Pass:* \n${passUrl}\n\n` +
      `📍 *Location:* Moonniyur, Malappuram, Kerala\n` +
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
        isFamily ? "🔒 EXCLUSIVE FAMILY SESSION" : "🏊 PUBLIC SWIMMING SESSION",
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
              className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                isFamily
                  ? "bg-purple-900/60 text-purple-200 border border-purple-700/50"
                  : "bg-blue-900/60 text-blue-200 border border-blue-700/50"
              }`}
            >
              {isFamily ? "Private Family Session" : "Public Swimming"}
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

      {/* Action Buttons: Download + WhatsApp */}
      {showActions && (
        <div className="space-y-2.5 pt-1">
          {/* WhatsApp Share Button */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Pass on WhatsApp</span>
          </button>

          {/* Download Image Button */}
          <button
            type="button"
            onClick={handleDownloadTicket}
            disabled={downloading}
            className="w-full bg-white hover:bg-slate-50 active:scale-98 border border-slate-200 text-slate-900 font-extrabold py-3 rounded-2xl text-xs shadow-sm transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>{downloading ? "Preparing Pass..." : "Download Pass (Save to Photos / Files)"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
