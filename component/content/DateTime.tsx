"use client";

import { useSyncExternalStore } from "react";
import { shortDate } from "./contentUi";

const never = () => () => {};

// "Oct 6, 3:45 PM"
const withTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

// A date with its time of day, in the reader's own time zone. The server can't know that
// zone, so it sends the date alone and the browser adds the time once the page is live —
// which also keeps the two from disagreeing about what the page says.
const DateTime = ({ iso }: { iso?: string }) => {
  const text = useSyncExternalStore(
    never,
    () => withTime(iso),
    () => shortDate(iso),
  );
  return <time dateTime={iso}>{text}</time>;
};

export default DateTime;
