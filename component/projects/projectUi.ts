import type { MyProject, ProjectPriority, ProjectStatus } from "@/app/actions/project";

export const PROJECTS_PER_PAGE = 10;

export const PROJECT_NAME_LIMIT = 120;
export const PROJECT_DESCRIPTION_LIMIT = 2000;

// Pill colors for each step — the same indigo / amber / green the Leads pipeline uses.
export const PROJECT_STATUSES: Record<ProjectStatus, { label: string; color: string; background: string; dot: string }> = {
  new: { label: "New", color: "#3730a3", background: "#e3e7fb", dot: "#4f46e5" },
  in_progress: { label: "In Progress", color: "#a35a12", background: "#fbecd3", dot: "#d99136" },
  completed: { label: "Completed", color: "#15803d", background: "#d6eadb", dot: "#16a34a" },
};
export const PROJECT_STATUS_KEYS = Object.keys(PROJECT_STATUSES) as ProjectStatus[];

// Priority is a colored flag, not a pill, so it never reads as a status.
export const PROJECT_PRIORITIES: Record<ProjectPriority, { label: string; color: string }> = {
  high: { label: "High", color: "#dc2626" },
  normal: { label: "Normal", color: "#2563eb" },
  low: { label: "Low", color: "#8496a3" },
};
export const PROJECT_PRIORITY_KEYS = Object.keys(PROJECT_PRIORITIES) as ProjectPriority[];

export const isProjectStatus = (value?: string): value is ProjectStatus => PROJECT_STATUS_KEYS.includes(value as ProjectStatus);
export const isProjectPriority = (value?: string): value is ProjectPriority =>
  PROJECT_PRIORITY_KEYS.includes(value as ProjectPriority);

// What a client may still do — the backend enforces the same rules and says why
// when it refuses. Editing stops once the project is completed; deleting, once the
// team has started on it.
export const canEditProject = (project: Pick<MyProject, "status">) => project.status !== "completed";
export const canDeleteProject = (project: Pick<MyProject, "status">) => project.status === "new";

// ── Attached files — the backend's limits (models/project.model.ts) ──────────

export const PROJECT_MAX_FILES = 10;
export const PROJECT_MAX_FILE_BYTES = 25 * 1024 * 1024;

const FILE_EXTENSIONS = [
  "jpg", "jpeg", "png", "webp", "gif",
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "rtf", "txt", "csv",
  "zip",
  "mp4", "mov", "webm",
];
// For the file picker, so it only offers what can be attached.
export const PROJECT_FILE_ACCEPT = FILE_EXTENSIONS.map((extension) => `.${extension}`).join(",");
export const PROJECT_FILE_KINDS = "Images, PDF, Word, Excel, PowerPoint, text, ZIP or video";

const extensionOf = (name: string) => (name.includes(".") ? (name.split(".").pop() ?? "").toLowerCase() : "");

// Why a file can't be attached, or null when it's fine.
export const fileProblem = (file: { name: string; size: number }) => {
  if (!FILE_EXTENSIONS.includes(extensionOf(file.name))) return `"${file.name}" isn't a supported file type.`;
  if (file.size > PROJECT_MAX_FILE_BYTES) return `"${file.name}" is over 25MB.`;
  return null;
};

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// The colored tag on each attached file.
export const fileBadgeFor = (name: string) => {
  const ext = extensionOf(name);
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return { label: "IMG", color: "#2563eb" };
  if (["mp4", "mov", "webm"].includes(ext)) return { label: "VID", color: "#7c3aed" };
  if (ext === "pdf") return { label: "PDF", color: "#dc2626" };
  if (["doc", "docx", "odt", "rtf", "txt"].includes(ext)) return { label: "DOC", color: "#2563eb" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { label: "XLS", color: "#15803d" };
  if (["ppt", "pptx"].includes(ext)) return { label: "PPT", color: "#ea580c" };
  if (ext === "zip") return { label: "ZIP", color: "#a35a12" };
  return { label: (ext || "FILE").toUpperCase().slice(0, 4), color: "#556977" };
};

// ── Dates ────────────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;
const pad = (value: number) => String(value).padStart(2, "0");

// For useSyncExternalStore: "today" depends on the visitor's timezone, so it is
// only read in the browser.
export const subscribeNever = () => () => {};
// Today as "2026-10-04" in the visitor's own timezone.
export const todayValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

// A target date is a calendar day (stored as that day at midnight UTC), so it's
// read back in UTC — otherwise it would show as the day before west of Greenwich.
export const targetDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : "");
export const formatTargetDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "";

// How a target date stands against today: nothing once the project is done, when
// there's no date, or before the browser has said what "today" is.
export const dueNote = (project: Pick<MyProject, "targetDate" | "status">, today: string) => {
  if (!project.targetDate || !today || project.status === "completed") return null;
  const days = Math.round((Date.parse(targetDateInput(project.targetDate)) - Date.parse(today)) / DAY_MS);
  if (Number.isNaN(days)) return null;
  if (days < 0) return { text: `${-days} ${days === -1 ? "day" : "days"} overdue`, tone: "overdue" as const };
  if (days === 0) return { text: "Due today", tone: "soon" as const };
  return { text: `${days} ${days === 1 ? "day" : "days"} left`, tone: days <= 7 ? ("soon" as const) : ("normal" as const) };
};

// ── Links ────────────────────────────────────────────────────────────────────

export interface ProjectFilters {
  status: ProjectStatus | "all";
  priority: ProjectPriority | "all";
  q: string;
  page?: number;
}

export const projectsHref = (filters: Partial<ProjectFilters>) => {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.priority && filters.priority !== "all") params.set("priority", filters.priority);
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `/projects?${query}` : "/projects";
};

export type PageItem = number | "gap-start" | "gap-end";

// Up to 7 slots, so the pagination bar never changes width while paging.
export const pageItems = (page: number, total: number): PageItem[] => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "gap-end", total];
  if (page >= total - 3) return [1, "gap-start", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "gap-start", page - 1, page, page + 1, "gap-end", total];
};
