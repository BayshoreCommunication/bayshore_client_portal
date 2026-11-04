import { MeetingsSkeleton } from "@/component/calendar/Calendar";

// While the meetings load from the team's calendars.
const CalendarLoading = () => (
  <div className="flex flex-col gap-6">
    <div>
      <div className="font-serif text-[26px] font-bold text-[#0b1a26]">Calendar</div>
      <div className="mt-2 h-3.5 w-80 max-w-full animate-pulse rounded-md bg-[#eceef1]" />
    </div>
    <MeetingsSkeleton />
  </div>
);

export default CalendarLoading;
