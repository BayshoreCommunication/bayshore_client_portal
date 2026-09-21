export type ServiceCategoryKey = "seo" | "gmb" | "social" | "web";

export type ServiceCategory = {
  key: ServiceCategoryKey;
  title: string;
  plan: string;
  description: string;
  color: string;
  specialist: string;
  customPlaceholder: string;
  items: { name: string; price: number }[];
};

export const CUSTOM_REQUEST_PRICE = 150;

export const TIMELINES = ["As soon as possible", "Within 1–2 weeks", "Within a month", "Flexible / no rush"];

export const serviceCategories: ServiceCategory[] = [
  {
    key: "seo",
    title: "SEO & Website Optimization",
    plan: "GROWTH PLAN",
    description: "Ongoing organic search strategy to keep you ranking for high-intent local search terms.",
    color: "#c8973a",
    specialist: "Priya Shah, SEO Strategist",
    customPlaceholder: "Service name (e.g. Video SEO)",
    items: [
      { name: "Monthly keyword rank tracking & reporting", price: 250 },
      { name: "On-page & technical SEO fixes", price: 300 },
      { name: "Backlink outreach (4–6 placements/mo)", price: 300 },
      { name: "Quarterly content strategy review", price: 150 },
      { name: "Local citation building", price: 100 },
      { name: "Competitor gap analysis", price: 100 },
    ],
  },
  {
    key: "gmb",
    title: "Google Business Profile Management",
    plan: "CORE PLAN",
    description: "Keeps your GMB listing active, accurate, and responsive so it keeps converting map-pack traffic.",
    color: "#2f8f6f",
    specialist: "Marcus Webb, Local SEO Specialist",
    customPlaceholder: "Service name (e.g. Extra location listing)",
    items: [
      { name: "Weekly posts & photo updates", price: 150 },
      { name: "Review monitoring & response", price: 150 },
      { name: "Q&A section management", price: 150 },
      { name: "Monthly map-pack ranking snapshot", price: 150 },
      { name: "GMB post scheduling automation", price: 50 },
      { name: "Duplicate listing cleanup", price: 50 },
    ],
  },
  {
    key: "social",
    title: "Social Media Management",
    plan: "GROWTH PLAN",
    description: "Content, community management, and light paid boosting across Facebook & Instagram.",
    color: "#3457c9",
    specialist: "Dana Kim, Social Media Manager",
    customPlaceholder: "Service name (e.g. TikTok content)",
    items: [
      { name: "12 posts/month across Facebook & Instagram", price: 300 },
      { name: "Comment & DM monitoring", price: 150 },
      { name: "Monthly content calendar for your approval", price: 150 },
      { name: "Paid boost on top posts", price: 200 },
      { name: "Instagram Reels production", price: 100 },
      { name: "Influencer outreach coordination", price: 100 },
    ],
  },
  {
    key: "web",
    title: "Website Care & Hosting",
    plan: "CORE PLAN",
    description: "Keeps your site fast, secure, and online — hosting, backups, and routine maintenance.",
    color: "#0b1522",
    specialist: "BayShore Dev Team",
    customPlaceholder: "Service name (e.g. Staging environment)",
    items: [
      { name: "Hosting, SSL & uptime monitoring", price: 200 },
      { name: "Monthly plugin & security updates", price: 150 },
      { name: "Site speed checks", price: 100 },
      { name: "Same-business-day emergency fixes", price: 100 },
      { name: "Monthly backup verification", price: 25 },
      { name: "Uptime SLA reporting", price: 25 },
    ],
  },
];

export const categoryTitle = (key: ServiceCategoryKey) =>
  serviceCategories.find((category) => category.key === key)?.title ?? key;

export const formatMoney = (amount: number) => amount.toLocaleString("en-US");
