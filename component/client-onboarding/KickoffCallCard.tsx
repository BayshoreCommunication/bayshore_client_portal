"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { updateMyOnboardingAction } from "@/app/actions/onboarding";
import { BOOKING_URL } from "@/lib/booking";

// Over the onboarding form: booking the onboarding call. The call matters more than the form —
// a marketing specialist fills in what's missing with the client on it — so a client who hasn't
// booked can do it here, at any time: from the reminder emails (which open it, `open`), or after
// "I'll book later" at the end of signing up. Google's calendar can't tell this page a time was
// booked, so the client says so ("I've booked my call"), and the backend emails a confirmation.
const KickoffCallCard = ({ booked: bookedAtFirst, formDone, open: openAtFirst }: { booked: boolean; formDone: boolean; open: boolean }) => {
  const [booked, setBooked] = useState(bookedAtFirst);
  const [open, setOpen] = useState(openAtFirst && !bookedAtFirst);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const card = useRef<HTMLDivElement>(null);

  // Arriving from an email's "Book your onboarding call", the calendar is what they came for.
  useEffect(() => {
    if (openAtFirst && !bookedAtFirst) card.current?.scrollIntoView({ block: "start" });
  }, [openAtFirst, bookedAtFirst]);

  const confirm = async () => {
    setSaving(true);
    setError(null);
    const result = await updateMyOnboardingAction({ answers: { kickoffCall: { booked: true } } });
    setSaving(false);
    if (!result.ok) return setError(result.error || "Couldn't save that. Please try again.");
    setBooked(true);
    setOpen(false);
  };

  // Booked: nothing left to say here.
  if (booked) return null;

  return (
    <div ref={card} className="mb-5 scroll-mt-24 overflow-hidden rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-center gap-4 px-5 py-4.5">
        <span className="grid size-11 flex-none place-items-center rounded-xl bg-[#e8effd] text-[#2f5fd8]">
          <CalendarClock className="size-5.5" strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1 basis-64">
          <p className="text-[15px] font-semibold text-[#0b1522]">Book your onboarding call</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-[#6b7280]">
            {formDone
              ? "Thank you for your answers. The last step is a short call: pick a time that suits you."
              : "Short on time? You don't need to finish this form first. Book your call, and a marketing specialist will fill in the rest with you."}
          </p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((shown) => !shown)}
          className="cursor-pointer rounded-lg bg-[#0b1522] px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#1f2a3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5fd8]"
        >
          {open ? "Hide calendar" : "Pick a time"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div key="calendar" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="overflow-hidden">
            <div className="relative h-160 border-t border-[#eceef2] bg-white max-[640px]:h-150">
              {loaded ? null : <p className="absolute inset-0 grid place-items-center text-[13px] text-[#6b7280]">Loading the calendar…</p>}
              <iframe src={`${BOOKING_URL}?gv=true`} title="Book your onboarding call" onLoad={() => setLoaded(true)} className={`relative block size-full border-0 transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eceef2] bg-[#f7f8fa] px-5 py-3.5">
              <a href={BOOKING_URL} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#2f5fd8] hover:underline">
                Can&apos;t see the calendar? Open it in a new tab <ExternalLink className="size-3.5" />
              </a>
              <div className="flex items-center gap-3">
                {error ? (
                  <p role="alert" className="text-[12.5px] font-medium text-[#b42318]">
                    {error}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={confirm}
                  disabled={saving}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#15803d] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#166534] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5fd8] disabled:cursor-wait disabled:opacity-70"
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  {saving ? "Saving…" : "I've booked my call"}
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default KickoffCallCard;
