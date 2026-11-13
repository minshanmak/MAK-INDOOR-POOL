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
    <div className="bg-white rounded-[12px] p-4 sm:p-5 border-[0.5px] border-slate-200 shadow-xs space-y-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[8px] bg-sky-50 text-[#0284C7] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">
              Day schedule and turnover timeline
            </h3>
            <p className="text-[11px] text-slate-500 font-normal">
              Dual horizontal lanes: Public 9 AM–4 PM • Private 4 PM–11 PM (15m buffer)
            </p>
          </div>
        </div>

        {/* Legend (Restrained palette, text label paired with indicators) */}
        <div className="flex items-center gap-2.5 text-[10px] font-semibold text-slate-600">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-[4px] bg-[#0284C7]" />
            <span>Public</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-[4px] bg-[#7E22CE]" />
            <span>Private family</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-[4px] border border-dashed border-amber-500 bg-amber-50" />
            <span>15m turnover buffer</span>
          </span>
        </div>
      </div>

      {/* Desktop & Tablet: Dual Horizontal Lanes (Reference Pattern 2: Court Reserve & Figma dashboard calendar) */}
      <div className="hidden sm:block relative pt-4 pb-2 overflow-x-auto">
        <div className="min-w-[650px] relative">
          {/* Hour Labels */}
          <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 mb-1.5 px-1">
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

          {/* Lane 1: Public Swimming Lane (9:00 AM – 4:00 PM) */}
          <div className="space-y-1 mb-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1">
              <span>Public lane (9:00 AM – 4:00 PM)</span>
            </div>
            <div className="relative h-10 bg-slate-100 rounded-[10px] overflow-hidden border-[0.5px] border-slate-200">
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
                    className="absolute top-1 bottom-1 rounded-[6px] bg-[#0284C7] text-white px-2 flex items-center justify-between text-[11px] font-semibold shadow-2xs truncate"
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

          {/* Lane 2: Private Family Lane (4:00 PM – 11:00 PM) + Hatched 15m Buffers */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1">
              <span>Private family lane (4:00 PM – 11:00 PM)</span>
            </div>
            <div className="relative h-10 bg-slate-100 rounded-[10px] overflow-hidden border-[0.5px] border-slate-200">
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
                title="15m Filter and clean turnover (3:45 PM – 4:00 PM)"
              >
                <span className="sr-only">Turnover</span>
              </div>

              {/* Private Booking Blocks & Inter-session Buffers */}
              {privateBookings.map((b) => {
                const startM = parseTimeToMinutes(b.startTime);
                const endM = parseTimeToMinutes(b.endTime);
                const left = Math.max(0, ((startM - DAY_START_MINUTES) / TOTAL_MINUTES) * 100);
                const width = Math.max(3, ((endM - startM) / TOTAL_MINUTES) * 100);

                // Hatched buffer before this private session (if starting at or after 4:15 PM)
                const bufferStartM = startM - bufferMinutes;
                const bufferLeft = Math.max(0, ((bufferStartM - DAY_START_MINUTES) / TOTAL_MINUTES) * 100);
                const bufferWidth = (bufferMinutes / TOTAL_MINUTES) * 100;

                return (
                  <React.Fragment key={b.id}>
                    {/* Hatched turnover buffer block */}
                    {startM > 16 * 60 && (
                      <div
                        className="absolute top-0 bottom-0 border border-dashed border-amber-400 bg-[repeating-linear-gradient(45deg,#fef3c7,#fef3c7_4px,#fffbeb_4px,#fffbeb_8px)] flex items-center justify-center"
                        style={{ left: `${bufferLeft}%`, width: `${bufferWidth}%` }}
                        title={`15m Filter and clean buffer before ${b.customerName || "Private"}`}
                      >
                        <span className="sr-only">Buffer</span>
                      </div>
                    )}

                    {/* Private booking block */}
                    <div
                      className="absolute top-1 bottom-1 rounded-[6px] bg-[#7E22CE] text-white px-2.5 flex items-center justify-between text-[11px] font-semibold shadow-2xs truncate"
                      style={{ left: `${left}%`, width: `${width}%` }}
                      title={`Private: ${b.customerName || "Family Session"} (${b.guestCount} guests)`}
                    >
                      <span className="truncate">{b.customerName || "Private session"}</span>
                      <span className="font-mono text-[10px] ml-1 shrink-0">{b.guestCount}p</span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Live "Now" Line updating every minute */}
          <div
            className="absolute top-6 bottom-0 w-0.5 bg-rose-500 z-20 pointer-events-none transition-all duration-300"
            style={{ left: `${nowMinuteOffset}%` }}
          >
            <div className="absolute -top-1.5 -translate-x-1/2 w-3 h-3 bg-rose-500 rounded-full border border-white shadow-xs" />
            <span className="absolute -top-5 -translate-x-1/2 text-[9px] font-bold font-mono text-rose-600 bg-white px-1 py-0.5 rounded shadow-2xs whitespace-nowrap">
              Now
            </span>
          </div>
        </div>
      </div>

      {/* Phone: Responsive Grouped List ("Public today" and "Private today") */}
      <div className="block sm:hidden space-y-3 pt-2">
        <div>
          <h4 className="text-xs font-bold text-sky-900 mb-1.5 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#0284C7]" strokeWidth={1.75} />
            <span>Public today (9:00 AM – 4:00 PM)</span>
          </h4>
          {publicBookings.length === 0 ? (
            <p className="text-[11px] text-slate-400 p-2.5 bg-slate-50 rounded-[8px]">
              No advance public bookings today. Shared access available for walk ins.
            </p>
          ) : (
            <div className="space-y-1.5">
              {publicBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-2.5 rounded-[8px] bg-sky-50 border-[0.5px] border-sky-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{b.customerName || "Public Swimmers"}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatSlotTime(b.startTime)} – {formatSlotTime(b.endTime)}
                    </span>
                  </div>
                  <span className="font-bold text-[#0284C7] text-xs">{b.guestCount} guests</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-xs font-bold text-purple-900 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-700" strokeWidth={1.75} />
            <span>Private today (4:00 PM – 11:00 PM)</span>
          </h4>
          {privateBookings.length === 0 ? (
            <p className="text-[11px] text-slate-400 p-2.5 bg-slate-50 rounded-[8px]">
              No private sessions booked for this evening.
            </p>
          ) : (
            <div className="space-y-1.5">
              {privateBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-2.5 rounded-[8px] bg-purple-50 border-[0.5px] border-purple-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{b.customerName || "Family Session"}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatSlotTime(b.startTime)} – {formatSlotTime(b.endTime)} (15m buffer included)
                    </span>
                  </div>
                  <span className="font-bold text-purple-700 text-xs">{b.guestCount} guests</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
