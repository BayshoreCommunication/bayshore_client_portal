import { MapPin, MessageSquare, Megaphone, Package, Search, Shield, Star, type LucideIcon } from "lucide-react";
import type { CatalogService, ServicePlan } from "@/app/actions/service";

export const SERVICE_PLANS: Record<ServicePlan, string> = {
  growth: "Growth Plan",
  core: "Core Plan",
};
export const SERVICE_PLAN_KEYS = Object.keys(SERVICE_PLANS) as ServicePlan[];

// ── Looks — the same as company-portal's component/services/serviceUi.ts ─────

// A fallback color for a service saved without one, picked from its name.
const SERVICE_COLORS = ["#c8973a", "#2f8f6f", "#3457c9", "#0b1522", "#7c3aed", "#0891b2", "#db2777", "#ea580c"];
export const serviceColorOf = (service: Pick<CatalogService, "title" | "color">) =>
  service.color ||
  SERVICE_COLORS[[...service.title.trim().toLowerCase()].reduce((sum, char) => sum + char.charCodeAt(0), 0) % SERVICE_COLORS.length];

// An icon that fits the kind of service, guessed from its name.
const ICON_HINTS: [RegExp, LucideIcon][] = [
  [/seo|search engine|keyword/i, Search],
  [/google business|gmb|maps|local/i, MapPin],
  [/social|facebook|instagram/i, MessageSquare],
  [/web|hosting|site care/i, Shield],
  [/ads|paid|ppc|campaign/i, Megaphone],
  [/review|reputation/i, Star],
];
export const serviceIconOf = (service: Pick<CatalogService, "title">): LucideIcon =>
  ICON_HINTS.find(([pattern]) => pattern.test(service.title))?.[1] ?? Package;

export const dollars = (amount: number) => `$${amount.toLocaleString("en-US")}`;
export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
