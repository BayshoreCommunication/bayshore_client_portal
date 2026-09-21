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
        <div className="page-title">Calendar</div>
        <div className="page-desc">Book time with the right specialist based on what you need help with.</div>
      </div>

      <div className="specialist-grid">
        {specialists.map((specialist) => (
          <Link
            key={specialist.slug}
            href={`/calendar/${specialist.slug}`}
            className="specialist-card"
            style={{ textDecoration: "none", color: "inherit", display: "block" }}
          >
            <div className="specialist-avatar" style={{ background: specialist.color }}>
              {specialist.avatar}
            </div>
            <div className="specialist-name">{specialist.name}</div>
            <div className="specialist-role">{specialist.role}</div>
            <div className="specialist-category-tag">{specialist.category}</div>
            <div className="specialist-desc">{specialist.blurb}</div>
          </Link>
        ))}
      </div>

      <div className="side-card" style={{ maxWidth: 1040, width: "100%", margin: "24px auto 0", alignSelf: "center" }}>
        <div className="side-header">
          <div className="side-title">Your Requests</div>
          <div className="side-sub">Status of the calls you&apos;ve booked</div>
        </div>

        {requests.length === 0 ? (
          <div
            className="call-request-empty"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <CalendarClock size={15} strokeWidth={2} /> You haven&apos;t requested any calls yet.
          </div>
        ) : (
          requests
            .slice()
            .reverse()
            .map((request) => (
              <div className="meeting-item" key={request.id}>
                <div className="meeting-item-top">
                  <div className="call-request-date-badge">
                    <div className="crd-dow">{request.day.toUpperCase()}</div>
                    <div className="crd-date">{request.date}</div>
                  </div>
                  <div className="meeting-info">
                    <div className="meeting-client">Call with {request.specialistName}</div>
                    <div className="meeting-meta">
                      {request.day} the {ordinal(Number(request.date))}
                      {request.time ? ` at ${request.time}` : ""}
                    </div>
                  </div>
                  <StatusPill status={request.status === "pending" ? "waiting" : request.status} />
                </div>
                {request.reassignedFrom ? (
                  <div className="reassigned-note" style={{ marginLeft: 0, marginTop: 8 }}>
                    This call was reassigned from <b>{request.reassignedFrom}</b> to <b>{request.specialistName}</b>.
                    {request.reassignNote ? (
                      <>
                        <br />“{request.reassignNote}”
                      </>
                    ) : null}
                  </div>
                ) : null}
                {request.rescheduledFrom ? (
                  <div className="reassigned-note" style={{ marginLeft: 0, marginTop: 4 }}>
                    Rescheduled from {request.rescheduledFrom}.
                  </div>
                ) : null}
              </div>
            ))
        )}
      </div>
    </>
  );
};

export default Calendar;
