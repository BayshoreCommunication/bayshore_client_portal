"use server";

import { cookies } from "next/headers";
import { auth } from "@/auth";
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
  // Inviting our access email, or sharing the login itself.
  access?: "invite" | "secure";
  loginUsername?: string;
  // Sent only when typed; the backend seals it, and sends back `loginPasswordSet` instead.
  loginPassword?: string;
  loginPasswordSet?: boolean;
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
  // Instagram: it is already connected to their Facebook Page.
  connected?: boolean;
  // The account's own login, when that is how we get in: its username or email, and its
  // password. The password is write-only: it is sent as typed, stored sealed, and never comes
  // back — `loginPasswordSet` says one is stored.
  loginUsername?: string;
  loginPassword?: string;
  loginPasswordSet?: boolean;
}

// One kind of photos or videos. `files` is read-only here: the backend ignores it on the way in.
export interface OnboardingMedia {
  mode?: OnboardingMediaMode;
  files?: OnboardingFile[];
  link?: string;
  notes?: string;
}

// A number per month as it is today, and as they want it.
export interface OnboardingTarget {
  current?: number;
  goal?: number;
}

// The form's sections. Every answer is optional — a missing one means "not answered".
export interface OnboardingAnswers {
  // About the business, and where it works. Also asked right after signing up
  // (clientstart/ClientSignup), which asks the services and the main contact too.
  business?: {
    description?: string;
    services?: string[];
    areas?: string[];
    contact?: { isAccountOwner?: boolean; name?: string; email?: string; phone?: string; reachBy?: "email" | "phone" | "text" };
  };
  // Where the business is now and where it wants to be. Money is in US dollars.
  goals?: {
    revenue?: OnboardingTarget;
    leads?: OnboardingTarget;
    newClients?: OnboardingTarget;
    timeframe?: "3_months" | "6_months" | "12_months" | "unsure";
    budget?: "under_1000" | "1000_3000" | "3000_5000" | "5000_10000" | "over_10000" | "unsure";
    costPerLead?: number;
    clientValue?: number;
    leadSources?: ("referrals" | "google_search" | "google_maps" | "paid_ads" | "social_media" | "other")[];
  };
  // Whether they say they booked the kickoff call, at the end of signing up.
  kickoffCall?: { booked?: boolean };
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
  // `has`: whether the website is built on a CMS at all. `giving`: with one, what they let us
  // into — its dashboard, the hosting, or both.
  cms?: OnboardingPlatform & { has?: "yes" | "no" | "unsure"; giving?: "cms" | "hosting" | "both"; developer?: string };
  // Their business email — not the contact's email, which sits beside the answers.
  email?: { has?: OnboardingYesNo; provider?: string; wantsCreated?: boolean; accounts?: number; addresses?: string };
  logo?: { has?: OnboardingYesNo; link?: string; files?: OnboardingFile[]; wantsCreated?: boolean; style?: string; styleFiles?: OnboardingFile[] };
  google?: Partial<Record<"businessProfile" | "analytics" | "searchConsole" | "tagManager" | "ads", OnboardingAccount>>;
  social?: Partial<Record<"facebook" | "instagram" | "youtube" | "linkedin" | "tiktok" | "x" | "email", OnboardingAccount>>;
  media?: Partial<Record<"professionalPhotos" | "businessPhotos" | "videos", OnboardingMedia>>;
}

// An onboarding as the backend gives it back: who is answering, and their answers so far.
export interface Onboarding {
  id: string;
  contactName: string;
  companyName: string;
  email: string;
  phone?: string;
  // `notNeeded` is the team's: the steps ("step:google") and items ("social.facebook") this
  // client isn't asked. `approved` is the items their account manager has approved.
  onboarding?: OnboardingAnswers & { status: OnboardingStatus; submittedAt?: string; notNeeded?: string[]; approved?: string[]; updateAsked?: string[] };
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

// ── For a client who is signed in ────────────────────────────────────────────

// A client with an account has their onboarding on their own client record (backend:
// /onboarding/me). Their session opens it, not a key — so there is nothing to start, no cookie,
// and it comes already filled in with what we hold on them.

const NOT_SIGNED_IN = { ok: false as const, error: "Not authenticated.", status: 401 };

async function callMine(method: "GET" | "PATCH", body?: unknown) {
  const session = await auth();
  if (!session?.accessToken) return null;
  return fetch(`${API}/me`, {
    method,
    headers: { Authorization: `Bearer ${session.accessToken}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
}

// The signed-in client's details and answers so far.
export async function getMyOnboardingAction(): Promise<OnboardingActionResult<Onboarding>> {
  try {
    const response = await callMine("GET");
    if (!response) return NOT_SIGNED_IN;
    if (!response.ok) return failure(response, "Couldn't load your onboarding.");

    const { data } = (await response.json()) as { data: Onboarding };
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// Saves the signed-in client's answers, and the name, company or phone given with them.
// `submit: true` hands it in.
export async function updateMyOnboardingAction(input: UpdateOnboardingInput): Promise<OnboardingActionResult<Onboarding>> {
  try {
    const response = await callMine("PATCH", input);
    if (!response) return NOT_SIGNED_IN;
    if (!response.ok) return failure(response, "Couldn't save your onboarding.");

    const { data } = (await response.json()) as { data: Onboarding };
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

// ── Comments on the form ─────────────────────────────────────────────────────

// A comment the client wrote on a step of their form, and the team's replies to it (backend:
// models/onboardingComment.model.ts). Posting one carries files, so it goes through the upload
// route (app/api/onboarding/comments/route.ts), not a server action.
export interface OnboardingCommentFile {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}
export interface OnboardingCommentReply {
  _id: string;
  authorName: string;
  text: string;
  files: OnboardingCommentFile[];
  createdAt: string;
}
export interface OnboardingComment {
  _id: string;
  step: string;
  // The item of the step it is about, when it is about one ("social.facebook"), and its name.
  item?: string;
  itemLabel?: string;
  // Who wrote it: the client, or their BayShore team. Missing means the client.
  side?: "client" | "team";
  authorName: string;
  text: string;
  files: OnboardingCommentFile[];
  createdAt: string;
  replies: OnboardingCommentReply[];
}

export async function listMyOnboardingCommentsAction(): Promise<OnboardingActionResult<OnboardingComment[]>> {
  const session = await auth();
  if (!session?.accessToken) return NOT_SIGNED_IN;
  try {
    const response = await fetch(`${API}/me/comments`, { headers: { Authorization: `Bearer ${session.accessToken}` }, cache: "no-store" });
    if (!response.ok) return failure(response, "Couldn't load your comments.");
    const { data } = (await response.json()) as { data: OnboardingComment[] };
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}
