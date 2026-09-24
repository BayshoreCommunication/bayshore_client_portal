"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Layers,
  Pencil,
  RotateCcw,
  Search,
  SearchX,
  type LucideIcon,
} from "lucide-react";
import type { ContentItem, ContentStatus, ContentType } from "@/app/actions/content";
import { poppins } from "@/component/shared/fonts";
import { CONTENT_STATUSES as STATUSES, CONTENT_TYPES as TYPES, CONTENT_TYPE_KEYS, batchLabelOf, formatDate, personNameOf, typeOf } from "./contentUi";

const PAGE_SIZE = 10;

const inputClass =
  "h-9.5 w-full cursor-pointer appearance-none rounded-lg border border-[#e2e5e9] bg-white pr-8 pl-3 text-[12px] font-medium text-[#1f2530] outline-none focus:border-[#9aa3af]";

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";

const thClass = "bg-[#f3f4f6] px-3 py-2.5 text-[11.5px] font-medium whitespace-nowrap text-[#4b5260]";
const tdClass = "border-b border-[#eef0f2] px-3 py-3 text-[12px] whitespace-nowrap text-[#1f2530]";

const pageButtonClass = "flex h-6.5 min-w-6.5 cursor-pointer items-center justify-center rounded-md border px-1.5 text-[11.5px] font-medium";

const SelectBox = ({
  label,
  value,
  onChange,
  icon: Icon,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: LucideIcon;
  children: React.ReactNode;
}) => (
  <div className="relative w-45">
    {Icon ? (
      <Icon size={14} strokeWidth={2} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#1f2530]" />
    ) : null}
    <select
      className={`${inputClass} ${Icon ? "pl-8.5" : ""}`}
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {children}
    </select>
    <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#1f2530]" />
  </div>
);

