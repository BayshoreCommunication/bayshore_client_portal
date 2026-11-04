"use server";

import { auth } from "@/auth";
import { BACKEND_API_URL } from "@/lib/backend";

// Booking the onboarding call in the portal (backend: /onboarding/me/booking): the free times on
// the team's booking calendar, and the call added to it with a Meet link. `available` is false
// when the team hasn't set one up: the Google booking page is the way then.

export interface BookedCall {
  callAt: string | null;
  meetLink: string | null;
  // Booked here, in the portal (rather than said to be, or found on the calendar).
  inPortal: boolean;
}

export interface BookingInfo {
  available: boolean;
  booked: BookedCall | null;
  // Minutes the call takes.
  duration?: number;
  // Whose calendar it goes on.
  host?: string;
  // The times that can be booked, ISO.
  slots?: string[];
}

export type BookingResult<T> = { ok: true; data: T } | { ok: false; error: string };

const request = async <T,>(accessToken: string, init: RequestInit = {}): Promise<BookingResult<T>> => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/onboarding/me/booking`, {
      ...init,
      headers: { Authorization: `Bearer ${accessToken}`, ...(init.body ? { "Content-Type": "application/json" } : {}) },
      cache: "no-store",
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: typeof body?.message === "string" ? body.message : "Something went wrong. Please try again." };
    return { ok: true, data: body?.data as T };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
};

const book = (start: string): RequestInit => ({ method: "POST", body: JSON.stringify({ start }) });

// ── Signed in (the onboarding page) ──────────────────────────────────────────

export async function getMyBookingAction(): Promise<BookingResult<BookingInfo>> {
  const session = await auth();
  if (!session?.accessToken) return { ok: false, error: "Not signed in." };
  return request<BookingInfo>(session.accessToken);
}

export async function bookMyCallAction(start: string): Promise<BookingResult<BookedCall>> {
  const session = await auth();
  if (!session?.accessToken) return { ok: false, error: "Not signed in." };
  return request<BookedCall>(session.accessToken, book(start));
}

// ── While signing up (nobody is signed in yet) ───────────────────────────────

// Signs in to the backend with the account just made, only for this one request — as the steps'
// answers are saved (actions/auth.ts: saveSignupAnswersAction) — and closes that session again.
const asNewClient = async <T,>(email: string, password: string, run: (accessToken: string) => Promise<BookingResult<T>>): Promise<BookingResult<T>> => {
  try {
    const login = await fetch(`${BACKEND_API_URL}/auth/client/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: email, password }),
      cache: "no-store",
    });
    const session = await login.json().catch(() => null);
    const accessToken: unknown = session?.data?.accessToken;
    if (!login.ok || typeof accessToken !== "string") return { ok: false, error: "We couldn't reach your account. Please try again." };
    const result = await run(accessToken);
    if (typeof session?.data?.refreshToken === "string") {
      await fetch(`${BACKEND_API_URL}/auth/signout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: session.data.refreshToken }),
      }).catch(() => undefined);
    }
    return result;
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
};

export async function getSignupBookingAction(email: string, password: string): Promise<BookingResult<BookingInfo>> {
  return asNewClient(email, password, (token) => request<BookingInfo>(token));
}

export async function bookSignupCallAction(email: string, password: string, start: string): Promise<BookingResult<BookedCall>> {
  return asNewClient(email, password, (token) => request<BookedCall>(token, book(start)));
}
