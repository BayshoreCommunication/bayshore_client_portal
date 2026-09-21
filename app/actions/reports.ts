"use server";

import { auth } from "@/auth";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8000/api/v1";
const API = `${BACKEND_API_URL}/reports/me`;

export type ReportPeriodType = "weekly" | "monthly";

export interface ReportBlog {
  title: string;
  publishedAt?: string;
  graphicsCount?: number;
  url?: string;
}

export interface ReportSocial {
  facebookReach?: number;
  instagramReach?: number;
  twitterReach?: number;
  linkedinReach?: number;
  reel?: { title?: string; views?: number };
}

export interface ReportWebsite {
  impressions?: number;
  clicks?: number;
  backlinks?: number;
  referringDomains?: number;
  leadsForwarded?: number;
}

export interface ReportGmbLocation {
  name: string;
  impressions?: number;
  calls?: number;
  directions?: number;
}

export interface ReportGmb {
  impressions?: number;
  calls?: number;
  directionRequests?: number;
  websiteClicks?: number;
  locations: ReportGmbLocation[];
}

// A client only ever receives published reports, without staff-only details.
export interface MyReportListItem {
  _id: string;
  title: string;
  periodType: ReportPeriodType;
  periodStart: string;
  periodEnd: string;
  publishedAt?: string;
}

// A list row that also carries its figures (when asked for with `full: true`).
export interface MyReportWithFigures extends MyReportListItem {
  social?: ReportSocial;
  website?: ReportWebsite;
  gmb?: ReportGmb;
}

export interface MyReport extends MyReportListItem {
  summary?: string;
  social?: ReportSocial;
  blogs: ReportBlog[];
  website?: ReportWebsite;
  gmb?: ReportGmb;
}

// The last published report of the same type, for the ▲/▼ percentages.
export interface MyReportPrevious {
  title: string;
  periodStart: string;
  periodEnd: string;
  social?: ReportSocial;
  website?: ReportWebsite;
  gmb?: ReportGmb;
}

export interface MyReportDetailData {
  report: MyReport;
  previous: MyReportPrevious | null;
}

export interface MyReportListData {
  reports: MyReportWithFigures[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

interface ReportActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  // HTTP status of a failed request, so pages can tell "not found" from other errors.
  status?: number;
}

async function token() {
  const session = await auth();
  return session?.accessToken;
}

async function failure(response: Response, fallback: string) {
  let message = fallback;
  try {
    const body = await response.json();
    if (typeof body?.message === "string") message = body.message;
  } catch {
    // Not JSON — keep the fallback message.
  }
  return { ok: false as const, error: message, status: response.status };
}

export async function listMyReportsAction(
  params: {
    page?: number;
    limit?: number;
    periodType?: ReportPeriodType;
    search?: string;
    // Include each report's figures, for trends. Off by default: lists carry headlines only.
    full?: boolean;
  } = {},
): Promise<ReportActionResult<MyReportListData>> {
  const accessToken = await token();
  if (!accessToken) return { ok: false, error: "Not authenticated." };

  try {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
    });
    if (params.periodType) query.set("periodType", params.periodType);
    if (params.search?.trim()) query.set("q", params.search.trim());
    if (params.full) query.set("full", "true");

    const response = await fetch(`${API}?${query}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return failure(response, "Failed to fetch reports.");

    const { data } = await response.json();
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export async function getMyReportAction(id: string): Promise<ReportActionResult<MyReportDetailData>> {
  const accessToken = await token();
  if (!accessToken) return { ok: false, error: "Not authenticated." };

  try {
    const response = await fetch(`${API}/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return failure(response, "Failed to fetch report.");

    const { data } = await response.json();
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}
