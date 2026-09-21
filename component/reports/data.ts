export type ReportType = "social" | "content" | "website" | "local";

export const REPORT_TYPES: Record<
  ReportType,
  { filterLabel: string; reportName: string; iconBg: string; iconColor: string; pillBg: string; pillColor: string }
> = {
  social: {
    filterLabel: "Social Media",
    reportName: "Social Media Report",
    iconBg: "#fbdada",
    iconColor: "#b91c1c",
    pillBg: "#fbdada",
    pillColor: "#b91c1c",
  },
  content: {
    filterLabel: "Content",
    reportName: "Blog Report",
    iconBg: "#dcf3e2",
    iconColor: "#16a34a",
    pillBg: "#dcf3e2",
    pillColor: "#16a34a",
  },
  website: {
    filterLabel: "Website",
    reportName: "Website Performance Report",
    iconBg: "#dbeafe",
    iconColor: "#2563eb",
    pillBg: "#dbeafe",
    pillColor: "#1d4ed8",
  },
  local: {
    filterLabel: "Local SEO",
    reportName: "GMB Performance Report",
    iconBg: "#fdf1de",
    iconColor: "#c8973a",
    pillBg: "#fdf1de",
    pillColor: "#a35a12",
  },
};

export type Report = {
  slug: string;
  name: string;
  type: ReportType;
  month: string;
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const TYPE_ORDER: ReportType[] = ["social", "content", "website", "local"];

// August 2026 back through February 2026, four reports a month.
export const reports: Report[] = Array.from({ length: 7 }, (_, offset) => 7 - offset).flatMap(
  (monthIndex) =>
    TYPE_ORDER.map((type) => {
      const month = `${MONTH_NAMES[monthIndex]} 2026`;
      return {
        slug: `${type}-${MONTH_NAMES[monthIndex].toLowerCase()}-2026`,
        name: REPORT_TYPES[type].reportName,
        type,
        month,
      };
    })
);

export const MONTH_FILTERS = Array.from(new Set(reports.map((report) => report.month)));

export const findReport = (slug: string) => reports.find((report) => report.slug === slug);

const parseMonth = (month: string) => {
  const [name, year] = month.split(" ");
  return { index: MONTH_NAMES.indexOf(name), year: Number(year) };
};

export const previousMonthLabel = (month: string) => {
  const { index, year } = parseMonth(month);
  return index === 0 ? `December ${year - 1}` : `${MONTH_NAMES[index - 1]} ${year}`;
};

export const generatedOnLabel = (month: string) => {
  const { index, year } = parseMonth(month);
  const nextIndex = (index + 1) % 12;
  const nextYear = index === 11 ? year + 1 : year;
  return `${MONTH_NAMES[nextIndex].slice(0, 3)} 5, ${nextYear}`;
};

export const monthName = (month: string) => month.split(" ")[0];
