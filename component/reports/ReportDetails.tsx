"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUp, Camera, Download, FileText, Minus, Play, Smartphone } from "lucide-react";
import type { MyReport, MyReportPrevious, ReportPeriodType } from "@/app/actions/reports";
import { useSessionUser } from "@/component/shared/SessionUser";
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

type Metric = { label: string; value: number; previous?: number };

// Keeps only the figures the report actually has.
const present = (rows: [label: string, value?: number, previous?: number][]): Metric[] =>
  rows.flatMap(([label, value, previous]) => (typeof value === "number" ? [{ label, value, previous }] : []));

const Delta = ({ change }: { change: Change | null }) => {
  if (!change) return null;

  const flat = change.direction === "flat";
  const Icon = change.direction === "up" ? ArrowUp : change.direction === "down" ? ArrowDown : Minus;
  const color = change.direction === "down" ? "#dc2626" : flat ? "#7b8e9d" : undefined;

  return (
    <div className="metric-delta" style={{ display: "inline-flex", alignItems: "center", gap: 3, color, marginTop: 0 }}>
      <Icon size={11} strokeWidth={2.5} /> {flat ? "No change" : `${change.percent}%`}
    </div>
  );
};

const MetricsRibbon = ({ metrics }: { metrics: Metric[] }) => (
  <div className="metrics-ribbon">
    {metrics.map((metric) => (
      <div className="metric-box" key={metric.label}>
        <div className="metric-val">{formatMetric(metric.value)}</div>
        <div className="metric-label">{metric.label}</div>
        <div style={{ marginTop: 4, minHeight: 16 }}>
          <Delta change={changeBetween(metric.value, metric.previous)} />
        </div>
      </div>
    ))}
  </div>
);

const BAR_MAX_HEIGHT = 110;
const BAR_MIN_HEIGHT = 6;

