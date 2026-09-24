"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Download, Eye, FileText, RotateCcw, Search, SearchX } from "lucide-react";
import type { MyReportListItem, ReportPeriodType } from "@/app/actions/reports";
import { poppins } from "@/component/shared/fonts";
import { PERIOD_TYPES, formatDate, periodLabel } from "./reportUi";

const PAGE_SIZE = 10;

// "August 2026" — the month a report starts in, for the month filter.
const monthOf = (report: MyReportListItem) =>
  new Date(report.periodStart).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

const inputClass =
  "h-9.5 w-full cursor-pointer appearance-none rounded-lg border border-[#e2e5e9] bg-white pr-8 pl-3 text-[12px] font-medium text-[#1f2530] outline-none focus:border-[#9aa3af]";

const thClass = "bg-[#f3f4f6] px-3 py-2.5 text-[11.5px] font-medium whitespace-nowrap text-[#4b5260]";
const tdClass = "border-b border-[#eef0f2] px-3 py-3.5 text-[12px] whitespace-nowrap text-[#1f2530]";

const pageButtonClass = "flex h-6.5 min-w-6.5 cursor-pointer items-center justify-center rounded-md border px-1.5 text-[11.5px] font-medium";

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
    <div className={`${poppins.className} flex flex-col gap-4.5`}>
      <div>
        <div className="mb-1 text-[12px] text-[#4b5260]">
          <Link href="/dashboard" className="cursor-pointer hover:underline">
            Reports
          </Link>{" "}
          / <span className="font-semibold text-[#0b0c24]">My Reports</span>
        </div>
        <div className="text-[28px] leading-tight font-bold text-[#0b0c24]">My Reports</div>
        <div className="mt-1 text-[12.5px] text-[#4b5563]">
          {reports.length > 0
            ? "Access and view all your reports. Filter by type or month to find what you need."
            : "Reports your account manager publishes for you will appear here."}
        </div>
      </div>

      {reports.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#e6e8eb] bg-white p-3.5 shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
          <div className="relative w-45">
            <select
              className={inputClass}
              aria-label="Report type"
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
            <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#1f2530]" />
          </div>
          <div className="relative w-45">
            <CalendarDays
              size={14}
              strokeWidth={2}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#1f2530]"
            />
            <select
              className={`${inputClass} pl-8.5`}
              aria-label="Report month"
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
            <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#1f2530]" />
          </div>
          <div className="ml-auto flex h-9.5 w-full max-w-112.5 items-center gap-2.5 rounded-lg border border-[#e2e5e9] bg-white px-3 focus-within:border-[#9aa3af]">
            <Search size={15} strokeWidth={2} className="shrink-0 text-[#1f2530]" />
            <input
              type="text"
              placeholder="Search reports..."
              aria-label="Search reports"
              className="w-full border-none bg-transparent text-[12px] text-[#1f2530] outline-none placeholder:text-[#6b7280]"
              value={query}
              onChange={(event) => onFilterChange(() => setQuery(event.target.value))}
            />
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#e6e8eb] bg-white p-3.5 shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-11 text-center">
            <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d9e0ef] text-[#2f5fd8]">
              {hasFilters ? <SearchX size={24} strokeWidth={1.8} /> : <FileText size={24} strokeWidth={1.8} />}
            </div>
            <div className="text-lg font-semibold text-[#0b0c24]">
              {hasFilters ? "No reports match these filters" : "No reports yet"}
            </div>
            <div className="mt-2 mb-4.5 max-w-90 text-[12.5px] leading-normal text-[#4b5563]">
              {hasFilters
                ? "Try a different type, month or search."
                : "Your account manager will publish your first report here. You'll see it as soon as it's ready."}
            </div>
            {hasFilters ? (
              <button
                type="button"
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#0b0c24] px-4.5 py-2.25 text-[12.5px] font-medium text-white hover:bg-[#1e2140]"
                onClick={clearFilters}
              >
                <RotateCcw size={13} strokeWidth={2} /> Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className={`${thClass} w-14 rounded-l-lg text-center`}>#</th>
                  <th className={`${thClass} text-left`}>Report Name</th>
                  <th className={`${thClass} text-center`}>Type</th>
                  <th className={`${thClass} text-center`}>Period</th>
                  <th className={`${thClass} text-center`}>Published</th>
                  <th className={`${thClass} w-40 rounded-r-lg text-center`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((report, index) => {
                  const meta = PERIOD_TYPES[report.periodType];

                  return (
                    <tr key={report._id} className="hover:bg-[#f9fafb]">
                      <td className={`${tdClass} text-center font-medium`}>{String(start + index + 1).padStart(2, "0")}</td>
                      <td className={tdClass}>
                        <Link href={`/reports/${report._id}`} className="font-medium text-[#1f2530] no-underline hover:text-[#2f5fd8]">
                          {report.title}
                        </Link>
                      </td>
                      <td className={`${tdClass} text-center`}>
                        <span
                          className="inline-block rounded-md px-3 py-1 text-[10.5px] font-medium"
                          style={{ background: meta.pillBg, color: meta.pillColor }}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className={`${tdClass} text-center`}>{periodLabel(report)}</td>
                      <td className={`${tdClass} text-center text-[#4b5260]`}>{formatDate(report.publishedAt ?? report.periodEnd)}</td>
                      <td className={tdClass}>
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/reports/${report._id}`}
                            className="inline-flex h-6.5 items-center gap-1.25 rounded-md border border-[#e2e5e9] bg-white px-2.5 text-[11px] font-medium text-[#1f2530] no-underline hover:bg-[#f3f4f6]"
                          >
                            <Eye size={13} strokeWidth={2} /> View
                          </Link>
                          <Link
                            href={`/reports/${report._id}?print=1`}
                            className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-md bg-[#f3f4f6] text-[#1f2530] no-underline hover:bg-[#e5e7eb]"
                            title="Download PDF"
                            aria-label={`Download ${report.title}`}
                          >
                            <Download size={13} strokeWidth={2} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {visible.length > 0 ? (
          <div className="mt-4 flex items-center justify-between px-1 text-[12px] text-[#1f2530]">
            <span>
              Showing {start + 1}–{start + visible.length} of {filtered.length} {filtered.length === 1 ? "report" : "reports"}
            </span>
            {/* One page of results needs no page buttons. */}
            {pageCount > 1 ? (
              <div className="flex items-center gap-1.5">
                <button
                  className="flex h-6.5 w-6.5 cursor-pointer items-center justify-center rounded-md text-[#0b0c24] hover:bg-[#f3f4f6] disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} strokeWidth={2.25} />
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((number) => (
                  <button
                    key={number}
                    className={`${pageButtonClass} ${
                      number === currentPage
                        ? "border-[#0b0c24] bg-[#0b0c24] text-white"
                        : "border-[#e2e5e9] bg-white text-[#1f2530] hover:bg-[#f3f4f6]"
                    }`}
                    aria-current={number === currentPage ? "page" : undefined}
                    onClick={() => setPage(number)}
                  >
                    {number}
                  </button>
                ))}
                <button
                  className="flex h-6.5 w-6.5 cursor-pointer items-center justify-center rounded-md text-[#0b0c24] hover:bg-[#f3f4f6] disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage(currentPage + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} strokeWidth={2.25} />
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Reports;
