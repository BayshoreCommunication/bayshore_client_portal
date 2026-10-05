"use server";

import { auth } from "@/auth";
import { BACKEND_API_URL } from "@/lib/backend";

// Read-only: a client sees their own company's leads and never changes them.
const API = `${BACKEND_API_URL}/leads/me`;

// Mirror backend/models/lead.model.ts — keep the lists in step.
export type LeadStatus = "new" | "contacted" | "qualified" | "consultation_set" | "converted" | "lost";
export type LeadChannel = "gmb" | "website" | "social" | "referral" | "direct";
export type LeadSource =
  | "gmb_call"
  | "gmb_message"
  | "website_form"
  | "website_chat"
  | "blog_cta"
  | "facebook"
  | "instagram"
  | "referral"
  | "walk_in"
  | "office_call"
  | "other";

// What the client portal receives — the team's internal notes, who on staff did
// what and how the record got in are left out by the backend.
export interface MyLead {
  _id: string;
  fullName: string;
  phone?: string;
  email?: string;
  caseType: string;
  source: LeadSource;
  channel: LeadChannel;
  receivedAt: string;
  status: LeadStatus;
  consultationAt?: string;
  convertedAt?: string;
  lostReason?: string;
  // Intake details the team wrote for the firm.
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MyLeadStatusChange {
  status: LeadStatus;
  at: string;
}

// The single lead also carries its timeline.
export interface MyLeadDetail extends MyLead {
  statusHistory: MyLeadStatusChange[];
}

export interface MyLeadListData {
  leads: MyLead[];
  // Per status and per channel for the date range only — they don't change when
  // the table is narrowed by status, channel, case type or search.
  summary: Record<"total" | LeadStatus, number>;
  channels: Record<LeadChannel, number>;
  // The case types in use for the date range, A–Z — for the case type filter.
  caseTypes: string[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

interface LeadActionResult<T> {
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

export async function listMyLeadsAction(
  params: {
    page?: number;
    limit?: number;
    status?: "all" | LeadStatus;
    channel?: "all" | LeadChannel;
    // "all", or one of the exact case types the list returned in `caseTypes`.
    caseType?: string;
    search?: string;
    // Received on or after / on or before. A bare date in `to` covers that whole day.
    from?: string;
    to?: string;
  } = {},
): Promise<LeadActionResult<MyLeadListData>> {
  const accessToken = await token();
  if (!accessToken) return { ok: false, error: "Not authenticated." };

  try {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
    });
    if (params.status && params.status !== "all") query.set("status", params.status);
    if (params.channel && params.channel !== "all") query.set("channel", params.channel);
    if (params.caseType && params.caseType !== "all") query.set("caseType", params.caseType);
    if (params.search?.trim()) query.set("q", params.search.trim());
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);

    const response = await fetch(`${API}?${query}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return failure(response, "Failed to fetch leads.");

    const { data } = await response.json();
    const { leads, summary, channels, caseTypes, pagination } = data;
    return {
      ok: true,
      data: {
        leads,
        summary,
        channels,
        caseTypes: caseTypes ?? [],
        pagination: {
          ...pagination,
          hasPreviousPage: pagination.page > 1,
          hasNextPage: pagination.page < pagination.totalPages,
        },
      },
    };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export async function getMyLeadAction(id: string): Promise<LeadActionResult<MyLeadDetail>> {
  const accessToken = await token();
  if (!accessToken) return { ok: false, error: "Not authenticated." };

  try {
    const response = await fetch(`${API}/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return failure(response, "Failed to fetch lead.");

    const { data } = await response.json();
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}
