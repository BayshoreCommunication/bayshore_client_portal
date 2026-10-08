"use server";

import { cookies } from "next/headers";
import { BACKEND_API_URL } from "@/lib/backend";

// The onboarding form's calls to the backend (routes/onboarding.route.ts). Nobody is signed in
// while onboarding, so there is no access token here. What ties a visitor to their own answers
// is the key the backend hands out when onboarding is started: it is kept in an http-only
// cookie — out of reach of scripts on the page — and sent back with every later call. So the
// same browser can come back days later and carry on where it left off — until the onboarding
// is handed in, when the key is dropped and the form starts empty again.

const API = `${BACKEND_API_URL}/onboarding`;

// ── What the backend stores (models/client.model.ts → IClientOnboarding) ──────

export type OnboardingStatus = "in_progress" | "submitted";
export type OnboardingYesNo = "yes" | "no";
export type OnboardingHas = "yes" | "no" | "unsure";
export type OnboardingWebsiteNeed = "new" | "redesign" | "no";
export type OnboardingAccessMethod = "invite" | "secure";
export type OnboardingMediaMode = "upload" | "create" | "none";

// A file stored with the answers. They can't be sent through these calls yet — see `files` below.
export interface OnboardingFile {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

// A platform we need to get into: which one, and whether access has been given.
interface OnboardingPlatform {
  platform?: string;
  accessGiven?: boolean;
  needsHelp?: boolean;
}

// A Google or social account.
export interface OnboardingAccount {
  has?: OnboardingHas;
  link?: string;
  access?: OnboardingAccessMethod;
  accessGiven?: boolean;
  needsHelp?: boolean;
  // They don't have one: should we create it?
  wantsCreated?: boolean;
}

// One kind of photos or videos. `files` is read-only here: the backend ignores it on the way in.
export interface OnboardingMedia {
  mode?: OnboardingMediaMode;
  files?: OnboardingFile[];
  link?: string;
  notes?: string;
}

// The form's sections. Every answer is optional — a missing one means "not answered".
export interface OnboardingAnswers {
  website?: {
    url?: string;
    hasNone?: boolean;
    need?: OnboardingWebsiteNeed;
    description?: string;
    competitors?: { url?: string; note?: string }[];
    pages?: string[];
    features?: string[];
  };
  domain?: OnboardingPlatform & { has?: OnboardingHas; name?: string; wantsCreated?: boolean; wishlist?: string };
  hosting?: OnboardingPlatform & { has?: OnboardingHas; wantsCreated?: boolean };
  cms?: OnboardingPlatform & { developer?: string };
  // Their business email — not the contact's email, which sits beside the answers.
  email?: { has?: OnboardingYesNo; provider?: string; wantsCreated?: boolean; accounts?: number; addresses?: string };
  logo?: { has?: OnboardingYesNo; link?: string; files?: OnboardingFile[]; wantsCreated?: boolean; style?: string };
  google?: Partial<Record<"businessProfile" | "analytics" | "searchConsole" | "tagManager" | "ads", OnboardingAccount>>;
  social?: Partial<Record<"facebook" | "instagram" | "youtube" | "linkedin" | "tiktok" | "x", OnboardingAccount>>;
  media?: Partial<Record<"professionalPhotos" | "businessPhotos" | "videos", OnboardingMedia>>;
}

// An onboarding as the backend gives it back: who is answering, and their answers so far.
export interface Onboarding {
  id: string;
  contactName: string;
  companyName: string;
  email: string;
  phone?: string;
  onboarding?: OnboardingAnswers & { status: OnboardingStatus; submittedAt?: string };
}

// Starting needs to know who is answering; the email can't be changed afterwards.
export interface StartOnboardingInput {
  contactName: string;
  companyName: string;
  email: string;
  phone?: string;
  // Any of the sections. One that is sent replaces what was stored for it.
  answers?: OnboardingAnswers;
  // true hands the onboarding in; false takes it back to "in progress".
  submit?: boolean;
}

export type UpdateOnboardingInput = Partial<Omit<StartOnboardingInput, "email">>;

interface OnboardingActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  // What was wrong with each field, when the backend refused the answers.
  fieldErrors?: string[];
  // HTTP status of a failed request: 409 = the email has an account, or the team has taken it on.
  status?: number;
}

// ── The key ──────────────────────────────────────────────────────────────────

// "<onboarding id>.<key>". Http-only, so the page's scripts can't read it; it lasts as long
// as someone might reasonably take to come back and finish.
const COOKIE = "bayshore_onboarding";
const COOKIE_MAX_AGE = 60 * 24 * 60 * 60;

