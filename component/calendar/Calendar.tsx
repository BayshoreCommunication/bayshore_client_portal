"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarCheck2,
  CalendarClock,
  CalendarX2,
  Check,
  ChevronDown,
  CircleHelp,
  Clock,
  MapPin,
  Rocket,
  UserRound,
  Users,
  Video,
  X,
} from "lucide-react";
import type { Meeting, MeetingsData } from "@/app/actions/meetings";

// The client's meetings with BayShore: the next one up top, then every one to come and every one
// gone by — each with its time, who is on it, the Meet link and what it is about. Colours as the
// team's calendar: upcoming yellow, done green, missed red.

type Status = "live" | "upcoming" | "done" | "missed";

const STATUS: Record<Status, { label: string; color: string; soft: string; text: string }> = {
  live: { label: "Happening now", color: "#2f5fd8", soft: "#e8effd", text: "#1d4ed8" },
  upcoming: { label: "Upcoming", color: "#d4a106", soft: "#fef9c3", text: "#854d0e" },
  done: { label: "Done", color: "#16a34a", soft: "#dcfce7", text: "#15803d" },
  missed: { label: "Missed", color: "#dc2626", soft: "#fee2e2", text: "#b91c1c" },
};

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";

// "Now" is the visitor's clock, read in the browser only (times show in their own time zone).
let firstNow = 0;
const nowInBrowser = () => (firstNow ||= Date.now());
const subscribeNever = () => () => {};

const time = (iso: string) => new Date(iso).getTime();

const statusOf = (meeting: Meeting, now: number): Status => {
  if (time(meeting.start) <= now && now < time(meeting.end)) return "live";
  if (time(meeting.end) > now) return "upcoming";
  if (meeting.outcome) return meeting.outcome;
  const others = meeting.guests.filter((guest) => !guest.organizer);
  return meeting.response === "declined" || (others.length > 0 && others.every((guest) => guest.status === "declined")) ? "missed" : "done";
};

// ── Dates ────────────────────────────────────────────────────────────────────

