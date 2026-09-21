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
          className="breadcrumb-link"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14, textDecoration: "none" }}
        >
          <ArrowLeft size={14} strokeWidth={2.5} /> Choose someone else
        </Link>

        {confirmation ? (
          <div className="book-call-confirmed">
            <CheckCircle2 size={38} strokeWidth={1.75} color="#16a34a" />
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0d1e2c", marginTop: 10 }}>
              You&apos;re scheduled with {firstName}!
            </div>
            <div className="dash-pending-sub" style={{ marginTop: 6 }}>
              {confirmation}
            </div>
            <Link href="/calendar" className="btn-view-report" style={{ marginTop: 18, display: "inline-block", textDecoration: "none" }}>
              View your requests
            </Link>
          </div>
        ) : (
          <div className="book-call-card">
            <Link href="/calendar" className="book-call-close" aria-label="Close" style={{ display: "flex" }}>
              <X size={24} strokeWidth={2} />
            </Link>

            <div className="book-call-host-row">
              <div className="book-call-avatar" style={{ background: specialist.color }}>
                {specialist.avatar}
                <span className="book-call-online-dot" />
              </div>
              <div>
                <div className="book-call-name">{specialist.name}</div>
                <div className="book-call-lastseen">{specialist.role}</div>
              </div>
            </div>

            <div className="book-call-greeting" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Hand size={20} strokeWidth={2} color="#c8973a" /> {specialist.greeting}
            </div>
            <div className="book-call-subtext">{specialist.subtext}</div>

            <div className="book-call-day-legend">
              <span>
                <span className="legend-dot" style={{ background: "#0b4d4a" }} /> Available
              </span>
              <span>
                <span className="legend-dot" style={{ background: "#dbe3de" }} /> Unavailable
              </span>
            </div>

            <div className="book-call-days">
              {specialist.days.map((day) => (
                <button
                  key={day.date}
                  className={`book-call-day${day.available ? "" : " unavailable"}${
                    day.date === selectedDate ? " selected" : ""
                  }`}
                  disabled={!day.available}
                  onClick={() => setSelectedDate(day.date)}
                >
                  <span className="bcd-dow">{day.dow}</span>
                  <span className="bcd-date">{day.date}</span>
                </button>
              ))}
            </div>

            <div className="book-call-time-label">Select a time</div>
            <div className="time-picker-row">
              <select className="time-picker-select" value={hour} onChange={(event) => setHour(event.target.value)}>
                {HOURS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <span className="time-picker-colon">:</span>
              <select className="time-picker-select" value={minute} onChange={(event) => setMinute(event.target.value)}>
                {MINUTES.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <div className="ampm-toggle">
                {(["AM", "PM"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`ampm-btn${period === option ? " selected" : ""}`}
                    onClick={() => setPeriod(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="book-call-schedule-btn"
              onClick={schedule}
              disabled={!selectedDate}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
            >
              <Phone size={18} strokeWidth={2.5} /> SCHEDULE A CALL
            </button>

            <div className="book-call-footer">
              Powered by <b>BayShore Scheduling</b>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default BookCall;
