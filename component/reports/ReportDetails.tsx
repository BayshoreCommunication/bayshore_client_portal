"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Download,
  Eye,
  FileText,
  Globe,
  Link2,
  MapPin,
  MousePointerClick,
  Navigation,
  Phone,
  Play,
  Share2,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { MyReport, MyReportPrevious, ReportPeriodType } from "@/app/actions/reports";
import { useSessionUser } from "@/component/shared/SessionUser";
import { poppins } from "@/component/shared/fonts";
import {
  PERIOD_TYPES,
  changeBetween,
  currentLabel,
  dateRange,
  firstNameOf,
  formatDate,
  formatMetric,
  hasNumbers,
  periodLabel,
  previousLabel,
  type Change,
} from "./reportUi";

// lucide ships no brand logos, so the four social networks get their own marks.
type IconComponent = LucideIcon | ((props: { size?: number }) => ReactNode);

const brandIcon = (path: string) => {
  const BrandIcon = ({ size = 15 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d={path} />
    </svg>
  );
  return BrandIcon;
};

const FacebookIcon = brandIcon(
  "M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.87.25-1.46 1.5-1.46h1.6V4.46a21 21 0 0 0-2.3-.16c-2.3 0-3.8 1.4-3.8 3.95v2.25H8v3h2.5V21z"
);
const XIcon = brandIcon(
  "M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3zm-1.08 16.2h1.7L7.4 4.73H5.58L16.67 19.2z"
);
const LinkedinIcon = brandIcon(
  "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.6c0-1.34-.03-3.06-1.86-3.06-1.87 0-2.15 1.46-2.15 2.96V21H9z"
);
const InstagramIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
  </svg>
);

type Badge = { icon: IconComponent; color: string; background: string };

type Metric = { label: string; value: number; previous?: number; sub?: string; badge?: Badge };

type MetricRow = Omit<Metric, "value"> & { value?: number };

// Keeps only the figures the report actually has.
const present = (rows: MetricRow[]): Metric[] =>
  rows.flatMap((row) => (typeof row.value === "number" ? [{ ...row, value: row.value }] : []));

const BLUE: Omit<Badge, "icon"> = { color: "#2f5fd8", background: "#d9e0ef" };
const GREEN: Omit<Badge, "icon"> = { color: "#16a34a", background: "#d6eadb" };
const ORANGE: Omit<Badge, "icon"> = { color: "#d97706", background: "#f8e4c6" };
const PURPLE: Omit<Badge, "icon"> = { color: "#4f46e5", background: "#dcdcf1" };

const BADGE_SIZES = {
  sm: { box: "h-7 w-7", icon: 14 },
  md: { box: "h-8 w-8", icon: 16 },
  lg: { box: "h-10 w-10", icon: 19 },
};

