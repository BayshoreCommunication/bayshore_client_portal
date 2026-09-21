import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  FileText,
  Image as ImageIcon,
  Mail,
  Play,
  Search,
  type LucideIcon,
} from "lucide-react";
import Trend from "@/component/shared/Trend";
import StatusPill from "@/component/shared/StatusPill";
import { UserBadge } from "@/component/shared/SessionUser";
import { PERIOD_TYPES, periodLabel } from "@/component/reports/reportUi";
import { pendingItems, upcomingMeetings } from "./data";
import { changeText, type DashboardMetric, type DashboardModel } from "./dashboardData";

const PENDING_STYLES: Record<string, { icon: LucideIcon; background: string; color: string }> = {
  blog: { icon: Mail, background: "#f3e6c9", color: "#a35a12" },
  reel: { icon: Play, background: "#fbdada", color: "#b91c1c" },
  post: { icon: ImageIcon, background: "#f3e6c9", color: "#a35a12" },
  approved: { icon: ImageIcon, background: "#dcf3e2", color: "#15803d" },
};

// The ▲/▼ line under a figure. Nothing to compare against (or no change) shows nothing.
const MetricTrend = ({ metric, note }: { metric: DashboardMetric; note: string | null }) =>
  metric.change && metric.change.direction !== "flat" ? (
    <Trend direction={metric.change.direction} value={`${metric.change.percent}%`} note={note ? `vs ${note}` : undefined} />
  ) : null;

const Dashboard = ({ name, model, error }: { name: string; model: DashboardModel | null; error?: string }) => {
  return (
    <>
      <div className="dash-top-row">
        <div className="dash-search">
          <Search size={14} strokeWidth={2} className="dash-search-icon" />
          <input type="text" placeholder="Search reports, content, services..." />
        </div>
        <div className="dash-date-pill" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <CalendarDays size={14} strokeWidth={2} /> {model?.period ?? "No reports yet"}
        </div>
        <button className="dash-bell-btn" aria-label="Notifications">
          <Bell size={16} strokeWidth={2} />
          <span className="dash-bell-badge">4</span>
        </button>
        <UserBadge />
      </div>

      <div className="dash-welcome-row">
        <div>
          <div className="dash-welcome-title">Welcome back, {name}</div>
          <div className="page-desc">
            {model
              ? `Here's how your marketing performed in ${model.period}${model.comparedWith ? `, compared to ${model.comparedWith}` : ""}.`
              : "Your performance figures will appear here as soon as your first report is published."}
          </div>
        </div>
      </div>

      {error ? (
        <div className="report-error-banner" role="alert" style={{ marginTop: 0 }}>
          {error}
        </div>
      ) : null}

      {model && model.metrics.length > 0 ? (
        <div className="dash-metrics-grid">
          {model.metrics.map((metric) => (
            <div className="dash-metric-card" key={metric.label}>
              <div className="dash-metric-lbl">{metric.label}</div>
              <div className="dash-metric-val">{metric.value}</div>
              <MetricTrend metric={metric} note={model.comparedNote} />
            </div>
          ))}
        </div>
      ) : null}

      <div className="dash-channel-header">
        <div className="section-title" style={{ fontSize: 16 }}>
          Performance by Channel
        </div>
        {model ? (
          <Link href={`/reports/${model.latestId}`} className="dash-link" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            View full report <ArrowRight size={13} strokeWidth={2.5} />
          </Link>
        ) : null}
      </div>

      <div className="dash-main-grid">
        {!model || model.channels.length === 0 ? (
          <div className="report-card">
            <div className="report-empty">
              {model ? "The latest report has no channel figures yet." : "No published reports yet. Your account manager will share your first one here."}
            </div>
          </div>
        ) : (
        <div className="dash-channel-grid">
          {model.channels.map((channel) => (
            <div className="dash-channel-card" key={channel.name}>
              <div className="dash-channel-top">
                <div className="dash-channel-name">
                  <span className="ch-dot" style={{ background: channel.color }} /> {channel.name}
                </div>
                <div className="dash-channel-sub">{channel.sub}</div>
              </div>
              <div className="dash-channel-num">
                {channel.headline}
                <span>{channel.headlineLabel}</span>
              </div>
              <div className="dash-bars">
                {channel.bars.map((bar, index) => {
                  const isCurrent = index === channel.bars.length - 1;
                  return (
                    <div
                      key={`${bar.label}-${index}`}
                      className={`dash-bar${isCurrent ? " active" : ""}`}
                      style={{ height: `${bar.height}%`, background: isCurrent ? channel.color : channel.tint }}
                    >
                      <span>{bar.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="dash-submetrics">
                {channel.subMetrics.map((metric) => (
                  <div key={metric.label}>
                    <div className="sm-lbl">{metric.label}</div>
                    <div className="sm-val">{metric.value}</div>
                    {metric.change ? (
                      <div className={`sm-trend ${metric.change.direction === "down" ? "trend-down" : "trend-up"}`}>
                        {changeText(metric.change)}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        )}

        <div className="dash-side-col">
          <div className="side-card">
            <div className="side-header">
              <div className="side-title">Pending Your Approval</div>
              <div className="side-sub">4 items need a decision</div>
            </div>
            <div className="dash-pending-list">
              {pendingItems.map((item) => {
                const style = PENDING_STYLES[item.status === "approved" ? "approved" : item.kind];
                const Icon = style.icon;

                return (
                  <div className="dash-pending-item" key={item.title}>
                    <div className="dash-pending-icon" style={{ background: style.background, color: style.color }}>
                      <Icon size={15} strokeWidth={2} />
                    </div>
                    <div>
                      <div className="dash-pending-title">{item.title}</div>
                      <div className="dash-pending-sub">{item.sub}</div>
                      <StatusPill status={item.status} style={{ marginTop: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <Link
              href="/content"
              className="btn-review-all"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              Review All (4) <ArrowRight size={13} strokeWidth={2.5} />
            </Link>
          </div>

          <div className="side-card">
            <div className="side-header">
              <div className="side-title">Upcoming Meetings</div>
              <div className="side-sub">With your account manager</div>
            </div>
            <div className="dash-meeting-list">
              {upcomingMeetings.map((meeting) => (
                <div className="dash-meeting-item" key={meeting.title}>
                  <div className="dash-meeting-date">
                    <div className="dm-mon">{meeting.month}</div>
                    <div className="dm-day">{meeting.day}</div>
                  </div>
                  <div>
                    <div className="dash-pending-title">{meeting.title}</div>
                    <div className="dash-pending-sub">{meeting.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="side-card">
            <div className="side-header">
              <div className="side-title">Latest Reports</div>
              <div className="side-sub">Shared with you by your account manager</div>
            </div>
            {model && model.recent.length > 0 ? (
              <div className="dash-pending-list">
                {model.recent.map((report) => {
                  const meta = PERIOD_TYPES[report.periodType];

                  return (
                    <Link
                      href={`/reports/${report._id}`}
                      className="dash-pending-item"
                      key={report._id}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div className="dash-pending-icon" style={{ background: meta.iconBg, color: meta.iconColor }}>
                        <FileText size={15} strokeWidth={2} />
                      </div>
                      <div>
                        <div className="dash-pending-title">{report.title}</div>
                        <div className="dash-pending-sub">{meta.label} · {periodLabel(report)}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="dash-pending-sub" style={{ marginTop: 12 }}>
                No reports have been published yet.
              </div>
            )}
            <Link
              href="/reports"
              className="btn-review-all"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              All Reports <ArrowRight size={13} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
