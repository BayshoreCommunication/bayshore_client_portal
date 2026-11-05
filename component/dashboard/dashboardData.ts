import type { MyDashboard } from "@/app/actions/dashboard";
import type { MyReportWithFigures } from "@/app/actions/reports";
import { changeBetween, formatMetric, periodLabel, previousLabel, type Change } from "@/component/reports/reportUi";

// Turns the dashboard's data (GET /dashboard/me) into what the page shows: the four cards, the
// six channel charts, the content waiting on the client and their next meetings. Figures come
// from the published reports — the latest against the one before it, and up to six of the same
// kind (monthly, or weekly) for the bars; leads from the leads they collected.

const TREND_POINTS = 6;

export type ChannelKey = "website" | "gmb" | "facebook" | "instagram" | "twitter" | "linkedin";

export interface DashboardCard {
  key: "leads" | "gmb" | "clicks" | "social";
  title: string;
  // "—" when there's nothing to show yet.
  value: string;
  change: Change | null;
  // "Oct", "Last week" — what the change is against.
  note: string | null;
}

export interface DashboardChannel {
  key: ChannelKey;
  // null: no report has this channel's figures yet.
  headline: number | null;
  headlineLabel: string;
  // Oldest first, the last is the latest report.
  bars: { value: number; label: string }[];
  metrics: { label: string; value: string; change?: Change | null }[];
}

export type PendingKind = "blog" | "reel" | "post";

export interface DashboardModel {
  // "October 2026", and the period it is compared with.
  period: string | null;
  comparedWith: string | null;
  latestId: string | null;
  cards: DashboardCard[];
  channels: DashboardChannel[];
  content: {
    needDecision: number;
    items: { id: string; kind: PendingKind; title: string; sub: string; status: "waiting" | "revision" }[];
  };
  meetings: MyDashboard["meetings"];
}

type Figure = (report: MyReportWithFigures) => number | undefined;
const num = (value: unknown) => (typeof value === "number" ? value : undefined);

const website = (key: "impressions" | "clicks" | "backlinks" | "leadsForwarded"): Figure => (report) => num(report.website?.[key]);
const gmb = (key: "impressions" | "calls" | "directionRequests" | "websiteClicks"): Figure => (report) => num(report.gmb?.[key]);
const social = (key: "facebookReach" | "instagramReach" | "twitterReach" | "linkedinReach"): Figure => (report) => num(report.social?.[key]);
const socialTotal: Figure = (report) => {
  const present = [social("facebookReach"), social("instagramReach"), social("twitterReach"), social("linkedinReach")]
    .map((figure) => figure(report))
    .filter((value): value is number => value !== undefined);
  return present.length ? present.reduce((sum, value) => sum + value, 0) : undefined;
};

const barLabel = (report: MyReportWithFigures) =>
  new Date(report.periodStart).toLocaleDateString("en-US", { month: "short", ...(report.periodType === "weekly" ? { day: "numeric" } : {}), timeZone: "UTC" });

const shortDay = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) : "");

// What a piece is, as the card's icon says it.
const KIND: Record<string, { kind: PendingKind; label: string }> = {
  blog: { kind: "blog", label: "Blog" },
  video: { kind: "reel", label: "Reel" },
  story: { kind: "reel", label: "Story" },
  image: { kind: "post", label: "Static Post" },
  carousel: { kind: "post", label: "Carousel" },
  website: { kind: "post", label: "Website" },
  email: { kind: "post", label: "Email" },
  gmb: { kind: "post", label: "GMB Post" },
  ad: { kind: "post", label: "Ad" },
};

// "Oct" — the month before this one, for the leads card.
const lastMonthShort = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
};

export const buildDashboard = (data: MyDashboard): DashboardModel => {
  const latest = data.reports[0];
  // Weekly and monthly figures aren't comparable: the bars follow the latest report's kind.
  const series = latest ? data.reports.filter((report) => report.periodType === latest.periodType).slice(0, TREND_POINTS).reverse() : [];
  const previous = series.length > 1 ? series[series.length - 2] : undefined;
  const note = latest && previous ? previousLabel(latest.periodType, previous.periodStart) : null;

  const valueOf = (figure: Figure) => (latest ? figure(latest) : undefined);
  const changeOf = (figure: Figure) => (latest && previous ? changeBetween(figure(latest), figure(previous)) : null);
  const card = (key: DashboardCard["key"], title: string, figure: Figure): DashboardCard => {
    const value = valueOf(figure);
    return { key, title, value: value === undefined ? "—" : formatMetric(value), change: value === undefined ? null : changeOf(figure), note };
  };
  const metric = (label: string, figure: Figure) => {
    const value = valueOf(figure);
    return { label, value: value === undefined ? "—" : formatMetric(value), change: value === undefined ? null : changeOf(figure) };
  };

  const channel = (key: ChannelKey, headlineLabel: string, figure: Figure, metrics: DashboardChannel["metrics"]): DashboardChannel => ({
    key,
    headline: valueOf(figure) ?? null,
    headlineLabel,
    bars: series.map((report) => ({ value: figure(report) ?? 0, label: barLabel(report) })),
    metrics,
  });

  // The platforms only report reach: under it, the period before, the average and the best.
  const socialChannel = (key: ChannelKey, figure: Figure) => {
    const values = series.map(figure).filter((value): value is number => value !== undefined);
    const before = previous ? figure(previous) : undefined;
    return channel(key, "Reach", figure, [
      { label: "LAST PERIOD", value: before === undefined ? "—" : formatMetric(before) },
      { label: `${values.length || ""} PERIOD AVG`.trim(), value: values.length ? formatMetric(Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)) : "—" },
      { label: "BEST", value: values.length ? formatMetric(Math.max(...values)) : "—" },
    ]);
  };

  return {
    period: latest ? periodLabel(latest) : null,
    comparedWith: previous ? periodLabel(previous) : null,
    latestId: latest?._id ?? null,
    cards: [
      {
        key: "leads",
        title: "LEADS THIS MONTH",
        value: formatMetric(data.leads.thisMonth),
        change: changeBetween(data.leads.thisMonth, data.leads.lastMonth),
        note: lastMonthShort(),
      },
      card("gmb", "GMB IMPRESSIONS", gmb("impressions")),
      card("clicks", "WEBSITE CLICKS", website("clicks")),
      card("social", "SOCIAL REACH", socialTotal),
    ],
    channels: [
      channel("website", "Impressions", website("impressions"), [metric("CLICKS", website("clicks")), metric("BACKLINKS", website("backlinks")), metric("LEADS FWD", website("leadsForwarded"))]),
      channel("gmb", "Impressions", gmb("impressions"), [metric("CALLS", gmb("calls")), metric("DIRECTIONS", gmb("directionRequests")), metric("SITE CLICKS", gmb("websiteClicks"))]),
      socialChannel("facebook", social("facebookReach")),
      socialChannel("instagram", social("instagramReach")),
      socialChannel("twitter", social("twitterReach")),
      socialChannel("linkedin", social("linkedinReach")),
    ],
    content: {
      needDecision: data.content.needDecision,
      items: data.content.items.map((piece) => {
        const kind = KIND[piece.type] ?? { kind: "post" as const, label: "Content" };
        return {
          id: piece._id,
          kind: kind.kind,
          title: `${kind.label} — ${piece.title}`,
          sub: piece.status === "pending_approval" ? `Submitted ${shortDay(piece.at)}` : `Revision requested ${shortDay(piece.at)}`,
          status: piece.status === "pending_approval" ? "waiting" : "revision",
        };
      }),
    },
    meetings: data.meetings,
  };
};
