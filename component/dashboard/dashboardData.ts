import type { MyReportListItem, MyReportWithFigures } from "@/app/actions/reports";
import { changeBetween, formatMetric, periodLabel, previousLabel, type Change } from "@/component/reports/reportUi";

// How many reports of the same kind the trend bars look back over.
const TREND_POINTS = 6;
const RECENT_REPORTS = 5;

export interface DashboardMetric {
  label: string;
  value: string;
  change: Change | null;
}

export interface DashboardChannel {
  name: string;
  sub: string;
  color: string;
  tint: string;
  headline: string;
  headlineLabel: string;
  bars: { height: number; label: string }[];
  subMetrics: DashboardMetric[];
}

export interface DashboardModel {
  period: string;
  comparedWith: string | null;
  // "Aug", or "last week" — for the "vs Aug" note under a figure.
  comparedNote: string | null;
  latestId: string;
  metrics: DashboardMetric[];
  channels: DashboardChannel[];
  recent: MyReportListItem[];
}

type Figure = (report: MyReportWithFigures) => number | undefined;

const num = (value: unknown) => (typeof value === "number" ? value : undefined);

const socialTotal: Figure = (report) => {
  const platforms = [report.social?.facebookReach, report.social?.instagramReach, report.social?.twitterReach, report.social?.linkedinReach];
  const present = platforms.filter((value): value is number => typeof value === "number");
  return present.length ? present.reduce((sum, value) => sum + value, 0) : undefined;
};

const barLabel = (report: MyReportListItem) =>
  new Date(report.periodStart).toLocaleDateString("en-US", {
    month: "short",
    ...(report.periodType === "weekly" ? { day: "numeric" } : {}),
    timeZone: "UTC",
  });

// +4.1% / −10.0% / 0%, the way the trend lines are written.
export const changeText = (change: Change | null) =>
  !change ? "" : change.direction === "up" ? `+${change.percent}%` : change.direction === "down" ? `−${change.percent}%` : "0%";

/**
 * Turns a client's published reports (newest first, with figures) into what the
 * dashboard shows: the latest period against the one before it, and a small
 * trend per channel over up to the last six reports of the same kind.
 * Returns null when there is nothing published yet.
 */
export const buildDashboard = (reports: MyReportWithFigures[]): DashboardModel | null => {
  const latest = reports[0];
  if (!latest) return null;

  // Weekly and monthly figures aren't comparable, so trends follow the latest report's kind.
  const series = reports.filter((report) => report.periodType === latest.periodType).slice(0, TREND_POINTS).reverse();
  const previous = series.length > 1 ? series[series.length - 2] : undefined;

  const metric = (label: string, figure: Figure): DashboardMetric | null => {
    const value = figure(latest);
    return value === undefined ? null : { label, value: formatMetric(value), change: previous ? changeBetween(value, figure(previous)) : null };
  };

  const channel = (
    name: string,
    sub: string,
    color: string,
    tint: string,
    headlineLabel: string,
    headline: Figure,
    subMetrics: (DashboardMetric | null)[]
  ): DashboardChannel | null => {
    const value = headline(latest);
    if (value === undefined) return null;

    const values = series.map(headline);
    const largest = Math.max(...values.map((item) => item ?? 0), 1);

    return {
      name,
      sub,
      color,
      tint,
      headline: formatMetric(value),
      headlineLabel,
      bars: series.map((report, index) => ({
        height: values[index] === undefined ? 0 : Math.max(8, Math.round((values[index]! / largest) * 100)),
        label: barLabel(report),
      })),
      subMetrics: subMetrics.filter((item): item is DashboardMetric => item !== null),
    };
  };

  // Social platforms only report reach, so the sub-figure is last period's reach and the change.
  const socialChannel = (name: string, color: string, tint: string, figure: Figure) =>
    channel(name, "Reach this period", color, tint, "REACH", figure, [
      previous && figure(previous) !== undefined
        ? { label: "LAST PERIOD", value: formatMetric(figure(previous)!), change: changeBetween(figure(latest), figure(previous)) }
        : null,
    ]);

  const website = (key: keyof NonNullable<MyReportWithFigures["website"]>): Figure => (report) => num(report.website?.[key]);
  const gmb = (key: "impressions" | "calls" | "directionRequests" | "websiteClicks"): Figure => (report) => num(report.gmb?.[key]);
  const social = (key: "facebookReach" | "instagramReach" | "twitterReach" | "linkedinReach"): Figure => (report) => num(report.social?.[key]);

  return {
    period: periodLabel(latest),
    comparedWith: previous ? periodLabel(previous) : null,
    comparedNote: previous ? previousLabel(latest.periodType, previous.periodStart) : null,
    latestId: latest._id,
    metrics: [
      metric("LEADS FORWARDED", website("leadsForwarded")),
      metric("GMB IMPRESSIONS", gmb("impressions")),
      metric("WEBSITE CLICKS", website("clicks")),
      metric("SOCIAL REACH", socialTotal),
    ].filter((item): item is DashboardMetric => item !== null),
    channels: [
      channel("Website & SEO", "Organic search performance", "#c8973a", "#ecd9b3", "IMPRESSIONS", website("impressions"), [
        metric("CLICKS", website("clicks")),
        metric("BACKLINKS", website("backlinks")),
        metric("LEADS FWD.", website("leadsForwarded")),
      ]),
      channel("Google Business Profile", "Local & maps visibility", "#2f8f6f", "#bfe4d6", "IMPRESSIONS", gmb("impressions"), [
        metric("CALLS", gmb("calls")),
        metric("DIRECTIONS", gmb("directionRequests")),
        metric("WEBSITE CLICKS", gmb("websiteClicks")),
      ]),
      socialChannel("Facebook", "#3457c9", "#c3cdec", social("facebookReach")),
      socialChannel("Instagram", "#b8365f", "#eec9d3", social("instagramReach")),
      socialChannel("Twitter / X", "#1f2937", "#d1d5db", social("twitterReach")),
      socialChannel("LinkedIn", "#0a66c2", "#bcd7f0", social("linkedinReach")),
    ].filter((item): item is DashboardChannel => item !== null),
    recent: reports.slice(0, RECENT_REPORTS),
  };
};
