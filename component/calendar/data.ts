export type SpecialistDay = { dow: string; date: string; available: boolean };

export type Specialist = {
  slug: string;
  name: string;
  shortName?: string;
  role: string;
  avatar: string;
  color: string;
  category: string;
  blurb: string;
  greeting: string;
  subtext: string;
  days: SpecialistDay[];
};

const DOW = ["Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue"];
const DATES = ["16", "17", "18", "19", "20", "21", "22"];

// One flag per weekday: Wed–Tue.
const week = (flags: boolean[]): SpecialistDay[] =>
  flags.map((available, index) => ({ dow: DOW[index], date: DATES[index], available }));

export const specialists: Specialist[] = [
  {
    slug: "jewel",
    name: "Md. Jewel",
    shortName: "Jewel",
    role: "SEO Specialist",
    avatar: "MJ",
    color: "#c8973a",
    category: "SEO & Website Optimization",
    blurb: "Keyword strategy, technical SEO fixes, and ranking reports.",
    greeting: "Hey! Happy to talk SEO strategy.",
    subtext:
      "Book a 30-minute session to go over keyword strategy, technical fixes, or reporting. Completely free, no obligation.",
    days: week([true, true, false, false, false, true, true]),
  },
  {
    slug: "shafikur",
    name: "Shafikur Rahman",
    role: "Local SEO Specialist",
    avatar: "SR",
    color: "#2f8f6f",
    category: "Google Business Profile Management",
    blurb: "GMB listings, reviews, map-pack visibility, and local search.",
    greeting: "Hey! Let’s talk about your Google Business Profile.",
    subtext:
      "Book a 30-minute session to review your GMB listing, reviews, and local visibility. Completely free, no obligation.",
    days: week([false, true, true, false, false, true, false]),
  },
  {
    slug: "tahira",
    name: "Tahira",
    role: "Social Media Manager",
    avatar: "T",
    color: "#3457c9",
    category: "Social Media Management",
    blurb: "Content calendars, posting strategy, and platform growth.",
    greeting: "Hey! Would love to talk social strategy.",
    subtext:
      "Book a 30-minute session to review your content calendar and platform growth. Completely free, no obligation.",
    days: week([true, false, true, false, false, false, true]),
  },
  {
    slug: "rakibul",
    name: "Rakibul Islam",
    role: "Website Care Specialist",
    avatar: "RI",
    color: "#0b1522",
    category: "Website Care & Hosting",
    blurb: "Hosting, security, maintenance, and site performance.",
    greeting: "Hey! Happy to help with your website.",
    subtext:
      "Book a 30-minute session to go over hosting, security, or site performance. Completely free, no obligation.",
    days: week([false, true, false, false, false, true, true]),
  },
  {
    slug: "faria",
    name: "Faria Laiba",
    role: "Project Manager / Business Analyst",
    avatar: "FL",
    color: "#0b4d4a",
    category: "General / Account Questions",
    blurb: "Timelines, scope, billing, or anything else on your account.",
    greeting: "Hey! Happy to help with your account.",
    subtext:
      "Book a 30-minute session for timelines, scope, billing, or anything else. Completely free, no obligation.",
    days: week([true, true, true, false, false, true, false]),
  },
];

export const findSpecialist = (slug: string) => specialists.find((specialist) => specialist.slug === slug);

export type CallRequest = {
  id: string;
  clientName: string;
  specialistName: string;
  specialistRole: string;
  day: string;
  date: string;
  time: string;
  requestedAt: string;
  status: "pending" | "approved" | "declined";
  reassignedFrom?: string;
  reassignNote?: string;
  rescheduledFrom?: string;
};

export const ordinal = (value: number) => {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  return `${value}${["th", "st", "nd", "rd"][value % 10] ?? "th"}`;
};
