import { listMyMeetingsAction } from "@/app/actions/meetings";
import Calendar from "@/component/calendar/Calendar";

// The client's meetings with BayShore — the ones to come and the ones gone by.
const CalendarPage = async () => {
  const result = await listMyMeetingsAction();
  return <Calendar data={result.ok ? result.data : undefined} error={result.ok ? undefined : result.error} />;
};

export default CalendarPage;