const format = (iso: string, options: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleString("en-US", options);
const clock = (iso: string) => format(iso, { hour: "numeric", minute: "2-digit" });
const zone = () => new Intl.DateTimeFormat("en-US", { timeZoneName: "short" }).formatToParts(new Date()).find((part) => part.type === "timeZoneName")?.value ?? "";

const lengthOf = (meeting: Meeting) => {
  const minutes = Math.round((time(meeting.end) - time(meeting.start)) / 60000);
  if (minutes <= 0) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return minutes % 60 ? `${hours} h ${minutes % 60} min` : `${hours} h`;
};

const whenOf = (meeting: Meeting) =>
  meeting.allDay ? "All day" : `${clock(meeting.start)} – ${clock(meeting.end)}${lengthOf(meeting) ? ` · ${lengthOf(meeting)}` : ""}`;

// "in 3 days", "in 2 hours", "tomorrow"…
const fromNow = (iso: string, now: number) => {
  const minutes = Math.round((time(iso) - now) / 60000);
  if (minutes < 60) return `in ${Math.max(minutes, 1)} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `in ${hours} ${hours === 1 ? "hour" : "hours"}`;
  const days = Math.round(hours / 24);
  if (days === 1) return "tomorrow";
  if (days < 7) return `in ${days} days`;
  const weeks = Math.round(days / 7);
  return days < 30 ? `in ${weeks} ${weeks === 1 ? "week" : "weeks"}` : `in ${Math.round(days / 30)} months`;
};

const monthOf = (iso: string) => format(iso, { month: "long", year: "numeric" });

// ── Pieces ───────────────────────────────────────────────────────────────────

const StatusPill = ({ status }: { status: Status }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap" style={{ background: STATUS[status].soft, color: STATUS[status].text }}>
    <span className={`size-1.5 rounded-full ${status === "live" ? "animate-pulse" : ""}`} style={{ background: STATUS[status].color }} />
    {STATUS[status].label}
  </span>
);

const DateBlock = ({ iso, status }: { iso: string; status: Status }) => (
  <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl" style={{ background: STATUS[status].soft }}>
    <span className="text-[10px] font-bold tracking-wide uppercase" style={{ color: STATUS[status].text }}>
      {format(iso, { weekday: "short" })}
    </span>
    <span className="text-[20px] leading-none font-bold text-[#0b1522]">{format(iso, { day: "numeric" })}</span>
    <span className="text-[10px] font-medium text-[#6b7280]">{format(iso, { month: "short" })}</span>
  </div>
);

const ANSWERS: Record<string, { label: string; icon: typeof Check; color: string }> = {
  accepted: { label: "Going", icon: Check, color: "#15803d" },
  declined: { label: "Not going", icon: X, color: "#b91c1c" },
  tentative: { label: "Maybe", icon: CircleHelp, color: "#a16207" },
  needsAction: { label: "No answer yet", icon: CircleHelp, color: "#9ca3af" },
};

const MeetButton = ({ href, big }: { href: string; big?: boolean }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener"
    onClick={(event) => event.stopPropagation()}
    className={`inline-flex items-center gap-1.5 rounded-lg bg-[#16a34a] font-semibold whitespace-nowrap text-white no-underline transition-colors hover:bg-[#15803d] ${
      big ? "px-4.5 py-2.5 text-[13.5px]" : "px-3.5 py-2 text-[12.5px]"
    }`}
  >
    <Video className="size-4" strokeWidth={2.25} /> Join Google Meet
  </a>
);

const Detail = ({ icon: Icon, label, children }: { icon: typeof Clock; label: string; children: ReactNode }) => (
  <div className="flex gap-3">
    <Icon className="mt-0.5 size-4 shrink-0 text-[#9ca3af]" strokeWidth={2} />
    <div className="min-w-0 flex-1">
      <div className="text-[11px] font-semibold tracking-wide text-[#9ca3af] uppercase">{label}</div>
      <div className="mt-0.5 text-[13px] text-[#1f2937]">{children}</div>
    </div>
  </div>
);

// Everything about one meeting: when, where, who, and what it is about.
const MeetingDetails = ({ meeting, status }: { meeting: Meeting; status: Status }) => {
  const answer = meeting.response ? ANSWERS[meeting.response] : undefined;
  const open = status === "live" || status === "upcoming";
  return (
    <div className="grid gap-4 border-t border-[#f1f2f4] bg-[#fafbfc] px-5 py-4.5 sm:grid-cols-2">
      <div className="flex flex-col gap-3.5">
        <Detail icon={Clock} label="When">
          {format(meeting.start, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          <span className="block text-[#6b7280]">
            {whenOf(meeting)} {meeting.allDay ? "" : `(${zone()})`}
          </span>
        </Detail>
        {meeting.meetLink ? (
          <Detail icon={Video} label="Video call">
            {open ? (
              <MeetButton href={meeting.meetLink} />
            ) : (
              <a href={meeting.meetLink} target="_blank" rel="noopener" className="break-all text-[#2f5fd8] no-underline hover:underline">
                {meeting.meetLink.replace(/^https?:\/\//, "")}
              </a>
            )}
          </Detail>
        ) : null}
        {meeting.location ? (
          <Detail icon={MapPin} label="Location">
            {meeting.location}
          </Detail>
        ) : null}
        <Detail icon={UserRound} label="With">
          {meeting.host.name || meeting.host.email || "The BayShore team"}
          {meeting.host.name && meeting.host.email ? <span className="block text-[12px] text-[#6b7280]">{meeting.host.email}</span> : null}
        </Detail>
        {answer ? (
          <Detail icon={answer.icon} label="Your answer">
            <span style={{ color: answer.color }} className="font-medium">
              {answer.label}
            </span>
          </Detail>
        ) : null}
      </div>
      <div className="flex flex-col gap-3.5">
        {meeting.description ? (
          <Detail icon={CalendarClock} label="About this meeting">
            <p className="whitespace-pre-line text-[#374151]">{meeting.description}</p>
          </Detail>
        ) : null}
        {meeting.guests.length ? (
          <Detail icon={Users} label={`Guests · ${meeting.guests.length}`}>
            <ul className="mt-1 flex flex-col gap-1.5">
              {meeting.guests.map((guest) => {
                const said = ANSWERS[guest.status ?? "needsAction"] ?? ANSWERS.needsAction;
                const Icon = said.icon;
                return (
                  <li key={guest.email} className="flex items-center gap-2">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#eef0f3] text-[10.5px] font-bold text-[#4b5563] uppercase">
                      {(guest.name || guest.email)[0]}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px]">
                      {guest.name || guest.email}
                      {guest.organizer ? <span className="ml-1.5 text-[11px] text-[#9ca3af]">Host</span> : null}
                    </span>
                    <Icon className="size-3.5 shrink-0" strokeWidth={2.5} style={{ color: said.color }} aria-label={said.label} />
                  </li>
                );
              })}
            </ul>
          </Detail>
        ) : null}
        {!meeting.description && !meeting.guests.length ? <p className="text-[12.5px] text-[#9ca3af]">No more details were added to this meeting.</p> : null}
      </div>
    </div>
  );
};

const MeetingRow = ({ meeting, now }: { meeting: Meeting; now: number }) => {
  const [open, setOpen] = useState(false);
  const status = statusOf(meeting, now);
  return (
    <li className="relative">
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: STATUS[status].color }} aria-hidden />
      <button type="button" onClick={() => setOpen((shown) => !shown)} aria-expanded={open} className="flex w-full cursor-pointer items-center gap-4 py-3.5 pr-4 pl-5 text-left hover:bg-[#fafbfc]">
        <DateBlock iso={meeting.start} status={status} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-[14.5px] font-semibold text-[#0b1522]">{meeting.title}</span>
            {meeting.kickoff ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ede9fe] px-2 py-0.5 text-[10.5px] font-semibold text-[#6d28d9]">
                <Rocket className="size-3" strokeWidth={2.25} /> Onboarding call
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12.5px] text-[#6b7280]">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" strokeWidth={2} /> {whenOf(meeting)}
            </span>
            <span className="inline-flex items-center gap-1">
              <UserRound className="size-3.5" strokeWidth={2} /> {meeting.host.name || meeting.host.email || "BayShore team"}
            </span>
            {status === "upcoming" ? <span className="font-medium text-[#854d0e]">{fromNow(meeting.start, now)}</span> : null}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3 max-sm:hidden">
          {meeting.meetLink && (status === "live" || status === "upcoming") ? <MeetButton href={meeting.meetLink} /> : null}
          <StatusPill status={status} />
        </span>
        <ChevronDown className={`size-4.5 shrink-0 text-[#9ca3af] transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2} />
      </button>
      {open ? <MeetingDetails meeting={meeting} status={status} /> : null}
    </li>
  );
};

// The one coming up next, large.
const NextMeeting = ({ meeting, now }: { meeting: Meeting; now: number }) => {
  const status = statusOf(meeting, now);
  return (
    <section className="overflow-hidden rounded-2xl bg-[#0b1522] text-white shadow-[0_8px_24px_rgba(11,21,34,0.18)]">
      <div className="flex flex-wrap items-center gap-5 px-6 py-5">
        <div className="flex size-18 shrink-0 flex-col items-center justify-center rounded-2xl bg-white/10">
          <span className="text-[11px] font-bold tracking-wide text-[#fcd34d] uppercase">{format(meeting.start, { weekday: "short" })}</span>
          <span className="text-[26px] leading-none font-bold">{format(meeting.start, { day: "numeric" })}</span>
          <span className="text-[11px] text-white/60">{format(meeting.start, { month: "short" })}</span>
        </div>
        <div className="min-w-0 flex-1 basis-64">
          <div className="text-[11.5px] font-semibold tracking-wide text-white/55 uppercase">
            {status === "live" ? <span className="text-[#93c5fd]">● Happening now</span> : `Your next meeting · ${fromNow(meeting.start, now)}`}
          </div>
          <div className="mt-1 truncate text-[19px] font-semibold">{meeting.title}</div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-white/70">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" strokeWidth={2} />
              {format(meeting.start, { weekday: "long", month: "long", day: "numeric" })} · {whenOf(meeting)} {meeting.allDay ? "" : zone()}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="size-3.5" strokeWidth={2} /> {meeting.host.name || meeting.host.email || "BayShore team"}
            </span>
          </div>
        </div>
        {meeting.meetLink ? <MeetButton href={meeting.meetLink} big /> : null}
      </div>
    </section>
  );
};

const Tile = ({ icon: Icon, label, value, status }: { icon: typeof Clock; label: string; value: number; status: Status }) => (
  <div className={`${cardClass} flex items-center gap-3 px-4 py-3.5`}>
    <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: STATUS[status].soft, color: STATUS[status].text }}>
      <Icon className="size-5" strokeWidth={2} />
    </span>
    <span>
      <span className="block text-[12px] font-medium text-[#6b7280]">{label}</span>
      <span className="block text-[22px] leading-tight font-semibold text-[#0b1522] tabular-nums">{value}</span>
    </span>
  </div>
);

