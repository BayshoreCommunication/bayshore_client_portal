import type { MyReportListItem, ReportPeriodType } from "@/app/actions/reports";

export const PERIOD_TYPES: Record<
  ReportPeriodType,
  { label: string; iconBg: string; iconColor: string; pillBg: string; pillColor: string }
> = {
  monthly: { label: "Monthly", iconBg: "#dbeafe", iconColor: "#2563eb", pillBg: "#dbeafe", pillColor: "#1d4ed8" },
  weekly: { label: "Weekly", iconBg: "#fdf1de", iconColor: "#c8973a", pillBg: "#fdf1de", pillColor: "#a35a12" },
};

// Dates are stored at UTC midnight, so format in UTC to avoid showing the day before.
const utc = (iso: string, options: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleDateString("en-US", { ...options, timeZone: "UTC" });

export const formatDate = (iso?: string) =>
  iso ? utc(iso, { month: "short", day: "numeric", year: "numeric" }) : "";

type Period = Pick<MyReportListItem, "periodType" | "periodStart" | "periodEnd">;

// "August 2026" for a month, "Aug 3 – Aug 9, 2026" for a week.
export const periodLabel = ({ periodType, periodStart, periodEnd }: Period) =>
  periodType === "monthly"
    ? utc(periodStart, { month: "long", year: "numeric" })
    : `${utc(periodStart, { month: "short", day: "numeric" })} – ${utc(periodEnd, { month: "short", day: "numeric", year: "numeric" })}`;

// "Aug 1 – Aug 31, 2026" — the exact days a report covers, for both weekly and monthly.
export const dateRange = ({ periodStart, periodEnd }: Pick<MyReportListItem, "periodStart" | "periodEnd">) =>
  `${utc(periodStart, { month: "short", day: "numeric" })} – ${utc(periodEnd, { month: "short", day: "numeric", year: "numeric" })}`;

export const firstNameOf = (fullName: string) => fullName.trim().split(/\s+/)[0] || fullName;

// A short name for the period a report is compared against: "Aug", or "Last week".
export const previousLabel = (type: ReportPeriodType, previousStart: string) =>
  type === "monthly" ? utc(previousStart, { month: "short" }) : "Last week";

export const currentLabel = (type: ReportPeriodType, start: string) =>
  type === "monthly" ? utc(start, { month: "short" }) : "This week";

// 128400 → "128.4k", 9850 → "9,850". Keeps small numbers exact and big ones readable.
export const formatMetric = (value: number) =>
  value >= 10000 ? `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k` : value.toLocaleString("en-US");

export interface Change {
  percent: number;
  direction: "up" | "down" | "flat";
}

// The ▲/▼ figure. Nothing to compare against (or a previous value of 0) means no percentage.
export const changeBetween = (current?: number, previous?: number): Change | null => {
  if (current === undefined || previous === undefined || previous === 0) return null;
  const percent = Math.round(((current - previous) / previous) * 1000) / 10;
  return { percent: Math.abs(percent), direction: percent > 0 ? "up" : percent < 0 ? "down" : "flat" };
};

export const hasNumbers = (section?: object) =>
  Boolean(section) && Object.values(section as Record<string, unknown>).some((value) => typeof value === "number");
