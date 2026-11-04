"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, ChevronLeft, ChevronRight, Clock, Globe, Loader2, Video } from "lucide-react";
import type { BookedCall, BookingInfo, BookingResult } from "@/app/actions/booking";

// Picking a time for the onboarding call: the free times on the team's booking calendar, by day,
// in the client's own time zone. The time picked is booked straight away (a Meet link and
// Google's invitation come with it). With no booking calendar set up, `fallback` is shown — the
// Google booking page.

type Props = {
  load: () => Promise<BookingResult<BookingInfo>>;
  book: (start: string) => Promise<BookingResult<BookedCall>>;
  onBooked: (call: BookedCall) => void;
  // Whether the times are being shown, or the fallback: the page around it may want to know.
  onMode?: (mode: "slots" | "fallback") => void;
  fallback: ReactNode;
};

const LOCALE = "en-US";
const dayKeyOf = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
const timeOf = (date: Date) => new Intl.DateTimeFormat(LOCALE, { hour: "numeric", minute: "2-digit" }).format(date);
export const callTimeOf = (iso: string) =>
  `${new Intl.DateTimeFormat(LOCALE, { weekday: "long", month: "long", day: "numeric" }).format(new Date(iso))} at ${timeOf(new Date(iso))}`;

const DAYS_SHOWN = 5;

