"use client";

import { useSyncExternalStore } from "react";
import type { MyDashboard } from "@/app/actions/dashboard";

// The dashboard's next meetings, in the visitor's own time zone — so only once the page is in the
// browser (until then, a placeholder row of the same size).

const subscribeNever = () => () => {};

const MeetingRows = ({ meetings }: { meetings: MyDashboard["meetings"]["items"] }) => {
  const inBrowser = useSyncExternalStore(subscribeNever, () => true, () => false);

  return meetings.map((meeting) => {
    const start = new Date(meeting.start);
    const when = !inBrowser
      ? ""
      : meeting.allDay
        ? "All day"
        : `${start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · ${meeting.meetLink ? "Video call" : (meeting.host.name ?? "With your team")}`;
    return (
      <a
        href={meeting.meetLink ?? "/calendar"}
        target={meeting.meetLink ? "_blank" : undefined}
        rel={meeting.meetLink ? "noopener" : undefined}
        className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-inherit no-underline hover:bg-[#f7f8fa]"
        key={meeting.id}
      >
        <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl border border-[#eceef1] bg-[#f7f8fa]">
          <span className="text-[9px] leading-none font-semibold text-[#dc2626]">{inBrowser ? start.toLocaleDateString("en-US", { month: "short" }) : ""}</span>
          <span className="mt-0.5 text-[15px] leading-none font-bold text-[#0b0c24]">{inBrowser ? start.getDate() : ""}</span>
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[12.5px] font-bold text-[#0b0c24]">{meeting.title}</span>
          <span className="mt-0.5 block h-4 truncate text-[11px] text-[#6b7280]">{when}</span>
        </span>
      </a>
    );
  });
};

export default MeetingRows;
