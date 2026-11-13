"use client";

import React, { useState, useEffect } from "react";
import { Clock, Users, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { formatSlotTime } from "@/lib/timezone";

interface TimelineBooking {
  id: string;
  type: "PUBLIC" | "FAMILY";
  startTime: string; // "10:00"
  endTime: string;   // "12:00"
  guestCount: number;
  customerName?: string;
  status: string;
}

interface CounterTimelineProps {
  bookings: TimelineBooking[];
  currentTimeStr?: string; // "HH:mm"
  bufferMinutes?: number;
}

export default function CounterTimeline({
  bookings = [],
  currentTimeStr = "12:00",
  bufferMinutes = 15,
}: CounterTimelineProps) {
  const [nowMinuteOffset, setNowMinuteOffset] = useState<number>(0);

  // Pool Day runs from 9:00 AM (540 min from midnight) to 11:00 PM (1380 min from midnight)
  // Total span = 14 hours = 840 minutes
  const DAY_START_MINUTES = 9 * 60;   // 540 (9:00 AM)
  const DAY_END_MINUTES = 23 * 60;    // 1380 (11:00 PM)
  const TOTAL_MINUTES = DAY_END_MINUTES - DAY_START_MINUTES; // 840 mins

  // Time conversion helper
  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  useEffect(() => {
    const updateNow = () => {
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();
      const clamped = Math.max(
        DAY_START_MINUTES,
        Math.min(DAY_END_MINUTES, currentMin)
      );
      setNowMinuteOffset(((clamped - DAY_START_MINUTES) / TOTAL_MINUTES) * 100);
    };

    updateNow();
    const interval = setInterval(updateNow, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Filter public vs private bookings
  const publicBookings = bookings.filter((b) => b.type === "PUBLIC");
  const privateBookings = bookings.filter((b) => b.type === "FAMILY");

  // Hourly markers 9:00 AM to 11:00 PM
  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0284C7] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Day Schedule &amp; Turnover Timeline
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Dual-lane: Public 9 AM–4 PM • Private 4 PM–11 PM (15m buffer)
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#0284C7]" />
            <span>Public</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#7E22CE]" />
            <span>Private Family</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-amber-500 bg-amber-50/80" />
            <span>15m Turnover</span>
          </span>
        </div>
      </div>

      {/* Desktop & Tablet: Dual Horizontal Lanes */}
      <div className="hidden sm:block relative pt-6 pb-2 overflow-x-auto">
        <div className="min-w-[650px] relative">
          {/* Hour Labels */}
          <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 mb-2 px-1">
            {hours.map((h) => {
              const displayH = h > 12 ? h - 12 : h;
              const ampm = h >= 12 ? "PM" : "AM";
              return (
                <span key={h} className="text-center w-8">
                  {displayH}{ampm}
                </span>
              );
            })}
          </div>

          {/* Lane 1: Public Swimming Lane */}
          <div className="space-y-1 mb-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1">
              <span>Public Lane (9:00 AM – 4:00 PM)</span>
            </div>
            <div className="relative h-11 bg-slate-100/80 rounded-2xl overflow-hidden border border-slate-200/60">
              {/* Public active window 9 AM to 4 PM (540 to 960 mins) => 420 mins out of 840 = 50% width */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-sky-50/70 border-r-2 border-sky-300"
                style={{ width: "50%" }}
              />

              {/* Public Booking Blocks */}
              {publicBookings.map((b) => {
                const startM = parseTimeToMinutes(b.startTime);
                const endM = parseTimeToMinutes(b.endTime);
                const left = Math.max(0, ((startM - DAY_START_MINUTES) / TOTAL_MINUTES) * 100);
                const width = Math.max(3, ((endM - startM) / TOTAL_MINUTES) * 100);

                return (
                  <div
                    key={b.id}
                    className="absolute top-1 bottom-1 rounded-xl bg-[#0284C7] text-white px-2 flex items-center justify-between text-[11px] font-bold shadow-xs truncate"
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${b.customerName || "Public Swimmers"} (${b.guestCount} guests)`}
                  >
                    <span className="truncate">{b.customerName || "Public"}</span>
                    <span className="font-mono text-[10px] ml-1 shrink-0">{b.guestCount}p</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lane 2: Private Family Lane + 15m Buffers */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1">
              <span>Private Family Lane (4:00 PM – 11:00 PM)</span>
            </div>
            <div className="relative h-11 bg-slate-100/80 rounded-2xl overflow-hidden border border-slate-200/60">
              {/* Private active window 4 PM to 11 PM (50% to 100%) */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-purple-50/70 border-l-2 border-purple-300"
                style={{ width: "50%" }}
              />

              {/* 3:45 PM to 4:00 PM Pre-turnover Hatched Buffer */}
              <div
                className="absolute top-0 bottom-0 border border-dashed border-amber-400 bg-[repeating-linear-gradient(45deg,#fef3c7,#fef3c7_4px,#fffbeb_4px,#fffbeb_8px)] flex items-center justify-center text-[9px] font-bold text-amber-800"
                style={{
                  left: `${((945 - DAY_START_MINUTES) / TOTAL_MINUTES) * 100}%`,
                  width: `${(15 / TOTAL_MINUTES) * 100}%`,
                }}
                title="15m Filter & Clean Turnover (3:45 PM – 4:00 PM)"
              >
                <span className="sr-only">Turnover</span>
              </div>

              {/* Private Booking Blocks & Inter-session Buffers */}
              {privateBookings.map((b) => {
                const startM = parseTimeToMinutes(b.startTime);
                const endM = parseTimeToMinutes(b.endTime);
                const left = Math.max(0, ((startM - DAY_START_MINUTES) / TOTAL_MINUTES) * 100);
                const width = Math.max(3, ((endM - startM) / TOTAL_MINUTES) * 100);

                // 15-minute buffer following this private booking
                const bufferLeft = left + width;
                const bufferWidth = (bufferMinutes / TOTAL_MINUTES) * 100;

                return (
                  <React.Fragment key={b.id}>
                    <div
                      className="absolute top-1 bottom-1 rounded-xl bg-[#7E22CE] text-white px-2 flex items-center justify-between text-[11px] font-bold shadow-xs truncate z-10"
                      style={{ left: `${left}%`, width: `${width}%` }}
                      title={`${b.customerName || "Family Session"} (${b.guestCount} guests)`}
                    >
                      <span className="truncate">{b.customerName || "Private Family"}</span>
                      <span className="font-mono text-[10px] ml-1 shrink-0">{b.guestCount}p</span>
                    </div>

                    {/* Hatched Buffer Zone */}
                    {bufferLeft + bufferWidth <= 100 && (
                      <div
                        className="absolute top-1 bottom-1 rounded-lg border border-dashed border-amber-400 bg-[repeating-linear-gradient(45deg,#fef3c7,#fef3c7_4px,#fffbeb_4px,#fffbeb_8px)] z-0 flex items-center justify-center text-[8px] font-bold text-amber-800"
                        style={{ left: `${bufferLeft}%`, width: `${bufferWidth}%` }}
                        title={`${bufferMinutes}m Filter & Clean Buffer`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Real-time Vertical "Now" Indicator Line */}
          <div
            className="absolute top-5 bottom-0 w-0.5 bg-rose-500 z-20 pointer-events-none transition-all duration-500"
            style={{ left: `${nowMinuteOffset}%` }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1 -mt-1 shadow-xs" />
          </div>
        </div>
      </div>

      {/* Mobile: Sequential Grouped List ("Public Today" & "Private Today") */}
      <div className="sm:hidden space-y-4 pt-1">
        {/* Public Group */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-sky-800 uppercase tracking-wide block">
            Public Sessions Today (9:00 AM – 4:00 PM)
          </span>
          {publicBookings.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No public bookings scheduled.</p>
          ) : (
            publicBookings.map((b) => (
              <div
                key={b.id}
                className="p-3 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 block">{b.customerName || "Public Swimmers"}</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {formatSlotTime(b.startTime)} – {formatSlotTime(b.endTime)}
                  </span>
                </div>
                <span className="font-mono font-bold text-[#0284C7] bg-white px-2 py-0.5 rounded-full">
                  {b.guestCount} Guests
                </span>
              </div>
            ))
          )}
        </div>

        {/* Private Group */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-purple-800 uppercase tracking-wide block">
            Private Family Sessions Today (4:00 PM – 11:00 PM)
          </span>
          {privateBookings.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No family sessions scheduled.</p>
          ) : (
            privateBookings.map((b) => (
              <div
                key={b.id}
                className="p-3 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 block">{b.customerName || "Family Session"}</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {formatSlotTime(b.startTime)} – {formatSlotTime(b.endTime)}
                  </span>
                </div>
                <span className="font-mono font-bold text-purple-700 bg-white px-2 py-0.5 rounded-full">
                  {b.guestCount} Guests
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