const BookingSlots = ({ load, book, onBooked, onMode, fallback }: Props) => {
  const [info, setInfo] = useState<BookingResult<BookingInfo> | null>(null);
  const [reloads, setReloads] = useState(0);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [first, setFirst] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef({ load, onMode });
  useEffect(() => {
    latest.current = { load, onMode };
  });

  useEffect(() => {
    let live = true;
    void latest.current.load().then((result) => {
      if (!live) return;
      setInfo(result);
      latest.current.onMode?.(result.ok && result.data.available && result.data.slots?.length ? "slots" : "fallback");
    });
    return () => {
      live = false;
    };
  }, [reloads]);

  // The free times, by day.
  const days = useMemo(() => {
    const slots = info?.ok && info.data.available ? (info.data.slots ?? []) : [];
    const byDay = new Map<string, { date: Date; times: string[] }>();
    for (const slot of slots) {
      const date = new Date(slot);
      const key = dayKeyOf(date);
      const day = byDay.get(key);
      if (day) day.times.push(slot);
      else byDay.set(key, { date, times: [slot] });
    }
    return [...byDay.entries()].map(([key, day]) => ({ key, ...day }));
  }, [info]);

  const timeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, " "), []);

  if (!info) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-2.5 text-[13px] text-[#5b6a72]">
        <Loader2 className="size-5 animate-spin" /> Finding open times…
      </div>
    );
  }

  if (!info.ok || !info.data.available || !days.length) return <>{fallback}</>;

  const current = days.find((day) => day.key === dayKey) ?? days[0];
  const visible = days.slice(first, first + DAYS_SHOWN);

  const confirm = async () => {
    if (!picked) return;
    setBooking(true);
    setError(null);
    const result = await book(picked);
    setBooking(false);
    if (!result.ok) {
      setError(result.error);
      setPicked(null);
      setReloads((count) => count + 1);
      return;
    }
    onBooked(result.data);
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-b border-[#e1e7e3] px-6 py-4">
        <div>
          <p className="text-[15px] font-semibold text-[#16212a]">Pick a time for your call</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12.5px] text-[#5b6a72]">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> {info.data.duration} min
            </span>
            <span className="inline-flex items-center gap-1">
              <Video className="size-3.5" /> Google Meet
            </span>
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-[12px] text-[#5b6a72]">
          <Globe className="size-3.5" /> {timeZone}
        </span>
      </div>

      {/* The days with open times. */}
      <div className="flex items-center gap-1.5 px-4 pt-4">
        <button
          type="button"
          aria-label="Earlier days"
          disabled={first === 0}
          onClick={() => setFirst((index) => Math.max(0, index - DAYS_SHOWN))}
          className="grid size-8 flex-none cursor-pointer place-items-center rounded-full text-[#16212a] hover:bg-[#f0f3f1] disabled:cursor-default disabled:opacity-25"
        >
          <ChevronLeft className="size-4.5" />
        </button>
        <div className="grid min-w-0 flex-1 grid-cols-5 gap-1.5">
          {visible.map((day) => {
            const chosen = day.key === current.key;
            return (
              <button
                key={day.key}
                type="button"
                aria-pressed={chosen}
                onClick={() => {
                  setDayKey(day.key);
                  setPicked(null);
                }}
                className={`flex cursor-pointer flex-col items-center rounded-xl border px-1 py-2 transition-colors ${
                  chosen ? "border-[#16212a] bg-[#16212a] text-white" : "border-[#e1e7e3] bg-white text-[#16212a] hover:border-[#b9c6bf]"
                }`}
              >
                <span className={`text-[10.5px] font-semibold tracking-wide uppercase ${chosen ? "text-white/70" : "text-[#7a8a92]"}`}>
                  {new Intl.DateTimeFormat(LOCALE, { weekday: "short" }).format(day.date)}
                </span>
                <span className="text-[19px] leading-tight font-semibold">{day.date.getDate()}</span>
                <span className={`text-[10.5px] ${chosen ? "text-white/70" : "text-[#7a8a92]"}`}>{new Intl.DateTimeFormat(LOCALE, { month: "short" }).format(day.date)}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-label="Later days"
          disabled={first + DAYS_SHOWN >= days.length}
          onClick={() => setFirst((index) => Math.min(days.length - 1, index + DAYS_SHOWN))}
          className="grid size-8 flex-none cursor-pointer place-items-center rounded-full text-[#16212a] hover:bg-[#f0f3f1] disabled:cursor-default disabled:opacity-25"
        >
          <ChevronRight className="size-4.5" />
        </button>
      </div>

      {/* That day's open times. */}
      <div className="px-6 pt-4 pb-5">
        <p className="mb-2.5 text-[12.5px] font-semibold text-[#16212a]">
          {new Intl.DateTimeFormat(LOCALE, { weekday: "long", month: "long", day: "numeric" }).format(current.date)}
        </p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.key}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-3 gap-2 max-[480px]:grid-cols-2"
          >
            {current.times.map((slot) => (
              <button
                key={slot}
                type="button"
                aria-pressed={picked === slot}
                onClick={() => setPicked(slot)}
                className={`h-10.5 cursor-pointer rounded-lg border text-[13.5px] font-semibold transition-colors ${
                  picked === slot ? "border-[#2f7d5b] bg-[#2f7d5b] text-white" : "border-[#cfdcd6] bg-white text-[#2f5f4a] hover:border-[#2f7d5b] hover:bg-[#f2f8f5]"
                }`}
              >
                {timeOf(new Date(slot))}
              </button>
            ))}
          </motion.div>
        </AnimatePresence>
        {error ? (
          <p role="alert" className="mt-3 text-[12.5px] font-medium text-[#b42318]">
            {error}
          </p>
        ) : null}
      </div>

      {/* The time picked, and booking it. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e1e7e3] bg-[#f8faf9] px-6 py-3.5">
        <p className="text-[13px] text-[#5b6a72]">
          {picked ? (
            <>
              <b className="font-semibold text-[#16212a]">{callTimeOf(picked)}</b> · {info.data.duration} min
            </>
          ) : (
            "Pick a time above."
          )}
        </p>
        <button
          type="button"
          disabled={!picked || booking}
          onClick={confirm}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#16212a] px-4.5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#24323d] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {booking ? <Loader2 className="size-4 animate-spin" /> : <CalendarCheck className="size-4" />}
          {booking ? "Booking…" : "Confirm booking"}
        </button>
      </div>
    </div>
  );
};

export default BookingSlots;