// Last period against this period, scaled against each other, with what changed.
const ComparisonChart = ({
  title,
  previous,
  current,
  previousName,
  currentName,
}: {
  title: string;
  previous?: number;
  current: number;
  previousName: string;
  currentName: string;
}) => {
  const largest = Math.max(previous ?? 0, current);
  const height = (value: number) =>
    largest === 0 ? BAR_MIN_HEIGHT : Math.max(BAR_MIN_HEIGHT, Math.round((value / largest) * BAR_MAX_HEIGHT));

  const bars = [
    { name: previousName, value: previous, color: "#e6c88b" },
    { name: currentName, value: current, color: "#d99136" },
  ].filter((bar): bar is { name: string; value: number; color: string } => typeof bar.value === "number");

  return (
    <div className="chart-card">
      <div className="chart-card-head">
        <span className="chart-card-title">{title}</span>
        <Delta change={changeBetween(current, previous)} />
      </div>
      <div className="chart-card-bars">
        {bars.map((bar) => (
          <div className="bar-container" key={bar.name}>
            <span className="bar-val">{formatMetric(bar.value)}</span>
            <div className="chart-bar" style={{ height: height(bar.value), background: bar.color }} />
            <span className="chart-bar-lbl">{bar.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DownloadButton = () => (
  <button
    className="btn-download-pdf"
    onClick={() => window.print()}
    style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
  >
    <Download size={14} strokeWidth={2} /> Download PDF
  </button>
);

const SectionTitle = ({ color, children, count }: { color: "blue" | "amber" | "teal"; children: string; count?: string }) => (
  <div className="section-title-wrap">
    <div className={`title-indicator indicator-${color}`} />
    <span className="section-title">{children}</span>
    {count ? <span className="section-count">{count}</span> : null}
  </div>
);

const Card = ({ id, children }: { id: string; children: ReactNode }) => (
  <div className="report-card" id={id}>
    {children}
  </div>
);

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
  const { name, initials } = useSessionUser();

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
    ["Facebook Reach", social?.facebookReach, previous?.social?.facebookReach],
    ["Instagram Reach", social?.instagramReach, previous?.social?.instagramReach],
    ["Twitter / X Reach", social?.twitterReach, previous?.social?.twitterReach],
    ["LinkedIn Reach", social?.linkedinReach, previous?.social?.linkedinReach],
  ]);
  const reel = social?.reel;
  const hasReel = Boolean(reel?.title) || typeof reel?.views === "number";

  const websiteMetrics = present([
    ["Backlinks", website?.backlinks, previous?.website?.backlinks],
    ["Referring Domains", website?.referringDomains, previous?.website?.referringDomains],
    ["Leads Forwarded", website?.leadsForwarded, previous?.website?.leadsForwarded],
    ["Website Clicks", website?.clicks, previous?.website?.clicks],
  ]);
  const showWebsiteChart = hasNumbers({ impressions: website?.impressions, clicks: website?.clicks });

  const gmbMetrics = present([
    ["Impressions", gmb?.impressions, previous?.gmb?.impressions],
    ["Calls", gmb?.calls, previous?.gmb?.calls],
    ["Direction Requests", gmb?.directionRequests, previous?.gmb?.directionRequests],
    ["Website Clicks", gmb?.websiteClicks, previous?.gmb?.websiteClicks],
  ]);
  const locations = gmb?.locations ?? [];

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

  return (
    <>
      <div className="breadcrumb-row">
        <div className="breadcrumbs">
          <Link href="/reports" className="breadcrumb-link">
            Reports
          </Link>{" "}
          / <b>{label}</b>
        </div>
        <div className="client-tag">
          <div className="client-avatar">{initials}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{name}</div>
            <div style={{ fontSize: 10, color: "#6c7e8d" }}>Client Account</div>
          </div>
        </div>
      </div>

      <div className="headline-row">
        <div>
          <div className="page-title">{report.title}</div>
          <div className="meta-status-line">
            <span className="pill-ready">
              <span className="dot-green" /> Ready
            </span>
            <span className="type-pill" style={{ background: meta.pillBg, color: meta.pillColor }}>
              {meta.label}
            </span>
            <span>{dateRange(report)}</span>
          </div>
          <div className="meta-generated">
            Generated {formatDate(report.publishedAt ?? report.periodEnd)} by BayShore Communication
          </div>
        </div>
        <div className="action-buttons">
          <DownloadButton />
        </div>
      </div>

      {sections.length > 1 ? (
        <nav className="report-nav" aria-label="Report sections">
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.label}
            </a>
          ))}
        </nav>
      ) : null}

      {paragraphs.length > 0 ? (
        <div className="executive-summary-card" id="summary">
          <p>Hi {firstNameOf(name)},</p>
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          <p>
            Below is the full breakdown for {label}
            {previous
              ? `, compared against ${periodLabel({ periodType: type, periodStart: previous.periodStart, periodEnd: previous.periodEnd })}`
              : ""}
            .
          </p>
          <p className="signature-text">— The BayShore Communication Team</p>
        </div>
      ) : null}

      {showSocial ? (
        <Card id="social">
          <div className="section-header">
            <SectionTitle color="blue">Social Media Content Performance</SectionTitle>
            <div style={{ display: "flex", gap: 8, color: "#7b8e9d" }}>
              <Camera size={15} strokeWidth={2} />
              <Smartphone size={15} strokeWidth={2} />
            </div>
          </div>

          {socialMetrics.length > 0 ? <MetricsRibbon metrics={socialMetrics} /> : null}

          {hasReel ? (
            <div className="reel-callout">
              <div className="reel-badge" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Play size={11} strokeWidth={2.5} /> Reel
              </div>
              <div>
                {reel?.title ? <div className="reel-title">&quot;{reel.title}&quot; — best-performing short of the period.</div> : null}
                {typeof reel?.views === "number" ? (
                  <div className="reel-stats">
                    Views <b>{reel.views.toLocaleString("en-US")}</b>
                    {typeof previous?.social?.reel?.views === "number" ? (
                      <>
                        {" "}
                        vs {previousName} <b>{previous.social.reel.views.toLocaleString("en-US")}</b>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}

      {showBlogs ? (
        <Card id="blogs">
          <SectionTitle color="amber" count={`${report.blogs.length} ${report.blogs.length === 1 ? "blog" : "blogs"}`}>
            Blogs
          </SectionTitle>

          <div>
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
                  <div className="blog-left">
                    <div className="blog-icon">
                      <FileText size={16} strokeWidth={2} />
                    </div>
                    <div>
                      <div className="blog-title">{blog.title}</div>
                      {detail ? <div className="blog-meta">{detail}</div> : null}
                    </div>
                  </div>
                  {blog.url ? (
                    <span className="arrow-link" aria-hidden="true">
                      <ArrowRight size={16} strokeWidth={2} />
                    </span>
                  ) : null}
                </>
              );

              // A blog with a link is one big tap target; without one it's just a row.
              return blog.url ? (
                <a
                  className="blog-item blog-item-link"
                  key={`${blog.title}-${index}`}
                  href={/^https?:\/\//i.test(blog.url) ? blog.url : `https://${blog.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${blog.title}`}
                >
                  {content}
                </a>
              ) : (
                <div className="blog-item" key={`${blog.title}-${index}`}>
                  {content}
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {showWebsite ? (
        <Card id="website">
          <SectionTitle color="amber">Website Performance</SectionTitle>

          {showWebsiteChart ? (
            <div className="chart-grid">
              {typeof website?.impressions === "number" ? (
                <ComparisonChart
                  title="Impressions"
                  previous={previous?.website?.impressions}
                  current={website.impressions}
                  previousName={previousName}
                  currentName={currentName}
                />
              ) : null}
              {typeof website?.clicks === "number" ? (
                <ComparisonChart
                  title="Clicks"
                  previous={previous?.website?.clicks}
                  current={website.clicks}
                  previousName={previousName}
                  currentName={currentName}
                />
              ) : null}
            </div>
          ) : null}

          {websiteMetrics.length > 0 ? <MetricsRibbon metrics={websiteMetrics} /> : null}
        </Card>
      ) : null}

      {showGmb ? (
        <Card id="gmb">
          <SectionTitle color="teal">GMB Performance</SectionTitle>

          {gmbMetrics.length > 0 ? <MetricsRibbon metrics={gmbMetrics} /> : null}

          {locations.length > 0 ? (
            <div>
              <div className="report-subheading">By Location</div>
              <div className="report-table-scroll">
                <table className="gmb-table">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Impressions</th>
                      <th>Calls</th>
                      <th>Directions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locations.map((location, index) => (
                      <tr key={`${location.name}-${index}`}>
                        <td className="location-name">{location.name}</td>
                        <td>{location.impressions?.toLocaleString("en-US") ?? "—"}</td>
                        <td>{location.calls?.toLocaleString("en-US") ?? "—"}</td>
                        <td>{location.directions?.toLocaleString("en-US") ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}

      {!paragraphs.length && !showSocial && !showBlogs && !showWebsite && !showGmb ? (
        <div className="report-card">
          <div className="report-empty">This report has no figures yet.</div>
        </div>
      ) : null}

      <div className="report-footer">
        <span>
          Prepared by BayShore Communication for {name} · {formatDate(report.publishedAt ?? report.periodEnd)}
        </span>
        <DownloadButton />
      </div>
    </>
  );
};

export default ReportDetails;