type Kept = { id: string; key: string };

async function kept(): Promise<Kept | null> {
  const [id, key] = (await cookies()).get(COOKIE)?.value.split(".") ?? [];
  return id && key && /^[0-9a-f]{24}$/i.test(id) ? { id, key } : null;
}

async function keep({ id, key }: Kept) {
  (await cookies()).set(COOKIE, `${id}.${key}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

async function forget() {
  (await cookies()).delete(COOKIE);
}

// ── Talking to the backend ───────────────────────────────────────────────────

async function failure(response: Response, fallback: string) {
  let message = fallback;
  let errors: string[] | undefined;
  try {
    const body = await response.json();
    if (typeof body?.message === "string") message = body.message;
    if (Array.isArray(body?.errors) && body.errors.length) errors = body.errors as string[];
  } catch {
    // Not JSON — keep the fallback message.
  }
  return { ok: false as const, error: message, fieldErrors: errors, status: response.status };
}

const NETWORK_ERROR = { ok: false as const, error: "Network error. Please try again." };
const NOT_STARTED = { ok: false as const, error: "There is no onboarding in progress on this browser.", status: 404 };

// The key no longer opens anything: the onboarding was deleted (404), or the team has taken
// the client on (409). Either way there is nothing left for it to do.
const isOver = (status: number) => status === 404 || status === 409;

const call = (path: string, method: "POST" | "GET" | "PATCH" | "DELETE", key?: string, body?: unknown) =>
  fetch(`${API}${path}`, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(key ? { "x-onboarding-key": key } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

// ── The calls ────────────────────────────────────────────────────────────────

// Starts onboarding — and hands it in at once with `submit: true`. The backend creates a
// pending client and returns a key, which is kept in the cookie; it is not passed on to the page.
export async function startOnboardingAction(input: StartOnboardingInput): Promise<OnboardingActionResult<Onboarding>> {
  try {
    const response = await call("", "POST", undefined, input);
    if (!response.ok) return failure(response, "Couldn't save your onboarding.");

    const { data } = (await response.json()) as { data: Onboarding & { key: string } };
    const { key, ...onboarding } = data;
    // Handed in straight away: there is nothing to come back to (see updateOnboardingAction).
    if (input.submit === true) await forget();
    else await keep({ id: onboarding.id, key });
    return { ok: true, data: onboarding };
  } catch {
    return NETWORK_ERROR;
  }
}

// The onboarding this browser started, to carry on with — or `data: null` when there is none
// (never started here, deleted, or already taken on by the team). Reads the cookie only, so it
// can also be called while a page is being rendered.
export async function getOnboardingAction(): Promise<OnboardingActionResult<Onboarding | null>> {
  const own = await kept();
  if (!own) return { ok: true, data: null };

  try {
    const response = await call(`/${own.id}`, "GET", own.key);
    if (isOver(response.status)) return { ok: true, data: null, status: response.status };
    if (!response.ok) return failure(response, "Couldn't load your onboarding.");

    const { data } = (await response.json()) as { data: Onboarding };
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// Saves changes to the onboarding this browser started: answers, and the name, company or
// phone given with them. `submit: true` hands it in.
export async function updateOnboardingAction(input: UpdateOnboardingInput): Promise<OnboardingActionResult<Onboarding>> {
  const own = await kept();
  if (!own) return NOT_STARTED;

  try {
    const response = await call(`/${own.id}`, "PATCH", own.key, input);
    if (!response.ok) {
      if (isOver(response.status)) await forget();
      return failure(response, "Couldn't save your onboarding.");
    }

    const { data } = (await response.json()) as { data: Onboarding };
    // Once it is handed in, this browser lets go of it: the form starts empty the next time,
    // and the answers are the team's to work from. (They stay stored — only the key is dropped.)
    if (input.submit === true) await forget();
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// Withdraws the onboarding this browser started; the pending client it made goes with it.
export async function deleteOnboardingAction(): Promise<OnboardingActionResult<null>> {
  const own = await kept();
  if (!own) return NOT_STARTED;

  try {
    const response = await call(`/${own.id}`, "DELETE", own.key);
    // Gone already, or no longer ours to delete: the key is of no more use either way.
    if (response.ok || isOver(response.status)) await forget();
    if (!response.ok) return failure(response, "Couldn't delete your onboarding.");
    return { ok: true, data: null };
  } catch {
    return NETWORK_ERROR;
  }
}
