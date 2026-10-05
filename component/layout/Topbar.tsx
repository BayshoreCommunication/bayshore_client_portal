import { Suspense } from "react";
import { CalendarDays, ChevronDown, Search } from "lucide-react";
import { listNotificationsAction } from "@/app/actions/notifications";
import NotificationBell, { BellPlaceholder } from "./NotificationBell";
import TopbarUserMenu from "./TopbarUserMenu";

// White, lightly-bordered pill shared by every topbar control.
const boxClass = "h-10 rounded-[10px] border border-[#e2e5e9] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

const currentMonthLabel = () =>
  new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

// How many notifications the bell's panel lists; the Notifications page has the rest.
const BELL_LIMIT = 8;

// The bell with its first load done on the server, so the unread badge is right from the
// first paint. It is streamed in behind a placeholder, so it never holds the page up.
const LoadedBell = async () => {
  const result = await listNotificationsAction({ limit: BELL_LIMIT });
  return <NotificationBell limit={BELL_LIMIT} initial={result.ok ? result.data : undefined} />;
};

const Topbar = () => {
  return (
    <div className="flex items-center justify-between border-b border-[#e1e7e4] bg-[#ffffff] px-8 py-3 print:hidden">
      <div className={`${boxClass} flex w-112.5 items-center gap-2 px-4 focus-within:border-[#9aa3af]`}>
        <Search size={14} strokeWidth={2} className="text-[#8496a3]" />
        <input
          type="text"
          placeholder="Search reports, content, services..."
          className="w-full border-none bg-transparent text-[13px] text-[#17242f] outline-none placeholder:text-[#8496a3]"
        />
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <div className={`${boxClass} inline-flex items-center gap-1.5 whitespace-nowrap px-4 text-[13px] font-semibold text-[#17242f]`}>
          <CalendarDays size={14} strokeWidth={2} /> {currentMonthLabel()}
          <ChevronDown size={14} strokeWidth={2} />
        </div>
        <Suspense fallback={<BellPlaceholder />}>
          <LoadedBell />
        </Suspense>
        <TopbarUserMenu />
      </div>
    </div>
  );
};

export default Topbar;
