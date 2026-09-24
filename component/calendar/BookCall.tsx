"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Hand, Phone, X } from "lucide-react";
import { useSessionUser } from "@/component/shared/SessionUser";
import { useLocalStore } from "@/lib/local-store";
import { findSpecialist, ordinal, type CallRequest } from "./data";

const INITIAL_REQUESTS: CallRequest[] = [];
const HOURS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const MINUTES = ["00", "15", "30", "45"];

const BookCall = ({ slug }: { slug: string }) => {
  const specialist = findSpecialist(slug);
  const { name } = useSessionUser();
  const [, setRequests] = useLocalStore("bayshore_call_requests", INITIAL_REQUESTS);

  const firstAvailable = specialist?.days.find((day) => day.available)?.date ?? null;
  const [selectedDate, setSelectedDate] = useState<string | null>(firstAvailable);
  const [hour, setHour] = useState("9");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");
  const [confirmation, setConfirmation] = useState<string | null>(null);

  if (!specialist) notFound();

  const firstName = specialist.shortName ?? specialist.name.split(" ")[0];

  const schedule = () => {
    const day = specialist.days.find((entry) => entry.date === selectedDate);
    if (!day) return;
    const time = `${hour}:${minute} ${period}`;

    setRequests((previous) => [
      ...previous,
      {
        id: `req_${Date.now()}`,
        clientName: name,
        specialistName: specialist.name,
        specialistRole: specialist.role,
        day: day.dow,
        date: day.date,
        time,
        requestedAt: new Date().toISOString(),
        status: "pending",
      },
    ]);
    setConfirmation(`${day.dow} the ${ordinal(Number(day.date))} at ${time} · ${firstName} will confirm shortly.`);
  };

  return (
    <>
      <div>
        <Link
          href="/calendar"
          className="mb-3.5 inline-flex items-center gap-1.5 font-bold text-[#18232c] no-underline hover:underline"
        >
          <ArrowLeft size={14} strokeWidth={2.5} /> Choose someone else
        </Link>

        {confirmation ? (
          <div className="max-w-120 rounded-2xl border border-[#e5eae7] bg-white px-7 py-9 text-center">
            <CheckCircle2 size={38} strokeWidth={1.75} color="#16a34a" />
            <div className="mt-2.5 text-sm font-bold text-[#0d1e2c]">You&apos;re scheduled with {firstName}!</div>
            <div className="mt-1.5 text-[11px] text-[#7a8e9b]">{confirmation}</div>
            <Link
              href="/calendar"
              className="mt-4.5 inline-block cursor-pointer rounded-md bg-[#0d1e2e] px-4 py-2.25 text-[12.5px] font-bold whitespace-nowrap text-white no-underline"
            >
              View your requests
            </Link>
          </div>
        ) : (
          <div className="relative mx-auto mt-6 w-full max-w-260 self-center rounded-3xl border border-[#e5eae7] bg-white pt-16 pr-20 pb-12 pl-20 shadow-[0_12px_36px_rgba(0,0,0,0.09)]">
            <Link
              href="/calendar"
              className="absolute top-5.5 right-6.5 flex cursor-pointer border-none bg-none text-[26px] leading-none text-[#9aacb8] hover:text-[#556977]"
              aria-label="Close"
            >
              <X size={24} strokeWidth={2} />
            </Link>

            <div className="mb-7 flex items-center gap-4.5">
              <div
                className="relative flex h-17 w-17 shrink-0 items-center justify-center rounded-full text-[22px] font-bold text-white"
                style={{ background: specialist.color }}
              >
                {specialist.avatar}
                <span className="absolute right-0.5 bottom-0.5 h-4 w-4 rounded-full border-[3px] border-white bg-[#16a34a]" />
              </div>
              <div>
                <div className="text-[22px] font-bold text-[#0d1e2c]">{specialist.name}</div>
                <div className="mt-0.75 text-sm text-[#9aacb8]">{specialist.role}</div>
              </div>
            </div>

            <div className="mb-3 flex items-center gap-2 text-2xl font-bold text-[#0d1e2c]">
              <Hand size={20} strokeWidth={2} color="#c8973a" /> {specialist.greeting}
            </div>
            <div className="mb-9 max-w-[90%] text-base leading-[1.65] text-[#7a8e9b]">{specialist.subtext}</div>

            <div className="mb-4.5 flex gap-5 text-[12.5px] text-[#7a8e9b]">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2.25 w-2.25 rounded-full" style={{ background: "#0b4d4a" }} /> Available
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2.25 w-2.25 rounded-full" style={{ background: "#dbe3de" }} /> Unavailable
              </span>
            </div>

            <div className="mb-9 grid grid-cols-7 gap-3">
              {specialist.days.map((day) => {
                const selected = day.date === selectedDate;
                return (
                  <button
                    key={day.date}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-[1.5px] px-1.5 py-5.5 ${
                      !day.available
                        ? "cursor-not-allowed border-[#eef2f0] bg-[#f4f7f5] opacity-55"
                        : selected
                          ? "cursor-pointer border-2 border-[#0b4d4a] bg-white"
                          : "cursor-pointer border-[#dbe3de] bg-white hover:border-[#9aacb8]"
                    }`}
                    disabled={!day.available}
                    onClick={() => setSelectedDate(day.date)}
                  >
                    <span className={`text-[15px] ${!day.available ? "text-[#b7c2cb]" : "text-[#384955]"}`}>{day.dow}</span>
                    <span className={`text-[26px] font-bold ${!day.available ? "text-[#b7c2cb]" : "text-[#17242f]"}`}>{day.date}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-7 mb-3 text-[13px] font-bold text-[#0d1e2c]">Select a time</div>
            <div className="mb-7.5 flex items-center gap-2.5">
              <select
                className="min-w-19.5 cursor-pointer rounded-[10px] border-[1.5px] border-[#dbe3de] bg-white px-4 py-3 text-base font-semibold text-[#17242f]"
                value={hour}
                onChange={(event) => setHour(event.target.value)}
              >
                {HOURS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <span className="text-lg font-bold text-[#384955]">:</span>
              <select
                className="min-w-19.5 cursor-pointer rounded-[10px] border-[1.5px] border-[#dbe3de] bg-white px-4 py-3 text-base font-semibold text-[#17242f]"
                value={minute}
                onChange={(event) => setMinute(event.target.value)}
              >
                {MINUTES.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <div className="ml-2 flex overflow-hidden rounded-[10px] border-[1.5px] border-[#dbe3de]">
                {(["AM", "PM"] as const).map((option, index) => (
                  <button
                    key={option}
                    type="button"
                    className={`cursor-pointer border-none px-4.5 py-3 text-sm font-bold ${
                      index === 0 ? "border-r-[1.5px] border-r-[#dbe3de]" : ""
                    } ${period === option ? "bg-[#0b4d4a] text-white" : "bg-white text-[#384955]"}`}
                    onClick={() => setPeriod(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="mb-6 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border-none bg-[#0b4d4a] py-5.5 text-[17px] font-extrabold tracking-[0.6px] text-white hover:bg-[#08403d]"
              onClick={schedule}
              disabled={!selectedDate}
            >
              <Phone size={18} strokeWidth={2.5} /> SCHEDULE A CALL
            </button>

            <div className="border-t border-[#eef2f0] pt-5 text-center text-sm text-[#9aacb8]">
              Powered by <b className="text-[#556977]">BayShore Scheduling</b>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default BookCall;
