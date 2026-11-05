"use server";

import { auth } from "@/auth";
import { BACKEND_API_URL } from "@/lib/backend";
import type { MyReportWithFigures } from "@/app/actions/reports";

// Everything the dashboard shows, in one call (backend: GET /dashboard/me).

export type DashboardContentStatus = "pending_approval" | "revision_requested";

export interface MyDashboard {
  // Published reports, newest first, with their figures.
  reports: MyReportWithFigures[];
  leads: {
    thisMonth: number;
    // The same stretch of last month (1st up to today's date).
    lastMonth: number;
    allTime: number;
  };
  content: {
    // Waiting on their approval now.
    needDecision: number;
    items: { _id: string; title: string; type: string; status: DashboardContentStatus; at?: string; revision?: number }[];
  };
  meetings: {
    items: { id: string; title: string; start: string; end: string; allDay: boolean; meetLink?: string | null; host: { email: string; name?: string } }[];
    // A calendar couldn't be read: some may be missing.
    partial: boolean;
  };
}

export async function getMyDashboardAction(): Promise<{ ok: true; data: MyDashboard } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.accessToken) return { ok: false, error: "Not signed in." };
  try {
    const response = await fetch(`${BACKEND_API_URL}/dashboard/me`, { headers: { Authorization: `Bearer ${session.accessToken}` }, cache: "no-store" });
    const body = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: typeof body?.message === "string" ? body.message : "Couldn't load your dashboard." };
    return { ok: true, data: body.data as MyDashboard };
  } catch {
    return { ok: false, error: "Could not reach the server. Please refresh the page to try again." };
  }
}
