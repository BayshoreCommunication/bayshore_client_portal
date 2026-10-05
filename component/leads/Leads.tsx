"use client";

import { Fragment, useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Handshake,
  Mail,
  MessageCircle,
  Phone,
  PhoneCall,
  PieChart,
  RotateCcw,
  Search,
  SearchX,
  StickyNote,
  Users,
  Workflow,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { MyLead, MyLeadListData } from "@/app/actions/leads";
import { poppins } from "@/component/shared/fonts";
import Trend from "@/component/shared/Trend";
import {
  LEAD_CHANNELS as CHANNELS,
  LEAD_CHANNEL_KEYS,
  LEAD_PERIODS,
  LEAD_SOURCES as SOURCES,
  LEAD_STATUSES as STATUSES,
  LEAD_STATUS_KEYS,
  avatarColorOf,
  formatDate,
  formatDateTime,
  initialsOf,
  leadsHref,
  pageItems,
  type LeadFilters,
} from "./leadUi";

const SEARCH_DELAY_MS = 400;

const inputClass =
  "h-9.5 w-full cursor-pointer appearance-none rounded-lg border bg-white pr-8 pl-3 text-[12px] font-medium text-[#1f2530] outline-none focus:border-[#9aa3af]";

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";

const thClass = "bg-[#f3f4f6] px-3 py-2.5 text-left text-[11.5px] font-medium whitespace-nowrap text-[#4b5260]";
const tdClass = "border-b border-[#eef0f2] px-3 py-3 text-[12px] whitespace-nowrap text-[#1f2530]";

const pageButtonClass = "flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-[12px] font-medium no-underline";

type Summary = MyLeadListData["summary"];

// ── Small pieces ─────────────────────────────────────────────────────────────

const SelectBox = ({
  label,
  value,
  onChange,
  active = value !== "all",
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  // Whether the list is narrowed by this box; defaults to "anything but all".
  active?: boolean;
  children: React.ReactNode;
}) => (
  <div className="relative w-full sm:w-42">
    <select
      // A chosen filter gets a darker border so it's clear the list is narrowed.
      className={`${inputClass} ${active ? "border-[#0b0c24]" : "border-[#e2e5e9]"}`}
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {children}
    </select>
    <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#1f2530]" />
  </div>
);

// Percent change against the period before; nothing to compare with when it had none.
const trendOf = (current: number, previous?: number) =>
  previous === undefined || previous === 0
    ? undefined
    : {
        direction: (current >= previous ? "up" : "down") as "up" | "down",
        value: `${Math.abs(Math.round(((current - previous) / previous) * 100))}%`,
      };

const SummaryTile = ({
  icon: Icon,
  label,
  sub,
  value,
  color,
  background,
  trend,
  compareLabel,
}: {
  icon: LucideIcon;
  label: string;
  sub: string;
  value: number;
  color: string;
  background: string;
  trend?: { direction: "up" | "down"; value: string };
  compareLabel?: string;
}) => (
  <div className={`${cardClass} px-4 pt-3.5 pb-4`}>
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background, color }}>
        <Icon size={19} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <div className="truncate text-[12px] font-semibold text-[#0b0c24] uppercase">{label}</div>
        <div className="mt-0.5 truncate text-[11px] text-[#6b7280]">{sub}</div>
      </div>
    </div>
    <div className="mt-3 flex items-end justify-between gap-2">
      <div className="text-[30px] leading-none font-semibold text-[#0b0c24]">{value}</div>
      {trend ? <Trend direction={trend.direction} value={trend.value} note={compareLabel} /> : null}
    </div>
  </div>
);

const qualifiedOrFurther = (summary: Summary) => summary.qualified + summary.consultation_set + summary.converted;

const SummaryTiles = ({ summary, previous, compareLabel }: { summary: Summary; previous?: Summary; compareLabel?: string }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <SummaryTile
      icon={Users}
      label="Total Leads"
      sub="Captured for you"
      value={summary.total}
      color="#2f5fd8"
      background="#d9e0ef"
      trend={trendOf(summary.total, previous?.total)}
      compareLabel={compareLabel}
    />
    {/* More leads waiting isn't good news, so this one shows no ▲/▼. */}
    <SummaryTile icon={PhoneCall} label="Awaiting Contact" sub="New, not called back yet" value={summary.new} color="#4f46e5" background="#e3e7fb" />
    <SummaryTile
      icon={BadgeCheck}
      label="Qualified"
      sub="Good fit for your firm"
      value={qualifiedOrFurther(summary)}
      color="#7c3aed"
      background="#ece4fb"
      trend={trendOf(qualifiedOrFurther(summary), previous ? qualifiedOrFurther(previous) : undefined)}
      compareLabel={compareLabel}
    />
    <SummaryTile
      icon={Handshake}
      label="Became Clients"
      sub={summary.total ? `${Math.round((summary.converted / summary.total) * 100)}% of all leads` : "No leads yet"}
      value={summary.converted}
      color="#16a34a"
      background="#d2e7d8"
      trend={trendOf(summary.converted, previous?.converted)}
      compareLabel={compareLabel}
    />
  </div>
);