const IconBadge = ({ badge, size = "md" }: { badge: Badge; size?: keyof typeof BADGE_SIZES }) => {
  const Icon = badge.icon;
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-lg ${BADGE_SIZES[size].box}`}
      style={{ background: badge.background, color: badge.color }}
    >
      <Icon size={BADGE_SIZES[size].icon} />
    </span>
  );
};

// ▲ 7.8% / ▼ 2.6% — nothing when there is no earlier figure to compare with.
const Delta = ({ change }: { change: Change | null }) => {
  if (!change) return null;
  if (change.direction === "flat") return <span className="text-[11px] whitespace-nowrap text-[#6b7280]">No change</span>;

  const up = change.direction === "up";
  return (
    <span className={`inline-flex items-center gap-1 text-[11.5px] whitespace-nowrap ${up ? "text-[#16a34a]" : "text-[#e11d2e]"}`}>
      <svg width="10" height="6" viewBox="0 0 12 7" fill="currentColor" aria-hidden className={up ? "" : "rotate-180"}>
        <path d="M6 0 12 7H0z" />
      </svg>
      {change.percent}%
    </span>
  );
};

const tileClass = "rounded-xl border border-[#e6e8eb] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]";

// One stat: badge, label and a short description on top; the figure and its change below.
const StatTile = ({ metric }: { metric: Metric }) => (
  <div className={`${tileClass} px-4 pt-3.5 pb-4`}>
    <div className="flex items-center gap-3">
      {metric.badge ? <IconBadge badge={metric.badge} size="lg" /> : null}
      <div className="min-w-0">
        <div className="truncate text-[12px] font-semibold text-[#0b0c24] uppercase">{metric.label}</div>
        {metric.sub ? <div className="mt-0.5 truncate text-[11px] text-[#6b7280]">{metric.sub}</div> : null}
      </div>
    </div>
    <div className="mt-3 flex items-end justify-between gap-2">
      <span className="text-[30px] leading-none font-semibold text-[#0a0a0f]">{formatMetric(metric.value)}</span>
      <Delta change={changeBetween(metric.value, metric.previous)} />
    </div>
  </div>
);

const StatGrid = ({ metrics }: { metrics: Metric[] }) => (
  <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
    {metrics.map((metric) => (
      <StatTile metric={metric} key={metric.label} />
    ))}
  </div>
);

const CHART_HEIGHT = 150;
const GRID_STEPS = 4;

// Rounds up to a tidy axis top: 612 → 800, 3,412 → 4,000.
const niceMax = (value: number) => {
  if (value <= 0) return GRID_STEPS;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((factor) => factor * magnitude * GRID_STEPS >= value) ?? 10;
  return step * magnitude * GRID_STEPS;
};

// Last period against this period on a gridded axis, with the related figures underneath.
const ComparisonChart = ({
  badge,
  title,
  sub,
  previous,
  current,
  previousName,
  currentName,
  footer,
}: {
  badge: Badge;
  title: string;
  sub: string;
  previous?: number;
  current: number;
  previousName: string;
  currentName: string;
  footer: Metric[];
}) => {
  const top = niceMax(Math.max(previous ?? 0, current));
  const gridValues = Array.from({ length: GRID_STEPS + 1 }, (_, i) => (top / GRID_STEPS) * (GRID_STEPS - i));

  const bars = [
    { name: previousName, value: previous, color: "#f5d9b0" },
    { name: currentName, value: current, color: "#eea23f" },
  ].filter((bar): bar is { name: string; value: number; color: string } => typeof bar.value === "number");

  return (
    <div className={`${tileClass} p-4`}>
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <IconBadge badge={badge} size="lg" />
          <div>
            <div className="text-[12px] font-semibold text-[#0b0c24] uppercase">{title}</div>
            <div className="mt-0.5 text-[11px] text-[#6b7280]">{sub}</div>
          </div>
        </div>
        <Delta change={changeBetween(current, previous)} />
      </div>

      <div className="mt-4 flex gap-2">
        <div className="flex flex-col justify-between pb-5 text-right text-[9.5px] text-[#9ca3af]" style={{ height: CHART_HEIGHT + 20 }}>
          {gridValues.map((value) => (
            <span key={value} className="-translate-y-1/2 leading-none first:translate-y-0 last:translate-y-0">
              {formatMetric(value)}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: CHART_HEIGHT }}>
            {gridValues.map((value) => (
              <div key={value} className="border-t border-dashed border-[#e5e7eb]" />
            ))}
          </div>
          <div className="relative flex items-end justify-center gap-6" style={{ height: CHART_HEIGHT }}>
            {bars.map((bar) => (
              <div
                key={bar.name}
                className="group relative w-16 rounded-t-md"
                style={{ height: Math.max(4, (bar.value / top) * CHART_HEIGHT), background: bar.color }}
                title={`${bar.name}: ${bar.value.toLocaleString("en-US")}`}
              >
                <span className="absolute inset-x-0 -top-4.5 text-center text-[10px] font-semibold text-[#4b5260]">
                  {formatMetric(bar.value)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex h-5 items-end justify-center gap-6">
            {bars.map((bar) => (
              <span key={bar.name} className="w-16 text-center text-[10.5px] text-[#6b7280]">
                {bar.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {footer.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#eceef1] pt-3.5">
          {footer.map((metric) => (
            <div key={metric.label}>
              <div className="text-[9.5px] font-semibold tracking-[0.3px] text-[#6b7280] uppercase">{metric.label}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[18px] leading-none font-semibold text-[#0a0a0f]">{formatMetric(metric.value)}</span>
                <Delta change={changeBetween(metric.value, metric.previous)} />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const DownloadButton = () => (
  <button
    className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-[#0b0c24] px-4.5 py-2.5 text-[12.5px] font-medium whitespace-nowrap text-white hover:bg-[#1e2140]"
    onClick={() => window.print()}
  >
    <Download size={14} strokeWidth={2} /> Download PDF
  </button>
);

// A report section: icon + title header, a divider, then the body.
const Card = ({
  id,
  badge,
  title,
  aside,
  children,
}: {
  id: string;
  badge: Badge;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) => (
  <section
    className="scroll-mt-14 rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)] print:break-inside-avoid"
    id={id}
  >
    <div className="flex items-center justify-between gap-3 px-6 pt-5">
      <div className="flex items-center gap-3">
        <IconBadge badge={badge} />
        <h2 className="text-[14px] font-semibold text-[#0b0c24] uppercase">{title}</h2>
      </div>
      {aside}
    </div>
    <div className="flex flex-col gap-4 px-6 pt-4.5 pb-6">{children}</div>
  </section>
);

const Pill = ({ children }: { children: ReactNode }) => (
  <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-[10.5px] font-medium whitespace-nowrap text-[#4b5260]">{children}</span>
);

// Splits the website figures between the charts so each chart carries its own footer.
const spread = <T,>(items: T[], parts: number): T[][] => {
  const size = Math.ceil(items.length / parts);
  return Array.from({ length: parts }, (_, i) => items.slice(i * size, (i + 1) * size));
};

// `autoPrint` opens the print dialog on arrival — that is what the list's download icon uses.
const ReportDetails = ({
  report,
  previous,
  autoPrint = false,
}: {
  report: MyReport;
  previous: MyReportPrevious | null;
  autoPrint?: boolean;
}) => {
  const { name } = useSessionUser();

  useEffect(() => {
    if (!autoPrint) return;
    // Drop ?print=1 so a refresh doesn't open the dialog again.
    window.history.replaceState(null, "", window.location.pathname);
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, [autoPrint]);

  const type: ReportPeriodType = report.periodType;
  const label = periodLabel(report);
  const previousName = previous ? previousLabel(type, previous.periodStart) : "";
  const currentName = currentLabel(type, report.periodStart);
  const meta = PERIOD_TYPES[type];

  const { social, website, gmb } = report;

  const socialMetrics = present([
    {
      label: "Facebook Reach",
      sub: "People reached on Facebook",
      value: social?.facebookReach,
      previous: previous?.social?.facebookReach,
      badge: { icon: FacebookIcon, color: "#1877f2", background: "#dbe7fb" },
    },
    {
      label: "Instagram Reach",
      sub: "People reached on Instagram",
      value: social?.instagramReach,
      previous: previous?.social?.instagramReach,
      badge: { icon: InstagramIcon, color: "#d62976", background: "#fbdde8" },
    },
    {
      label: "Twitter / X Reach",
      sub: "People reached on X",
      value: social?.twitterReach,
      previous: previous?.social?.twitterReach,
      badge: { icon: XIcon, color: "#0f1419", background: "#e5e7eb" },
    },
    {
      label: "LinkedIn Reach",
      sub: "People reached on LinkedIn",
      value: social?.linkedinReach,
      previous: previous?.social?.linkedinReach,
      badge: { icon: LinkedinIcon, color: "#0a66c2", background: "#d8e6f5" },
    },
  ]);
  const reel = social?.reel;
  const hasReel = Boolean(reel?.title) || typeof reel?.views === "number";

  const websiteMetrics = present([
    { label: "Backlinks", value: website?.backlinks, previous: previous?.website?.backlinks, badge: { icon: Link2, ...BLUE } },
    {
      label: "Referring Domains",
      value: website?.referringDomains,
      previous: previous?.website?.referringDomains,
      badge: { icon: Globe, ...GREEN },
    },
    {
      label: "Leads Forwarded",
      value: website?.leadsForwarded,
      previous: previous?.website?.leadsForwarded,
      badge: { icon: Users, ...PURPLE },
    },
    {
      label: "Website Clicks",
      value: website?.clicks,
      previous: previous?.website?.clicks,
      badge: { icon: MousePointerClick, ...ORANGE },
    },
  ]);
  const showWebsiteChart = hasNumbers({ impressions: website?.impressions, clicks: website?.clicks });
  const charts = [
    typeof website?.impressions === "number"
      ? {
          title: "Impressions",
          sub: "Organic search performance",
          badge: { icon: Eye, ...ORANGE },
          current: website.impressions,
          previous: previous?.website?.impressions,
        }
      : null,
    typeof website?.clicks === "number"
      ? {
          title: "Website Clicks",
          sub: "Visits from search results",
          badge: { icon: MousePointerClick, ...ORANGE },
          current: website.clicks,
          previous: previous?.website?.clicks,
        }
      : null,
  ].filter((chart) => chart !== null);
  const chartFooters = spread(websiteMetrics, Math.max(1, charts.length));

  const gmbMetrics = present([
    {
      label: "Profile Views",
      sub: "How people found your listing",
      value: gmb?.impressions,
      previous: previous?.gmb?.impressions,
      badge: { icon: Eye, ...BLUE },
    },
    {
      label: "Calls",
      sub: "Calls from your profile",
      value: gmb?.calls,
      previous: previous?.gmb?.calls,
      badge: { icon: Phone, color: "#16a34a", background: "#d2e7d8" },
    },
    {
      label: "Direction Requests",
      sub: "People asked for directions",
      value: gmb?.directionRequests,
      previous: previous?.gmb?.directionRequests,
      badge: { icon: Navigation, ...BLUE },
    },
    {
      label: "Website Clicks",
      sub: "Clicks to your website",
      value: gmb?.websiteClicks,
      previous: previous?.gmb?.websiteClicks,
      badge: { icon: MousePointerClick, color: "#7c3aed", background: "#e4ddf5" },
    },
  ]);
  const locations = gmb?.locations ?? [];
  const previousLocation = (locationName: string) => previous?.gmb?.locations?.find((location) => location.name === locationName);

  const showSocial = socialMetrics.length > 0 || hasReel;
  const showBlogs = report.blogs.length > 0;
  const showWebsite = websiteMetrics.length > 0 || showWebsiteChart;
  const showGmb = gmbMetrics.length > 0 || locations.length > 0;

  const paragraphs = (report.summary ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  // Jump links for the parts this report actually has.
  const sections = [
    paragraphs.length > 0 ? { id: "summary", label: "Summary" } : null,
    showSocial ? { id: "social", label: "Social Media" } : null,
    showBlogs ? { id: "blogs", label: "Blogs" } : null,
    showWebsite ? { id: "website", label: "Website" } : null,
    showGmb ? { id: "gmb", label: "Google Business" } : null,
  ].filter((item): item is { id: string; label: string } => item !== null);

  const published = formatDate(report.publishedAt ?? report.periodEnd);

  return (
    <div className={`${poppins.className} flex flex-col gap-4.5`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-[12px] text-[#4b5260]">
            <Link href="/reports" className="cursor-pointer hover:underline">
              Reports
            </Link>{" "}
            / <span className="font-semibold text-[#0b0c24]">{label}</span>
          </div>
          <h1 className="text-[28px] leading-tight font-bold text-[#0b0c24]">{report.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[#4b5563]">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#d6eadb] px-2.5 py-1 text-[10.5px] font-semibold text-[#15803d]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" /> Ready
            </span>
            <span className="rounded-md px-2.5 py-1 text-[10.5px] font-medium" style={{ background: meta.pillBg, color: meta.pillColor }}>
              {meta.label}
            </span>
            <span>{dateRange(report)}</span>
            <span className="text-[#c4c8ce]">•</span>
            <span>Generated {published} by BayShore Communication</span>
          </div>
        </div>
        <DownloadButton />
      </div>

      {sections.length > 1 ? (
        <nav className="sticky top-0 z-5 -my-1 flex flex-wrap gap-2 bg-[#f2f5f3] py-2 print:hidden" aria-label="Report sections">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-lg border border-[#e2e5e9] bg-white px-3.5 py-1.5 text-[11.5px] font-medium text-[#1f2530] no-underline hover:border-[#0b0c24]"
            >
              {section.label}
            </a>
          ))}
        </nav>
      ) : null}

      {paragraphs.length > 0 ? (
        <div
          className="scroll-mt-14 rounded-2xl border border-[#e6e8eb] bg-white px-6 py-5 text-[13px] leading-[1.75] text-[#374151] shadow-[0_2px_6px_rgba(15,23,42,0.05)] print:break-inside-avoid"
          id="summary"
        >
          <p className="mb-3 last:mb-0">Hi {firstNameOf(name)},</p>
          {paragraphs.map((paragraph, index) => (
            <p className="mb-3 last:mb-0" key={index}>
              {paragraph}
            </p>
          ))}
          <p className="mb-3 last:mb-0">
            Below is the full breakdown for {label}
            {previous
              ? `, compared against ${periodLabel({ periodType: type, periodStart: previous.periodStart, periodEnd: previous.periodEnd })}`
              : ""}
            .
          </p>
          <p className="font-semibold text-[#0b0c24]">— The BayShore Communication Team</p>
        </div>
      ) : null}

      {showSocial ? (
        <Card id="social" badge={{ icon: Share2, ...BLUE }} title="Social Media Content Performance">
          {socialMetrics.length > 0 ? <StatGrid metrics={socialMetrics} /> : null}

          {hasReel ? (
            <div className={`${tileClass} flex items-center gap-3 px-4 py-3`}>
              <IconBadge badge={{ icon: Play, color: "#dc2626", background: "#f4d7db" }} size="sm" />
              <div className="min-w-0">
                {reel?.title ? (
                  <div className="text-[12px] font-semibold text-[#1f2530]">
                    &quot;{reel.title}&quot; <span className="font-normal text-[#4b5563]">— best-performing short of the period.</span>
                  </div>
                ) : null}
                {typeof reel?.views === "number" ? (
                  <div className="mt-0.5 text-[11px] text-[#6b7280]">
                    Views <b className="font-semibold text-[#1f2530]">{reel.views.toLocaleString("en-US")}</b>
                    {typeof previous?.social?.reel?.views === "number" ? (
                      <>
                        {" "}
                        vs {previousName} <b className="font-semibold text-[#1f2530]">{previous.social.reel.views.toLocaleString("en-US")}</b>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {typeof reel?.views === "number" ? (
                <div className="ml-auto">
                  <Delta change={changeBetween(reel.views, previous?.social?.reel?.views)} />
                </div>
              ) : null}
            </div>
          ) : null}
        </Card>
      ) : null}

      {showBlogs ? (
        <Card
          id="blogs"
          badge={{ icon: FileText, ...ORANGE }}
          title="Blogs"
          aside={<Pill>{`${report.blogs.length} ${report.blogs.length === 1 ? "blog" : "blogs"}`}</Pill>}
        >
          <div className="flex flex-col gap-2.5">
            {report.blogs.map((blog, index) => {
              const detail = [
                blog.publishedAt ? `Published ${formatDate(blog.publishedAt)}` : null,
                typeof blog.graphicsCount === "number"
                  ? `${blog.graphicsCount} ${blog.graphicsCount === 1 ? "graphic" : "graphics"}`
                  : null,
              ]
                .filter(Boolean)
                .join(" • ");

              const content = (
                <>
                  <div className="flex min-w-0 items-center gap-3">
                    <IconBadge badge={{ icon: FileText, color: "#4b5260", background: "#eceef1" }} size="sm" />
                    <div className="min-w-0">
                      <div className="truncate text-[12.5px] font-semibold text-[#1f2530] group-hover:text-[#2f5fd8]">{blog.title}</div>
                      {detail ? <div className="mt-0.5 text-[10.5px] text-[#6b7280]">{detail}</div> : null}
                    </div>
                  </div>
                  {blog.url ? (
                    <span
                      className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-[#e3e8f1] text-[#4a5877] group-hover:bg-[#d5dce8]"
                      aria-hidden="true"
                    >
                      <ArrowUpRight size={14} strokeWidth={2} />
                    </span>
                  ) : null}
                </>
              );

              const rowClass = `${tileClass} flex items-center justify-between gap-3 px-4 py-3`;

              // A blog with a link is one big tap target; without one it's just a row.
              return blog.url ? (
                <a
                  className={`${rowClass} group text-inherit no-underline hover:border-[#dde1e6] hover:bg-white`}
                  key={`${blog.title}-${index}`}
                  href={/^https?:\/\//i.test(blog.url) ? blog.url : `https://${blog.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${blog.title}`}
                >
                  {content}
                </a>
              ) : (
                <div className={rowClass} key={`${blog.title}-${index}`}>
                  {content}
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {showWebsite ? (
        <Card id="website" badge={{ icon: Globe, ...ORANGE }} title="Website Performance">
          {charts.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3.5">
              {charts.map((chart, index) => (
                <ComparisonChart
                  key={chart.title}
                  badge={chart.badge}
                  title={chart.title}
                  sub={chart.sub}
                  previous={chart.previous}
                  current={chart.current}
                  previousName={previousName}
                  currentName={currentName}
                  footer={chartFooters[index]}
                />
              ))}
            </div>
          ) : (
            <StatGrid metrics={websiteMetrics} />
          )}
        </Card>
      ) : null}

      {showGmb ? (
        <Card
          id="gmb"
          badge={{ icon: Store, ...BLUE }}
          title="GMB Performance"
          aside={
            <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#e6e8eb] bg-white px-3.5 text-[12px] font-medium text-[#0b0c24] shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
              <CalendarDays size={14} strokeWidth={2} /> {label}
            </span>
          }
        >
          {gmbMetrics.length > 0 ? <StatGrid metrics={gmbMetrics} /> : null}

          {locations.length > 0 ? (
            <div className={`${tileClass} p-4`}>
              <div className="mb-5 flex items-center gap-3">
                <IconBadge badge={{ icon: MapPin, ...BLUE }} size="lg" />
                <div>
                  <div className="text-[12px] font-semibold text-[#0b0c24] uppercase">By Location</div>
                  <div className="mt-0.5 text-[11px] text-[#6b7280]">Performance breakdown by business location</div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0 text-[12px]">
                  <thead>
                    <tr>
                      {["Location", "Impressions", "Calls", "Directions"].map((heading, index, all) => (
                        <th
                          key={heading}
                          className={`border-y border-[#e6e8eb] bg-[#f3f4f6] py-3 text-[12px] font-medium whitespace-nowrap text-[#1f2530] ${
                            index === 0 ? "rounded-l-lg border-l pl-6 text-left" : "px-3 text-center"
                          } ${index === all.length - 1 ? "rounded-r-lg border-r" : ""}`}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {locations.map((location, index) => {
                      const before = previousLocation(location.name);
                      const rowBorder = index < locations.length - 1 ? "border-b border-[#eceef1]" : "";
                      const cells = [
                        [location.impressions, before?.impressions],
                        [location.calls, before?.calls],
                        [location.directions, before?.directions],
                      ] as const;

                      return (
                        <tr key={`${location.name}-${index}`}>
                          <td className={`${rowBorder} py-5 pl-6 font-medium text-[#0b0c24]`}>{location.name}</td>
                          {cells.map(([value, earlier], cellIndex) => (
                            <td key={cellIndex} className={`${rowBorder} px-3 py-5 text-center whitespace-nowrap text-[#1f2530]`}>
                              {typeof value === "number" ? (
                                <span className="inline-flex items-center gap-2.5">
                                  {value.toLocaleString("en-US")}
                                  <Delta change={changeBetween(value, earlier)} />
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}

      {!paragraphs.length && !showSocial && !showBlogs && !showWebsite && !showGmb ? (
        <div className="rounded-2xl border border-[#e6e8eb] bg-white px-6 py-12 text-center text-[13px] text-[#6b7280]">
          This report has no figures yet.
        </div>
      ) : null}

      <div className="px-0.5 py-1 text-[11.5px] text-[#6b7280]">
        Prepared by BayShore Communication for {name} · {published}
      </div>
    </div>
  );
};

export default ReportDetails;