const SummaryTile = ({
  icon: Icon,
  label,
  sub,
  value,
  color,
  background,
}: {
  icon: LucideIcon;
  label: string;
  sub: string;
  value: number;
  color: string;
  background: string;
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
    <div className="mt-3 text-[30px] leading-none font-semibold text-[#0a0a0f]">{value}</div>
  </div>
);

// Everything BayShore has sent this client, filtered and paged in the browser.
// Each piece opens its own page, where the client approves it or asks for changes.
const ContentList = ({ items }: { items: ContentItem[] }) => {
  const [type, setType] = useState<ContentType | "all">("all");
  const [status, setStatus] = useState<ContentStatus | "all">("all");
  const [batch, setBatch] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const batchOptions = useMemo(() => Array.from(new Set(items.map(batchLabelOf))), [items]);

  const counts = useMemo(
    () => ({
      waiting: items.filter((item) => item.status === "pending_approval").length,
      revision: items.filter((item) => item.status === "revision_requested").length,
      approved: items.filter((item) => item.status === "approved").length,
    }),
    [items]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter(
      (item) =>
        (type === "all" || item.type === type) &&
        (status === "all" || item.status === status) &&
        (batch === "all" || batchLabelOf(item) === batch) &&
        (!needle || item.title.toLowerCase().includes(needle))
    );
  }, [items, type, status, batch, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  const hasFilters = type !== "all" || status !== "all" || batch !== "all" || query.trim() !== "";

  const onFilterChange = (apply: () => void) => {
    apply();
    setPage(1);
  };

  const clearFilters = () => {
    setType("all");
    setStatus("all");
    setBatch("all");
    setQuery("");
    setPage(1);
  };

  return (
    <div className={`${poppins.className} flex flex-col gap-4.5`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-[12px] text-[#4b5260]">
            <span className="font-semibold text-[#0b0c24]">Content</span>
          </div>
          <div className="text-[28px] leading-tight font-bold text-[#0b0c24]">Content</div>
          <div className="mt-1 text-[12.5px] text-[#4b5563]">
            Everything BayShore Communication has prepared for you. Open a piece to approve it or ask for changes.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
        <SummaryTile icon={Layers} label="Total Content" sub="All items shared with you" value={items.length} color="#2f5fd8" background="#d9e0ef" />
        <SummaryTile icon={Clock} label="Waiting for You" sub="Ready for your approval" value={counts.waiting} color="#d97706" background="#f8e4c6" />
        <SummaryTile icon={Pencil} label="In Revision" sub="Changes you requested" value={counts.revision} color="#dc2626" background="#f4d7db" />
        <SummaryTile icon={CheckCircle2} label="Approved" sub="Ready to publish" value={counts.approved} color="#16a34a" background="#d2e7d8" />
      </div>

      <div className={`${cardClass} flex flex-wrap items-center gap-3 p-3.5`}>
        <SelectBox label="Content type" value={type} onChange={(value) => onFilterChange(() => setType(value as ContentType | "all"))}>
          <option value="all">All Types</option>
          {CONTENT_TYPE_KEYS.map((key) => (
            <option key={key} value={key}>
              {TYPES[key].label}
            </option>
          ))}
        </SelectBox>
        <SelectBox label="Content status" value={status} onChange={(value) => onFilterChange(() => setStatus(value as ContentStatus | "all"))}>
          <option value="all">All Statuses</option>
          {(Object.keys(STATUSES) as ContentStatus[]).map((key) => (
            <option key={key} value={key}>
              {STATUSES[key].label}
            </option>
          ))}
        </SelectBox>
        <SelectBox label="Content batch" value={batch} onChange={(value) => onFilterChange(() => setBatch(value))} icon={CalendarDays}>
          <option value="all">All Batches</option>
          {batchOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </SelectBox>
        <div className="ml-auto flex h-9.5 w-full max-w-112.5 items-center gap-2.5 rounded-lg border border-[#e2e5e9] bg-white px-3 focus-within:border-[#9aa3af]">
          <Search size={15} strokeWidth={2} className="shrink-0 text-[#1f2530]" />
          <input
            type="text"
            placeholder="Search content..."
            aria-label="Search content"
            className="w-full border-none bg-transparent text-[12px] text-[#1f2530] outline-none placeholder:text-[#6b7280]"
            value={query}
            onChange={(event) => onFilterChange(() => setQuery(event.target.value))}
          />
        </div>
      </div>

      <div className={`${cardClass} p-3.5`}>
        {visible.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-11 text-center">
            <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d9e0ef] text-[#2f5fd8]">
              {hasFilters ? <SearchX size={24} strokeWidth={1.8} /> : <Layers size={24} strokeWidth={1.8} />}
            </div>
            <div className="text-lg font-semibold text-[#0b0c24]">{hasFilters ? "No content matches these filters" : "No content yet"}</div>
            <div className="mt-2 mb-4.5 max-w-90 text-[12.5px] leading-normal text-[#4b5563]">
              {hasFilters
                ? "Try a different type, status, month or search."
                : "Content BayShore Communication prepares for you will appear here."}
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
                  <th className={`${thClass} text-left`}>Content</th>
                  <th className={`${thClass} text-center`}>Type</th>
                  <th className={`${thClass} text-center`}>Batch</th>
                  <th className={`${thClass} text-center`}>Submitted</th>
                  <th className={`${thClass} text-center`}>Status</th>
                  <th className={`${thClass} w-20 rounded-r-lg text-center`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item, index) => {
                  const typeMeta = typeOf(item);
                  const statusMeta = STATUSES[item.status];
                  const TypeIcon = typeMeta.icon;
                  const href = `/content/${item._id}`;
                  const creator = personNameOf(item.createdBy) ?? "BayShore Communication";

                  return (
                    <tr key={item._id} className="hover:bg-[#f9fafb]">
                      <td className={`${tdClass} text-center font-medium`}>{String(start + index + 1).padStart(2, "0")}</td>
                      <td className={tdClass}>
                        <Link href={href} className="group flex items-center gap-3 text-inherit no-underline">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                            style={{ background: typeMeta.background, color: typeMeta.color }}
                          >
                            <TypeIcon size={16} strokeWidth={2} />
                          </span>
                          <span className="min-w-0">
                            <span className="block max-w-90 truncate font-medium text-[#1f2530] group-hover:text-[#2f5fd8]">{item.title}</span>
                            <span className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-[#6b7280]">
                              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0b0c24] text-[7.5px] font-semibold text-white">
                                {creator
                                  .split(/\s+/)
                                  .slice(0, 2)
                                  .map((word) => word[0]?.toUpperCase())
                                  .join("")}
                              </span>
                              Created by <span className="font-medium text-[#384955]">{creator}</span>
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className={`${tdClass} text-center`}>
                        <span
                          className="inline-block rounded-md px-3 py-1 text-[10.5px] font-medium"
                          style={{ background: typeMeta.background, color: typeMeta.color }}
                        >
                          {typeMeta.label}
                        </span>
                      </td>
                      <td className={`${tdClass} text-center`}>{batchLabelOf(item)}</td>
                      <td className={`${tdClass} text-center text-[#4b5260]`}>{formatDate(item.submittedAt)}</td>
                      <td className={`${tdClass} text-center`}>
                        <span
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10.5px] font-medium"
                          style={{ background: statusMeta.background, color: statusMeta.color }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusMeta.dot }} />
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className={tdClass}>
                        <div className="flex justify-center gap-2">
                          <Link
                            href={href}
                            aria-label={`View ${item.title}`}
                            className="inline-flex h-7 w-7 items-center justify-center text-[#4b5260] no-underline transition-colors hover:text-[#0b0c24]"
                          >
                            <Eye size={17} strokeWidth={2} />
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
              Showing {start + 1}–{start + visible.length} of {filtered.length} {filtered.length === 1 ? "item" : "items"}
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

export default ContentList;
