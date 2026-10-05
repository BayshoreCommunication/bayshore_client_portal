"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flag,
  FolderKanban,
  FolderOpen,
  Loader,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SearchX,
  Sparkles,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { deleteMyProjectAction, type MyProject, type MyProjectListData } from "@/app/actions/project";
import { poppins } from "@/component/shared/fonts";
import {
  PROJECT_PRIORITIES as PRIORITIES,
  PROJECT_PRIORITY_KEYS,
  PROJECT_STATUSES as STATUSES,
  PROJECT_STATUS_KEYS,
  canDeleteProject,
  canEditProject,
  dueNote,
  formatDate,
  formatTargetDate,
  pageItems,
  projectsHref,
  subscribeNever,
  todayValue,
  type ProjectFilters,
} from "./projectUi";

const SEARCH_DELAY_MS = 400;

const inputClass =
  "h-9.5 w-full cursor-pointer appearance-none rounded-lg border bg-white pr-8 pl-3 text-[12px] font-medium text-[#1f2530] outline-none focus:border-[#9aa3af]";

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";

const thClass = "bg-[#f3f4f6] px-3 py-2.5 text-left text-[11.5px] font-medium whitespace-nowrap text-[#4b5260]";
const tdClass = "border-b border-[#eef0f2] px-3 py-3 text-[12px] whitespace-nowrap text-[#1f2530]";

const pageButtonClass = "flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-[12px] font-medium no-underline";
const iconButtonClass =
  "inline-flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-md text-[#4b5260] no-underline hover:bg-[#eef0f2] hover:text-[#0b0c24]";
const addButtonClass =
  "flex items-center gap-1.5 rounded-lg bg-[#0b0c24] text-[12.5px] font-medium text-white no-underline hover:bg-[#1e2140]";

// ── Small pieces ─────────────────────────────────────────────────────────────

