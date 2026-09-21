export const metricCards = [
  { label: "TOTAL LEADS COLLECTED", value: "84", direction: "up", delta: "12.0%" },
  { label: "GMB IMPRESSIONS", value: "3,412", direction: "up", delta: "7.8%" },
  { label: "WEBSITE CLICKS", value: "612", direction: "up", delta: "4.1%" },
  { label: "SOCIAL ENGAGEMENT", value: "9,840", direction: "down", delta: "2.6%" },
] as const;

type SubMetric = { label: string; value: string; trend: string; down?: boolean };

export type ChannelCard = {
  name: string;
  sub: string;
  color: string;
  tint: string;
  headline: string;
  headlineLabel: string;
  bars: number[];
  subMetrics: SubMetric[];
};

export const BAR_MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];

export const channelCards: ChannelCard[] = [
  {
    name: "Website & SEO",
    sub: "Organic search performance",
    color: "#c8973a",
    tint: "#ecd9b3",
    headline: "71,240",
    headlineLabel: "IMPRESSIONS",
    bars: [38, 48, 55, 62, 70, 100],
    subMetrics: [
      { label: "CLICKS", value: "612", trend: "+4.1%" },
      { label: "BACKLINKS", value: "214", trend: "+8.1%" },
      { label: "LEADS FWD.", value: "22", trend: "+22.2%" },
    ],
  },
  {
    name: "Google Business Profile",
    sub: "Local & maps visibility",
    color: "#2f8f6f",
    tint: "#bfe4d6",
    headline: "3,412",
    headlineLabel: "IMPRESSIONS",
    bars: [40, 50, 58, 66, 74, 100],
    subMetrics: [
      { label: "CALLS", value: "47", trend: "+20.5%" },
      { label: "DIRECTIONS", value: "203", trend: "+12.2%" },
      { label: "MESSAGES", value: "9", trend: "−10.0%", down: true },
    ],
  },
  {
    name: "Facebook",
    sub: "4 posts published",
    color: "#3457c9",
    tint: "#c3cdec",
    headline: "128.4k",
    headlineLabel: "REACH",
    bars: [42, 50, 58, 66, 76, 100],
    subMetrics: [
      { label: "ENGAGEMENT", value: "6,120", trend: "+5.4%" },
      { label: "NEW FOLLOWS", value: "84", trend: "+9.0%" },
      { label: "LINK CLICKS", value: "311", trend: "−1.2%", down: true },
    ],
  },
  {
    name: "Instagram",
    sub: "4 posts published",
    color: "#b8365f",
    tint: "#eec9d3",
    headline: "61.2k",
    headlineLabel: "REACH",
    bars: [44, 52, 60, 68, 78, 100],
    subMetrics: [
      { label: "ENGAGEMENT", value: "3,720", trend: "+6.8%" },
      { label: "NEW FOLLOWS", value: "112", trend: "+14.3%" },
      { label: "SAVES", value: "96", trend: "+3.1%" },
    ],
  },
];

export const pendingItems = [
  {
    kind: "blog",
    title: "Blog — Product Liability Guide",
    sub: "Submitted Sep 11",
    status: "waiting",
  },
  {
    kind: "reel",
    title: "Reel — \"Car Wreck? We've Got You\"",
    sub: "Revision requested Sep 9",
    status: "revision",
  },
  {
    kind: "post",
    title: "Static Post — Slip & Fall",
    sub: "Submitted Sep 10",
    status: "waiting",
  },
  {
    kind: "post",
    title: "Static Post — Labor Day",
    sub: "Approved Sep 5",
    status: "approved",
  },
] as const;

export const upcomingMeetings = [
  { month: "SEP", day: "18", title: "Monthly Strategy Call", sub: "2:00 PM · Video call" },
  { month: "SEP", day: "25", title: "Q3 Campaign Review", sub: "10:30 AM · Video call" },
];

export const leadSources = [
  { label: "GMB", color: "#2f8f6f", width: 100, count: 37 },
  { label: "Site", color: "#c8973a", width: 84, count: 31 },
  { label: "Social", color: "#3457c9", width: 43, count: 16 },
];
