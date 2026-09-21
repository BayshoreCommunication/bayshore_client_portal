"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Download, Eye, FileText, RotateCcw, Search, SearchX } from "lucide-react";
import type { MyReportListItem, ReportPeriodType } from "@/app/actions/reports";
import { UserBadge } from "@/component/shared/SessionUser";
import { PERIOD_TYPES, dateRange, formatDate } from "./reportUi";

const PAGE_SIZE = 10;

// "August 2026" — the month a report starts in, for the month filter.
const monthOf = (report: MyReportListItem) =>
  new Date(report.periodStart).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

const Reports = ({ reports }: { reports: MyReportListItem[] }) => {
  const [type, setType] = useState<ReportPeriodType | "all">("all");
  const [month, setMonth] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // Newest first, as they arrive from the server.
  const monthOptions = useMemo(() => Array.from(new Set(reports.map(monthOf))), [reports]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return reports.filter(
      (report) =>
        (type === "all" || report.periodType === type) &&
        (month === "all" || monthOf(report) === month) &&
        (!needle || report.title.toLowerCase().includes(needle))
    );
  }, [reports, type, month, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  const hasFilters = type !== "all" || month !== "all" || query.trim() !== "";

  const onFilterChange = (apply: () => void) => {
    apply();
    setPage(1);
  };

  const clearFilters = () => {
    setType("all");
    setMonth("all");
    setQuery("");
    setPage(1);
  };

  return (
    <>
      <div className="breadcrumb-row">
        <div className="breadcrumbs">
          <Link href="/dashboard" className="breadcrumb-link">
            Reports
          </Link>{" "}
          / <b>My Reports</b>
        </div>
        <UserBadge />
      </div>

      <div>
        <div className="page-title">My Reports</div>
        <div className="page-desc">
          {reports.length > 0
            ? `${reports.length} ${reports.length === 1 ? "report" : "reports"} shared with you. Filter by type or month to find what you need.`
            : "Reports your account manager publishes for you will appear here."}
        </div>
      </div>

      {reports.length > 0 ? (
        <div className="reports-filter-row">
          <select
            className="input-text"
            aria-label="Report type"
            style={{ maxWidth: 180 }}
            value={type}
            onChange={(event) => onFilterChange(() => setType(event.target.value as ReportPeriodType | "all"))}
          >
            <option value="all">All Types</option>
            {(Object.keys(PERIOD_TYPES) as ReportPeriodType[]).map((key) => (
              <option key={key} value={key}>
                {PERIOD_TYPES[key].label}
              </option>
            ))}
          </select>
          <div style={{ position: "relative", maxWidth: 200, flex: 1, minWidth: 150 }}>
            <CalendarDays
              size={14}
              strokeWidth={2}
              style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#7a8e9b", pointerEvents: "none" }}
            />
            <select
              className="input-text"
              aria-label="Report month"
              style={{ paddingLeft: 32 }}
              value={month}
              onChange={(event) => onFilterChange(() => setMonth(event.target.value))}
            >
              <option value="all">All Months</option>
              {monthOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="dash-search reports-search">
            <Search size={14} strokeWidth={2} className="dash-search-icon" />
            <input
              type="text"
              placeholder="Search reports..."
              aria-label="Search reports"
              value={query}
              onChange={(event) => onFilterChange(() => setQuery(event.target.value))}
            />
          </div>
        </div>
      ) : null}

      <div className="section-card">
        {visible.length === 0 ? (
          <div className="reports-empty">
            <div className="reports-empty-icon">{hasFilters ? <SearchX size={24} strokeWidth={1.8} /> : <FileText size={24} strokeWidth={1.8} />}</div>
            <div className="reports-empty-title">{hasFilters ? "No reports match these filters" : "No reports yet"}</div>
            <div className="reports-empty-desc">
              {hasFilters
                ? "Try a different type, month or search."
                : "Your account manager will publish your first report here. You'll see it as soon as it's ready."}
            </div>
            {hasFilters ? (
              <button type="button" className="btn-draft" onClick={clearFilters} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <RotateCcw size={13} strokeWidth={2} /> Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="reports-table-wrap">
            <table className="reports-full-table">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Type</th>
                  <th>Period</th>
                  <th>Published</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((report) => {
                  const meta = PERIOD_TYPES[report.periodType];

                  return (
                    <tr key={report._id}>
                      <td>
                        <Link href={`/reports/${report._id}`} className="report-name-link">
                          <span className="report-row-icon" style={{ background: meta.iconBg, color: meta.iconColor }}>
                            <FileText size={14} strokeWidth={2} />
                          </span>
                          {report.title}
                        </Link>
                      </td>
                      <td>
                        <span className="type-pill" style={{ background: meta.pillBg, color: meta.pillColor }}>
                          {meta.label}
                        </span>
                      </td>
                      <td>{dateRange(report)}</td>
                      <td style={{ color: "#64748b" }}>{formatDate(report.publishedAt ?? report.periodEnd)}</td>
                      <td className="reports-action-cell">
                        <Link
                          href={`/reports/${report._id}`}
                          className="btn-view-report-sm"
                          style={{ display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none" }}
                        >
                          <Eye size={13} strokeWidth={2} /> View
                        </Link>
                        <Link
                          href={`/reports/${report._id}?print=1`}
                          className="reports-icon-btn"
                          title="Download PDF"
                          aria-label={`Download ${report.title}`}
                        >
                          <Download size={14} strokeWidth={2} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* One page of results needs no footer. */}
        {pageCount > 1 ? (
          <div className="clients-pagination" style={{ marginTop: 16 }}>
            <span>
              Showing {start + 1}–{start + visible.length} of {filtered.length} reports
            </span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page">
                <ChevronLeft size={14} strokeWidth={2} />
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((number) => (
                <button
                  key={number}
                  className={`page-btn${number === currentPage ? " active" : ""}`}
                  aria-current={number === currentPage ? "page" : undefined}
                  onClick={() => setPage(number)}
                >
                  {number}
                </button>
              ))}
              <button className="page-btn" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Next page">
                <ChevronRight size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};

export default Reports;