const SelectBox = ({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) => (
  <div className="relative w-full sm:w-42">
    <select
      // A chosen filter gets a darker border so it's clear the list is narrowed.
      className={`${inputClass} ${value === "all" ? "border-[#e2e5e9]" : "border-[#0b0c24]"}`}
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
    <div className="mt-3 text-[30px] leading-none font-semibold text-[#0b0c24]">{value}</div>
  </div>
);

const StatusPill = ({ status }: { status: MyProject["status"] }) => {
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
      className="flex h-9.5 w-full items-center gap-2.5 rounded-lg border border-[#e2e5e9] bg-white px-3 focus-within:border-[#9aa3af] sm:ml-auto sm:max-w-72"
      role="search"
    >
      <Search size={15} strokeWidth={2} className="shrink-0 text-[#1f2530]" />
      <input
        type="search"
        placeholder="Search projects..."
        aria-label="Search projects"
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

// Asks once in place before deleting, so a stray click can't remove a project.
// A refusal from the backend (the team has started on it since the list loaded)
// is handed up to be shown above the table.
const DeleteProject = ({ project, onError }: { project: MyProject; onError: (message: string | null) => void }) => {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    onError(null);
    startTransition(async () => {
      const result = await deleteMyProjectAction(project._id);
      if (!result.ok) {
        onError(result.error ?? "Failed to delete project.");
        setConfirming(false);
      }
    });
  };

  if (!confirming) {
    return (
      <button
        type="button"
        className={`${iconButtonClass} hover:bg-[#fdecec] hover:text-[#b42318]`}
        aria-label={`Delete ${project.name}`}
        onClick={() => setConfirming(true)}
      >
        <Trash2 size={15} strokeWidth={2} />
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#b42318]">
      Delete?
      <button
        type="button"
        className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md bg-[#dc2626] px-2.5 text-white hover:bg-[#b91c1c] disabled:cursor-wait"
        disabled={isPending}
        aria-busy={isPending}
        onClick={handleDelete}
      >
        {isPending ? <Loader2 size={12} strokeWidth={2.5} className="animate-spin" /> : null} Yes
      </button>
      <button
        type="button"
        className="inline-flex h-7 cursor-pointer items-center rounded-md border border-[#e2e5e9] bg-white px-2.5 text-[#1f2530] hover:bg-[#f3f4f6]"
        disabled={isPending}
        onClick={() => setConfirming(false)}
      >
        No
      </button>
    </span>
  );
};

const Pagination = ({ pagination, filters }: { pagination: MyProjectListData["pagination"]; filters: ProjectFilters }) => {
  const { page, limit, total, totalPages, hasPreviousPage, hasNextPage } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const href = (target: number) => projectsHref({ ...filters, page: target });
  const idle = "border-[#e2e5e9] bg-white text-[#1f2530] hover:bg-[#f3f4f6]";
  const disabled = `${pageButtonClass} border-[#e2e5e9] bg-white text-[#0b0c24] opacity-35`;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1 text-[12px] text-[#1f2530]">
      <span>
        Showing {from}–{to} of {total} {total === 1 ? "project" : "projects"}
      </span>
      {/* One page of results needs no page buttons. */}
      {totalPages > 1 ? (
        <nav className="flex items-center gap-1.5" aria-label="Projects pagination">
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

// ── The Projects page ────────────────────────────────────────────────────────

// The larger pieces of work this client has asked BayShore for, filtered and paged
// by the backend. The filters live in the URL, so a view can be bookmarked.
// `data` is missing when the list couldn't be loaded; `error` says why.
const Projects = ({ data, error, filters }: { data?: MyProjectListData; error?: string; filters: ProjectFilters }) => {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  // "Today" depends on the visitor's timezone, so it's read in the browser only.
  const today = useSyncExternalStore(subscribeNever, todayValue, () => "");

  const hasFilters = filters.status !== "all" || filters.priority !== "all" || filters.q !== "";

  const navigate = (patch: Partial<ProjectFilters>) =>
    startNavigation(() => router.replace(projectsHref({ ...filters, ...patch, page: undefined }), { scroll: false }));

  const clearFilters = () => navigate({ status: "all", priority: "all", q: "" });

  return (
    <div className={`${poppins.className} flex flex-col gap-4.5`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[28px] leading-tight font-bold text-[#0b0c24]">Projects</div>
          <div className="mt-1 text-[12.5px] text-[#4b5563]">
            Larger pieces of work you&apos;ve asked BayShore for, from website redesigns to campaign launches.
          </div>
        </div>
        <Link href="/projects/add" className={`${addButtonClass} h-9.5 px-4`}>
          <Plus size={14} strokeWidth={2.5} /> Add Project
        </Link>
      </div>

      {!data ? (
        <div role="alert" className="rounded-xl border border-[#f5c2c2] bg-[#fdecec] px-4 py-3 text-[12.5px] font-medium text-[#b42318]">
          {error ?? "Could not load your projects."} Please refresh the page to try again.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryTile icon={FolderKanban} label="Total Projects" sub="Everything you've asked for" value={data.summary.total} color="#2f5fd8" background="#d9e0ef" />
            <SummaryTile icon={Sparkles} label="New" sub="Waiting to be started" value={data.summary.new} color="#4f46e5" background="#e3e7fb" />
            <SummaryTile icon={Loader} label="In Progress" sub="Being worked on" value={data.summary.in_progress} color="#d97706" background="#f8e4c6" />
            <SummaryTile icon={CheckCircle2} label="Completed" sub="Delivered to you" value={data.summary.completed} color="#16a34a" background="#d2e7d8" />
          </div>

          <div className={`${cardClass} flex flex-wrap items-center gap-3 p-3.5`}>
            <SelectBox label="Project status" value={filters.status} onChange={(value) => navigate({ status: value as ProjectFilters["status"] })}>
              <option value="all">All Statuses</option>
              {PROJECT_STATUS_KEYS.map((key) => (
                <option key={key} value={key}>
                  {STATUSES[key].label}
                </option>
              ))}
            </SelectBox>
            <SelectBox label="Priority" value={filters.priority} onChange={(value) => navigate({ priority: value as ProjectFilters["priority"] })}>
              <option value="all">All Priorities</option>
              {PROJECT_PRIORITY_KEYS.map((key) => (
                <option key={key} value={key}>
                  {PRIORITIES[key].label}
                </option>
              ))}
            </SelectBox>
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

          {actionError ? (
            <div
              role="alert"
              className="flex items-start justify-between gap-3 rounded-xl border border-[#f5c2c2] bg-[#fdecec] px-4 py-3 text-[12.5px] font-medium text-[#b42318]"
            >
              {actionError}
              <button type="button" className="inline-flex cursor-pointer" aria-label="Dismiss" onClick={() => setActionError(null)}>
                <X size={15} strokeWidth={2.25} />
              </button>
            </div>
          ) : null}

          <div className={`${cardClass} p-3.5 transition-opacity ${isNavigating ? "opacity-60" : ""}`} aria-busy={isNavigating}>
            {data.projects.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-11 text-center">
                <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d9e0ef] text-[#2f5fd8]">
                  {hasFilters ? <SearchX size={24} strokeWidth={1.8} /> : <FolderOpen size={24} strokeWidth={1.8} />}
                </div>
                <div className="text-lg font-semibold text-[#0b0c24]">{hasFilters ? "No projects match these filters" : "No projects yet"}</div>
                <div className="mt-2 mb-4.5 max-w-90 text-[12.5px] leading-normal text-[#4b5563]">
                  {hasFilters
                    ? "Try a different status, priority or search."
                    : "Tell us about a website redesign, a campaign or anything bigger than day-to-day content — your BayShore team will take it from there."}
                </div>
                {hasFilters ? (
                  <button type="button" className={`${addButtonClass} cursor-pointer px-4.5 py-2.25`} onClick={clearFilters}>
                    <RotateCcw size={13} strokeWidth={2} /> Clear filters
                  </button>
                ) : (
                  <Link href="/projects/add" className={`${addButtonClass} px-4.5 py-2.25`}>
                    <Plus size={13} strokeWidth={2.5} /> Add Project
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className={`${thClass} rounded-l-lg`}>Project</th>
                        <th className={thClass}>Priority</th>
                        <th className={thClass}>Submitted</th>
                        <th className={thClass}>Target Date</th>
                        <th className={thClass}>Files</th>
                        <th className={thClass}>Status</th>
                        <th className={`${thClass} rounded-r-lg text-right`}>
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.projects.map((project) => {
                        const href = `/projects/${project._id}`;
                        const priority = PRIORITIES[project.priority];
                        const due = dueNote(project, today);

                        return (
                          // The whole row opens the project; the name is the keyboard way in.
                          <tr key={project._id} className="cursor-pointer hover:bg-[#f9fafb]" onClick={() => router.push(href)}>
                            <td className={tdClass}>
                              <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#d9e0ef] text-[#2f5fd8]">
                                  <FolderKanban size={16} strokeWidth={2} />
                                </span>
                                <span className="min-w-0">
                                  <Link
                                    href={href}
                                    className="block max-w-72 truncate font-medium text-[#1f2530] no-underline hover:text-[#2f5fd8]"
                                    title={project.name}
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    {project.name}
                                  </Link>
                                  {project.description ? (
                                    <span className="mt-0.5 block max-w-72 truncate text-[11px] text-[#6b7280]">{project.description}</span>
                                  ) : null}
                                </span>
                              </div>
                            </td>
                            <td className={tdClass}>
                              <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: priority.color }}>
                                <Flag size={13} strokeWidth={2.25} /> {priority.label}
                              </span>
                            </td>
                            <td className={`${tdClass} text-[#4b5260]`}>{formatDate(project.createdAt)}</td>
                            <td className={tdClass}>
                              {formatTargetDate(project.targetDate) || "—"}
                              {due ? (
                                <span
                                  className={`mt-0.5 block text-[11px] ${
                                    due.tone === "overdue" ? "font-medium text-[#b42318]" : due.tone === "soon" ? "font-medium text-[#b45309]" : "text-[#6b7280]"
                                  }`}
                                >
                                  {due.text}
                                </span>
                              ) : null}
                            </td>
                            <td className={`${tdClass} text-[#4b5260]`}>
                              {project.files.length ? (
                                <span className="inline-flex items-center gap-1.25" title={project.files.map((file) => file.name).join(", ")}>
                                  <Paperclip size={13} strokeWidth={2} /> {project.files.length}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className={tdClass}>
                              <StatusPill status={project.status} />
                            </td>
                            {/* Clicks on the buttons act on them, not on the row. */}
                            <td className={`${tdClass} text-right`} onClick={(event) => event.stopPropagation()}>
                              <div className="inline-flex items-center justify-end gap-1">
                                {canEditProject(project) ? (
                                  <Link href={`${href}/edit`} className={iconButtonClass} aria-label={`Edit ${project.name}`}>
                                    <Pencil size={15} strokeWidth={2} />
                                  </Link>
                                ) : null}
                                {canDeleteProject(project) ? <DeleteProject project={project} onError={setActionError} /> : null}
                                <Link href={href} className={iconButtonClass} aria-label={`Open ${project.name}`}>
                                  <ChevronRight size={16} strokeWidth={2} />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination pagination={data.pagination} filters={filters} />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Projects;