const Bone = ({ className }: { className: string }) => <div className={`animate-pulse rounded-md bg-[#eceef1] ${className}`} />;

export const MeetingsSkeleton = () => (
  <div className="flex flex-col gap-4.5" role="status" aria-label="Loading your meetings">
    <Bone className="h-28 w-full rounded-2xl" />
    <div className="grid grid-cols-3 gap-3.5 max-sm:grid-cols-1">
      {[0, 1, 2].map((index) => (
        <Bone key={index} className="h-17 rounded-2xl" />
      ))}
    </div>
    <div className={`${cardClass} divide-y divide-[#f1f2f4]`}>
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="flex items-center gap-4 px-5 py-3.5">
          <Bone className="size-14 rounded-xl" />
          <div className="flex-1">
            <Bone className="h-3.5 w-56 max-w-full" />
            <Bone className="mt-2 h-3 w-40" />
          </div>
          <Bone className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

// Grouped by month, under a small heading each.
const MeetingList = ({ meetings, now, empty }: { meetings: Meeting[]; now: number; empty: ReactNode }) => {
  if (!meetings.length) return <div className={`${cardClass} px-5 py-10 text-center`}>{empty}</div>;
  const months: { month: string; meetings: Meeting[] }[] = [];
  for (const meeting of meetings) {
    const month = monthOf(meeting.start);
    const last = months.at(-1);
    if (last?.month === month) last.meetings.push(meeting);
    else months.push({ month, meetings: [meeting] });
  }
  return (
    <div className="flex flex-col gap-4">
      {months.map((group) => (
        <section key={group.month} className={`${cardClass} overflow-hidden`}>
          <div className="border-b border-[#f1f2f4] bg-[#fafbfc] px-5 py-2.5 text-[12px] font-semibold text-[#4b5563]">
            {group.month} <span className="font-medium text-[#9ca3af]">· {group.meetings.length}</span>
          </div>
          <ul className="divide-y divide-[#f1f2f4]">
            {group.meetings.map((meeting) => (
              <MeetingRow key={meeting.id} meeting={meeting} now={now} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};

const Meetings = ({ data }: { data: MeetingsData }) => {
  const now = useSyncExternalStore(subscribeNever, nowInBrowser, () => 0);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  if (!now) return <MeetingsSkeleton />;

  const upcoming = data.meetings.filter((meeting) => time(meeting.end) > now);
  const past = data.meetings.filter((meeting) => time(meeting.end) <= now).reverse();
  const done = past.filter((meeting) => statusOf(meeting, now) === "done").length;
  const missed = past.length - done;
  const shown = tab === "upcoming" ? upcoming : past;

  return (
    <div className="flex flex-col gap-4.5">
      {data.partial ? (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-2.5 text-[12.5px] text-[#92400e]">
          <AlertTriangle className="size-4 shrink-0" strokeWidth={2} /> Some meetings couldn&apos;t be loaded just now. Refresh in a little while to see them all.
        </div>
      ) : null}

      {upcoming[0] ? <NextMeeting meeting={upcoming[0]} now={now} /> : null}

      <div className="grid grid-cols-3 gap-3.5 max-sm:grid-cols-1">
        <Tile icon={CalendarClock} label="Upcoming" value={upcoming.length} status="upcoming" />
        <Tile icon={CalendarCheck2} label="Done" value={done} status="done" />
        <Tile icon={CalendarX2} label="Missed" value={missed} status="missed" />
      </div>

      <div className="flex items-center gap-1 self-start rounded-xl bg-[#eef0f3] p-1">
        {(
          [
            ["upcoming", "Upcoming", upcoming.length],
            ["past", "Past meetings", past.length],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
            className={`cursor-pointer rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors ${tab === key ? "bg-white text-[#0b1522] shadow-[0_1px_3px_rgba(15,23,42,0.12)]" : "text-[#6b7280] hover:text-[#0b1522]"}`}
          >
            {label} <span className="ml-1 text-[12px] font-medium text-[#9ca3af]">{count}</span>
          </button>
        ))}
      </div>

      <MeetingList
        meetings={shown}
        now={now}
        empty={
          <>
            <CalendarClock className="mx-auto size-8 text-[#c7ccd4]" strokeWidth={1.6} />
            <p className="mt-2 text-[14px] font-semibold text-[#374151]">{tab === "upcoming" ? "No meetings coming up" : "No past meetings yet"}</p>
            <p className="mt-1 text-[12.5px] text-[#6b7280]">
              {tab === "upcoming" ? "When a meeting with BayShore is booked, it shows up here with its Meet link." : "Meetings you've had with BayShore will be listed here."}
            </p>
          </>
        }
      />
    </div>
  );
};

const Calendar = ({ data, error }: { data?: MeetingsData; error?: string }) => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="font-serif text-[26px] font-bold text-[#0b1a26]">Calendar</div>
        <div className="mt-1 text-[13px] text-[#657787]">Your meetings with BayShore — what&apos;s coming up, and everything you&apos;ve had so far.</div>
      </div>

      {data ? (
        <Meetings data={data} />
      ) : (
        <div role="alert" className="rounded-xl border border-[#f5c2c2] bg-[#fdecec] px-4 py-3 text-[12.5px] font-medium text-[#b42318]">
          {error ?? "Couldn't load your meetings."} Please refresh the page to try again.
        </div>
      )}
    </div>
  );
};

export default Calendar;
