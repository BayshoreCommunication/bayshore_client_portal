"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";
import StatusPill from "@/component/shared/StatusPill";
import { useLocalStore } from "@/lib/local-store";
import { ordinal, specialists, type CallRequest } from "./data";

const INITIAL_REQUESTS: CallRequest[] = [];

const Calendar = () => {
  const [requests] = useLocalStore("bayshore_call_requests", INITIAL_REQUESTS);

  return (
    <>
      <div>
        <div className="font-serif text-[26px] font-bold text-[#0b1a26]">Calendar</div>
        <div className="mt-1 text-[13px] text-[#657787]">Book time with the right specialist based on what you need help with.</div>
      </div>

      <div className="mx-auto mt-5 grid w-full max-w-260 grid-cols-3 gap-5 self-center">
        {specialists.map((specialist) => (
          <Link
            key={specialist.slug}
            href={`/calendar/${specialist.slug}`}
            className="block cursor-pointer rounded-2xl border-[1.5px] border-[#dbe3de] bg-white p-7 text-inherit no-underline hover:border-[#0b4d4a] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]"
          >
            <div
              className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-full text-[19px] font-bold text-white"
              style={{ background: specialist.color }}
            >
              {specialist.avatar}
            </div>
            <div className="text-lg font-bold text-[#0d1e2c]">{specialist.name}</div>
            <div className="mt-0.5 text-[13.5px] text-[#7a8e9b]">{specialist.role}</div>
            <div className="mt-3 inline-block rounded-xl bg-[#eff6ff] px-3 py-1.25 text-[11.5px] font-bold text-[#2563eb]">
              {specialist.category}
            </div>
            <div className="mt-3.5 text-[13px] leading-[1.55] text-[#7a8e9b]">{specialist.blurb}</div>
          </Link>
        ))}
      </div>

      <div className="mx-auto mt-6 w-full max-w-260 self-center rounded-lg border border-[#dbe3de] bg-white px-5 py-4.5">
        <div className="mb-3.5">
          <div className="text-sm font-bold text-[#0d1e2c]">Your Requests</div>
          <div className="mt-0.5 text-[11px] text-[#728492]">Status of the calls you&apos;ve booked</div>
        </div>

        {requests.length === 0 ? (
          <div className="flex items-center gap-2 py-2 text-[12.5px] text-[#9aacb8] italic">
            <CalendarClock size={15} strokeWidth={2} /> You haven&apos;t requested any calls yet.
          </div>
        ) : (
          requests
            .slice()
            .reverse()
            .map((request) => (
              <div className="border-b border-[#eef3ef] py-3.5 last:border-b-0 last:pb-0" key={request.id}>
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-[#f6f2eb]">
                    <div className="text-[9.5px] font-bold tracking-[0.4px] text-[#b91c1c]">{request.day.toUpperCase()}</div>
                    <div className="text-[17px] leading-[1.1] font-bold text-[#17242f]">{request.date}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-bold text-[#17242f]">Call with {request.specialistName}</div>
                    <div className="mt-0.5 text-[11.5px] text-[#8496a3]">
                      {request.day} the {ordinal(Number(request.date))}
                      {request.time ? ` at ${request.time}` : ""}
                    </div>
                  </div>
                  <StatusPill status={request.status === "pending" ? "waiting" : request.status} />
                </div>
                {request.reassignedFrom ? (
                  <div className="mt-2 text-[11px] text-[#8496a3] italic">
                    This call was reassigned from <b>{request.reassignedFrom}</b> to <b>{request.specialistName}</b>.
                    {request.reassignNote ? (
                      <>
                        <br />“{request.reassignNote}”
                      </>
                    ) : null}
                  </div>
                ) : null}
                {request.rescheduledFrom ? (
                  <div className="mt-1 text-[11px] text-[#8496a3] italic">Rescheduled from {request.rescheduledFrom}.</div>
                ) : null}
              </div>
            ))
        )}
      </div>
    </>
  );
};

export default Calendar;
