import { Bell, CalendarDays, ChevronDown, Search } from "lucide-react";
import TopbarUserMenu from "./TopbarUserMenu";

// White, lightly-bordered pill shared by every topbar control.
const boxClass = "h-10 rounded-[10px] border border-[#e2e5e9] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

const currentMonthLabel = () =>
  new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

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
        <button
          className={`${boxClass} relative flex w-10 shrink-0 cursor-pointer items-center justify-center text-[15px] text-[#17242f] hover:bg-[#f9fafb]`}
          aria-label="Notifications"
        >
          <Bell size={16} strokeWidth={2} />
          <span className="absolute -right-0.75 -top-0.75 flex h-4.25 w-4.25 items-center justify-center rounded-full bg-[#dc2626] text-[10px] font-bold text-white">
            4
          </span>
        </button>
        <TopbarUserMenu />
      </div>
    </div>
  );
};

export default Topbar;
