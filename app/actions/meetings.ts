"use server";

import { auth } from "@/auth";
import { BACKEND_API_URL } from "@/lib/backend";

// The client's meetings with BayShore (backend: GET /calendar/me): every meeting on the team's
// connected Google calendars they are a guest on, a year back to a year ahead.

export interface MeetingGuest {
  email: string;
  name?: string;
  // Their answer to the invitation: "accepted", "declined", "tentative" or "needsAction".
  status?: string;
  organizer: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  description?: string;
  meetLink?: string | null;
  host: { email: string; name?: string };
  guests: MeetingGuest[];
  // The client's own answer to the invitation.
  response?: string;
  // Their onboarding (kickoff) call.
  kickoff: boolean;
  // How the team marked it once it was over.
  outcome: "done" | "missed" | null;
}

export interface MeetingsData {
  meetings: Meeting[];
  // A calendar couldn't be read this time: some meetings may be missing.
  partial: boolean;
}

export async function listMyMeetingsAction(): Promise<{ ok: true; data: MeetingsData } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.accessToken) return { ok: false, error: "Not signed in." };
  try {
    const response = await fetch(`${BACKEND_API_URL}/calendar/me`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: typeof body?.message === "string" ? body.message : "Couldn't load your meetings." };
    return { ok: true, data: body.data as MeetingsData };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}
