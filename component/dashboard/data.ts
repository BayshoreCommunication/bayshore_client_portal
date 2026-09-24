// Sample figures for the dashboard's right column, until it's wired to the API.

export type PendingKind = "blog" | "reel" | "post";
export type PendingStatus = "waiting" | "revision" | "approved";

export const pendingItems: { kind: PendingKind; title: string; sub: string; status: PendingStatus }[] = [
  { kind: "blog", title: "Blog — Product Liability Guide", sub: "Submitted Sep 11", status: "waiting" },
  { kind: "reel", title: "Reel — “Car Wreck? We've Got You”", sub: "Revision requested Sep 9", status: "revision" },
  { kind: "post", title: "Static Post — Labor Day", sub: "Approved Sep 5", status: "approved" },
  { kind: "blog", title: "Blog — Dog Bite Claims Explained", sub: "Submitted Sep 12", status: "waiting" },
  { kind: "reel", title: "Reel — “Know Your Rights”", sub: "Submitted Sep 13", status: "waiting" },
  { kind: "post", title: "Static Post — Hurricane Prep", sub: "Approved Sep 3", status: "approved" },
];

export const upcomingMeetings = [
  { month: "Sep", day: "18", title: "Monthly Strategy Call", sub: "2:00 PM · Video call" },
  { month: "Sep", day: "25", title: "Q3 Campaign Review", sub: "10:30 AM · Video call" },
  { month: "Sep", day: "28", title: "Monthly Strategy Call", sub: "2:00 PM · Video call" },
];