const StatusPill = ({ status }: { status: MyLead["status"] }) => {
  const meta = STATUSES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium"
      style={{ background: meta.background, color: meta.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
};

// ── Search box ───────────────────────────────────────────────────────────────

// Sends the search to the URL a moment after typing stops (or on Enter).
const SearchBox = ({ search, onSearch }: { search: string; onSearch: (value: string) => void }) => {
  const [text, setText] = useState(search);
  // What this box last sent, so a change to `search` we didn't cause (Back button,
  // "Clear filters") can be told apart from our own.
  const [pushed, setPushed] = useState(search);
  const [seenSearch, setSeenSearch] = useState(search);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (search !== seenSearch) {
    setSeenSearch(search);
    if (search !== pushed) {
      setText(search);
      setPushed(search);
    }
  }

  const apply = (value: string) => {
    clearTimeout(timer.current);
    const next = value.trim();
    setPushed(next);
    onSearch(next);
  };

  const handleChange = (value: string) => {
    setText(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => apply(value), SEARCH_DELAY_MS);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") apply(text);
    if (event.key === "Escape" && text) {
      setText("");
      apply("");
    }
  };

  return (
    <div
      className="flex h-9.5 w-full items-center gap-2.5 rounded-lg border border-[#e2e5e9] bg-white px-3 focus-within:border-[#9aa3af] xl:ml-auto xl:max-w-72"
      role="search"
    >
      <Search size={15} strokeWidth={2} className="shrink-0 text-[#1f2530]" />
      <input
        type="search"
        placeholder="Search name, email or phone..."
        aria-label="Search leads"
        autoComplete="off"
        className="w-full border-none bg-transparent text-[12px] text-[#1f2530] outline-none placeholder:text-[#6b7280] [&::-webkit-search-cancel-button]:hidden"
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      {text ? (
        <button
          type="button"
          className="inline-flex cursor-pointer text-[#6b7280] hover:text-[#0b0c24]"
          aria-label="Clear search"
          onClick={() => {
            setText("");
            apply("");
          }}
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  );
};

// ── One lead's details, opened under its row ─────────────────────────────────

const DetailItem = ({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) => (
  <div className="flex min-w-0 gap-2.5">
    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-[#4b5260]">
      <Icon size={14} strokeWidth={2} />
    </span>
    <div className="min-w-0">
      <div className="text-[11px] text-[#6b7280]">{label}</div>
      <div className="mt-0.5 text-[12px] wrap-break-word whitespace-normal text-[#1f2530]">{children}</div>
    </div>
  </div>
);

const LeadDetails = ({ lead }: { lead: MyLead }) => (
  <div className="grid grid-cols-1 gap-4 rounded-xl bg-[#f6f7f9] p-4 sm:grid-cols-2">
    <DetailItem icon={Phone} label="Phone">
      {lead.phone ? (
        <a href={`tel:${lead.phone}`} className="font-medium text-[#2f5fd8] no-underline hover:underline">
          {lead.phone}
        </a>
      ) : (
        "—"
      )}
    </DetailItem>
    <DetailItem icon={Mail} label="Email">
      {lead.email ? (
        <a href={`mailto:${lead.email}`} className="font-medium text-[#2f5fd8] no-underline hover:underline">
          {lead.email}
        </a>
      ) : (
        "—"
      )}
    </DetailItem>
    {lead.consultationAt ? (
      <DetailItem icon={CalendarClock} label="Consultation">
        {formatDateTime(lead.consultationAt)}
      </DetailItem>
    ) : null}
    {lead.status === "lost" && lead.lostReason ? (
      <DetailItem icon={XCircle} label="Why it was lost">
        {lead.lostReason}
      </DetailItem>
    ) : null}
    <div className="sm:col-span-2">
      <DetailItem icon={StickyNote} label="Notes from BayShore">
        {lead.notes || <span className="text-[#6b7280]">No notes for this lead.</span>}
      </DetailItem>
    </div>
  </div>
);

// ── Side cards ───────────────────────────────────────────────────────────────

const BreakdownCard = ({
  icon: Icon,
  title,
  sub,
  rows,
}: {
  icon: LucideIcon;
  title: string;
  sub: string;
  rows: { key: string; label: string; color: string; count: number }[];
}) => {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const max = Math.max(1, ...rows.map((row) => row.count));

  return (
    <div className={`${cardClass} p-4.5`}>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#d9e0ef] text-[#2f5fd8]">
          <Icon size={17} strokeWidth={2} />
        </span>
        <div>
          <div className="text-[13px] font-semibold text-[#0b0c24]">{title}</div>
          <div className="mt-0.5 text-[11px] text-[#6b7280]">{sub}</div>
        </div>
      </div>
      {total === 0 ? (
        <div className="py-2 text-[12px] text-[#6b7280]">No leads in this period.</div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {/* Empty rows only add noise to a short breakdown. */}
          {rows
            .filter((row) => row.count > 0)
            .map((row) => (
              <div key={row.key}>
                <div className="mb-1.5 flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-2 font-medium text-[#1f2530]">
                    <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
                    {row.label}
                  </span>
                  <span className="text-[#4b5260]">
                    <span className="font-semibold text-[#0b0c24]">{row.count}</span> · {Math.round((row.count / total) * 100)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#f3f4f6]">
                  <div className="h-full rounded-full" style={{ width: `${(row.count / max) * 100}%`, background: row.color }} />
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

// ── Page numbers ─────────────────────────────────────────────────────────────

const Pagination = ({ pagination, filters }: { pagination: MyLeadListData["pagination"]; filters: LeadFilters }) => {
  const { page, limit, total, totalPages, hasPreviousPage, hasNextPage } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const href = (target: number) => leadsHref({ ...filters, page: target });
  const idle = "border-[#e2e5e9] bg-white text-[#1f2530] hover:bg-[#f3f4f6]";
  const disabled = `${pageButtonClass} border-[#e2e5e9] bg-white text-[#0b0c24] opacity-35`;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1 text-[12px] text-[#1f2530]">
      <span>
        Showing {from}–{to} of {total} {total === 1 ? "lead" : "leads"}
      </span>
      {/* One page of results needs no page buttons. */}
      {totalPages > 1 ? (
        <nav className="flex items-center gap-1.5" aria-label="Leads pagination">
          {hasPreviousPage ? (
            <Link className={`${pageButtonClass} ${idle}`} href={href(page - 1)} rel="prev" aria-label="Previous page">
              <ChevronLeft size={16} strokeWidth={2.25} />
            </Link>
          ) : (
            <span className={disabled} aria-disabled="true" aria-label="Previous page">
              <ChevronLeft size={16} strokeWidth={2.25} />
            </span>
          )}
          {pageItems(page, totalPages).map((item) =>
            typeof item === "string" ? (
              <span key={item} className="px-1 text-[#6b7280]" aria-hidden="true">
                …
              </span>
            ) : (
              <Link
                key={item}
                className={`${pageButtonClass} ${item === page ? "border-[#0b0c24] bg-[#0b0c24] text-white" : idle}`}
                href={href(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
              >
                {item}
              </Link>
            ),
          )}
          {hasNextPage ? (
            <Link className={`${pageButtonClass} ${idle}`} href={href(page + 1)} rel="next" aria-label="Next page">
              <ChevronRight size={16} strokeWidth={2.25} />
            </Link>
          ) : (
            <span className={disabled} aria-disabled="true" aria-label="Next page">
              <ChevronRight size={16} strokeWidth={2.25} />
            </span>
          )}
        </nav>
      ) : null}
    </div>
  );
};

// ── The Leads page ───────────────────────────────────────────────────────────

// Every inquiry BayShore has captured for this client — read-only, filtered and
// paged by the backend. The filters live in the URL, so a view can be bookmarked.
// `data` is missing when the list couldn't be loaded; `error` says why.
const Leads = ({
  data,
  error,
  previousSummary,
  compareLabel,
  filters,
}: {
  data?: MyLeadListData;
  error?: string;
  previousSummary?: Summary;
  compareLabel?: string;
  filters: LeadFilters;
}) => {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();
  const [openId, setOpenId] = useState<string | null>(null);

  const hasFilters = filters.status !== "all" || filters.channel !== "all" || filters.caseType !== "all" || filters.q !== "";
  const periodLabel = LEAD_PERIODS[filters.period];
  // Case types are each firm's own words, so the filter offers the ones in use — plus
  // the chosen one, in case it isn't in this period's list (a bookmarked link).
  const caseTypeOptions = [
    ...new Set([...(data?.caseTypes ?? []), ...(filters.caseType !== "all" ? [filters.caseType] : [])]),
  ].sort((a, b) => a.localeCompare(b));

  const navigate = (patch: Partial<LeadFilters>) =>
    startNavigation(() => router.replace(leadsHref({ ...filters, ...patch, page: undefined }), { scroll: false }));

  const clearFilters = () => navigate({ status: "all", channel: "all", caseType: "all", q: "" });

  return (
    <div className={`${poppins.className} flex flex-col gap-4.5`}>
      <div>
        <div className="text-[28px] leading-tight font-bold text-[#0b0c24]">Leads</div>
        <div className="mt-1 text-[12.5px] text-[#4b5563]">Every new inquiry BayShore Communication has captured for you.</div>
      </div>

      {!data ? (
        <div role="alert" className="rounded-xl border border-[#f5c2c2] bg-[#fdecec] px-4 py-3 text-[12.5px] font-medium text-[#b42318]">
          {error ?? "Could not load your leads."} Please refresh the page to try again.
        </div>
      ) : (
        <>
          <SummaryTiles summary={data.summary} previous={previousSummary} compareLabel={compareLabel} />

          <div className={`${cardClass} flex flex-wrap items-center gap-3 p-3.5`}>
            <SelectBox
              label="Period"
              value={filters.period}
              active={false}
              onChange={(value) => navigate({ period: value as LeadFilters["period"] })}
            >
              {(Object.keys(LEAD_PERIODS) as LeadFilters["period"][]).map((key) => (
                <option key={key} value={key}>
                  {LEAD_PERIODS[key]}
                </option>
              ))}
            </SelectBox>
            <SelectBox label="Lead status" value={filters.status} onChange={(value) => navigate({ status: value as LeadFilters["status"] })}>
              <option value="all">All Statuses</option>
              {LEAD_STATUS_KEYS.map((key) => (
                <option key={key} value={key}>
                  {STATUSES[key].label}
                </option>
              ))}
            </SelectBox>
            <SelectBox label="Lead source" value={filters.channel} onChange={(value) => navigate({ channel: value as LeadFilters["channel"] })}>
              <option value="all">All Sources</option>
              {LEAD_CHANNEL_KEYS.map((key) => (
                <option key={key} value={key}>
                  {CHANNELS[key].label}
                </option>
              ))}
            </SelectBox>
            {caseTypeOptions.length ? (
              <SelectBox label="Case type" value={filters.caseType} onChange={(value) => navigate({ caseType: value })}>
                <option value="all">All Case Types</option>
                {caseTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SelectBox>
            ) : null}
            {hasFilters ? (
              <button
                type="button"
                className="flex h-9.5 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium text-[#4b5260] hover:bg-[#f3f4f6] hover:text-[#0b0c24]"
                onClick={clearFilters}
              >
                <RotateCcw size={13} strokeWidth={2} /> Clear
              </button>
            ) : null}
            <SearchBox search={filters.q} onSearch={(q) => navigate({ q })} />
          </div>

          <div className="grid grid-cols-1 items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className={`${cardClass} p-3.5 transition-opacity ${isNavigating ? "opacity-60" : ""}`} aria-busy={isNavigating}>
              {data.leads.length === 0 ? (
                <div className="flex flex-col items-center px-5 py-11 text-center">
                  <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d9e0ef] text-[#2f5fd8]">
                    {hasFilters ? <SearchX size={24} strokeWidth={1.8} /> : <Users size={24} strokeWidth={1.8} />}
                  </div>
                  <div className="text-lg font-semibold text-[#0b0c24]">
                    {hasFilters ? "No leads match these filters" : `No leads for ${periodLabel.toLowerCase()}`}
                  </div>
                  <div className="mt-2 mb-4.5 max-w-90 text-[12.5px] leading-normal text-[#4b5563]">
                    {hasFilters
                      ? "Try a different status, source, case type or search."
                      : "New inquiries BayShore Communication captures for you will appear here. Try a longer period to see earlier ones."}
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
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-0">
                      <thead>
                        <tr>
                          <th className={`${thClass} rounded-l-lg`}>Lead</th>
                          <th className={thClass}>Case Type</th>
                          <th className={thClass}>Source</th>
                          <th className={thClass}>Received</th>
                          <th className={thClass}>Status</th>
                          <th className={`${thClass} w-12 rounded-r-lg`}>
                            <span className="sr-only">Details</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.leads.map((lead) => {
                          const open = openId === lead._id;
                          const toggle = () => setOpenId(open ? null : lead._id);
                          const contact = lead.phone ?? lead.email;

                          return (
                            <Fragment key={lead._id}>
                              {/* The whole row opens the details; the chevron is the keyboard way in. */}
                              <tr className={`cursor-pointer ${open ? "bg-[#f9fafb]" : "hover:bg-[#f9fafb]"}`} onClick={toggle}>
                                <td className={tdClass}>
                                  <div className="flex items-center gap-3">
                                    <span
                                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                                      style={{ background: avatarColorOf(lead.fullName) }}
                                    >
                                      {initialsOf(lead.fullName)}
                                    </span>
                                    <span className="min-w-0">
                                      <span className="block max-w-56 truncate font-medium text-[#1f2530]" title={lead.fullName}>
                                        {lead.fullName}
                                      </span>
                                      {contact ? <span className="mt-0.5 block text-[11px] text-[#6b7280]">{contact}</span> : null}
                                    </span>
                                  </div>
                                </td>
                                <td className={`${tdClass} max-w-44 truncate`} title={lead.caseType}>
                                  {lead.caseType}
                                </td>
                                <td className={tdClass}>
                                  <span className="inline-flex items-center gap-2">
                                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CHANNELS[lead.channel]?.color }} />
                                    {SOURCES[lead.source] ?? lead.source}
                                  </span>
                                </td>
                                <td className={`${tdClass} text-[#4b5260]`}>{formatDate(lead.receivedAt)}</td>
                                <td className={tdClass}>
                                  <StatusPill status={lead.status} />
                                </td>
                                <td className={`${tdClass} text-right`}>
                                  <button
                                    type="button"
                                    className="inline-flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-md text-[#4b5260] hover:bg-[#eef0f2] hover:text-[#0b0c24]"
                                    aria-expanded={open}
                                    aria-label={`${open ? "Hide" : "Show"} details for ${lead.fullName}`}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      toggle();
                                    }}
                                  >
                                    <ChevronDown size={16} strokeWidth={2} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                                  </button>
                                </td>
                              </tr>
                              {open ? (
                                <tr>
                                  <td colSpan={6} className="border-b border-[#eef0f2] bg-[#f9fafb] px-3 pt-1 pb-3.5">
                                    <LeadDetails lead={lead} />
                                  </td>
                                </tr>
                              ) : null}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Pagination pagination={data.pagination} filters={filters} />
                </>
              )}
            </div>

            <div className="flex flex-col gap-4.5">
              <BreakdownCard
                icon={PieChart}
                title="Where Leads Come From"
                sub={periodLabel}
                rows={LEAD_CHANNEL_KEYS.map((key) => ({ key, ...CHANNELS[key], count: data.channels[key] }))}
              />
              <BreakdownCard
                icon={Workflow}
                title="Pipeline"
                sub={`Where ${periodLabel.toLowerCase()}'s leads are now`}
                rows={LEAD_STATUS_KEYS.map((key) => ({
                  key,
                  label: STATUSES[key].label,
                  color: STATUSES[key].dot,
                  count: data.summary[key],
                }))}
              />
              <div className={`${cardClass} p-4.5`}>
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f3f4f6] text-[#0b0c24]">
                    <MessageCircle size={17} strokeWidth={2} />
                  </span>
                  <div className="text-[13px] font-semibold text-[#0b0c24]">Have a question?</div>
                </div>
                <div className="text-[12px] leading-normal text-[#4b5563]">
                  If a lead looks unfamiliar or you&apos;d like more detail on one, message your account manager.
                </div>
                <Link
                  href="/messages"
                  className="mt-3.5 flex items-center justify-center gap-1.5 rounded-lg bg-[#0b0c24] px-4 py-2.25 text-[12.5px] font-medium text-white no-underline hover:bg-[#1e2140]"
                >
                  <MessageCircle size={14} strokeWidth={2} /> Send a Message
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Leads;
