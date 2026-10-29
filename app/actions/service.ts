"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { BACKEND_API_URL } from "@/lib/backend";

// The signed-in client's own services, and the catalog they can add from.
const API = `${BACKEND_API_URL}/services/me`;

// Where services are shown in this portal; refreshed after adding.
const LIST_PATH = "/services";

// Mirror backend/models/service.model.ts — keep the lists in step.
export type ServicePlan = "growth" | "core";

export interface SubService {
  _id: string;
  name: string;
  // Whole dollars a month.
  price: number;
}

// A service BayShore offers.
export interface CatalogService {
  _id: string;
  title: string;
  description?: string;
  plan: ServicePlan;
  color?: string;
  subServices: SubService[];
  // The sum of the sub-services' prices.
  monthlyPrice: number;
}

// One service the client takes: the sub-services included and what it costs a month.
export interface MyService {
  _id: string;
  service: Pick<CatalogService, "_id" | "title" | "description" | "plan" | "color">;
  subServices: { subService: string; name: string; price: number }[];
  monthlyPrice: number;
  // Whether the client added it themselves or the BayShore team did.
  addedBy?: "client" | "team";
  createdAt: string;
  updatedAt: string;
}

// A service the client's team set up for them on their record (the company portal's client
// form): its quantities and prices under their labels, what it covers, and its monthly cost.
export interface MyServicePlan {
  name: string;
  fields: { label: string; value: number }[];
  monthly: number;
  included: string[];
  // Made by their team for them (not one from the catalog).
  custom?: boolean;
  // When it was put on their account.
  addedAt?: string;
}

// A service the team finished for the client: no longer billed, kept to look back on.
export interface MyServiceHistoryItem {
  name: string;
  billing: "monthly" | "one_time";
  price: number;
  included?: string[];
  addedAt?: string;
  doneAt?: string;
}

export interface MyServicesData {
  services: MyService[];
  // The client's monthly payment for those catalog services.
  monthlyTotal: number;
  // The services on their record, what those come to a month, and any never priced there.
  // Missing from a backend that doesn't send them yet.
  plans?: MyServicePlan[];
  planTotal?: number;
  unpriced?: string[];
  // Paid once, not each month (a logo designed for them), and what those come to.
  oneTime?: { name: string; price: number; detail?: string; included?: string[]; addedAt?: string }[];
  // What the client asked for from the Services page.
  requests?: ServiceRequest[];
  oneTimeTotal?: number;
  // Finished services, newest first.
  history?: MyServiceHistoryItem[];
}

// A service to add: its id and the ids of the sub-services wanted.
export interface AddServiceInput {
  service: string;
  subServices: string[];
}

interface ServiceActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: string[];
  // HTTP status of a failed request.
  status?: number;
}

async function token() {
  const session = await auth();
  return session?.accessToken;
}

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

const NOT_SIGNED_IN = { ok: false as const, error: "Not authenticated." };
const NETWORK_ERROR = { ok: false as const, error: "Network error. Please try again." };

// What the client takes now and what it adds up to a month.
export async function listMyServicesAction(): Promise<ServiceActionResult<MyServicesData>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(API, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    if (!response.ok) return failure(response, "Failed to fetch your services.");

    const { data } = await response.json();
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// Every service BayShore offers, with its sub-services and prices.
export async function listServiceCatalogAction(): Promise<ServiceActionResult<CatalogService[]>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/catalog`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    if (!response.ok) return failure(response, "Failed to fetch the services on offer.");

    const { data } = await response.json();
    return { ok: true, data: data.services };
  } catch {
    return NETWORK_ERROR;
  }
}

// A paid-for order of more services. `pending` until Stripe confirms the payment;
// the services are on the account once it is `paid`.
export type ServiceOrderStatus = "pending" | "paid" | "expired" | "failed";

export interface ServiceOrder {
  _id: string;
  status: ServiceOrderStatus;
  // Whole dollars charged: the first month of what was added.
  amount: number;
  currency: string;
  items: { service: string; title: string; total: number; subServices: { subService: string; name: string; price: number }[] }[];
  paidAt?: string;
  createdAt: string;
  // The client's monthly payment as it stands now.
  monthlyTotal: number;
}

// Starts paying for more services (or more sub-services of ones already taken).
// Returns Stripe's payment page to send the client to — `url` is null when nothing
// was due and the services were added straight away. The services are only added
// once Stripe confirms the payment; nothing the client has is ever removed.
export async function createServiceCheckoutAction(
  services: AddServiceInput[],
): Promise<ServiceActionResult<{ url: string | null; order: ServiceOrder }>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/checkout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ services }),
    });
    if (!response.ok) return failure(response, "Couldn't start the payment.");

    const { data } = await response.json();
    if (data.order?.status === "paid") revalidatePath(LIST_PATH);
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// How an order went, by the Stripe session id in the return URL. A paid order's
// services are on the account by the time this answers "paid".
export async function getServiceOrderAction(sessionId: string): Promise<ServiceActionResult<ServiceOrder>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/orders/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return failure(response, "Couldn't check the payment.");

    // No revalidatePath here: the payment page calls this while it renders, where
    // that isn't allowed — and the Services page reads fresh data on every visit anyway.
    const { data } = await response.json();
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// A service the client asked for from this page, and whether the team has added it yet.
export interface ServiceRequest {
  name: string;
  status: "open" | "added";
  requestedAt: string;
}

// Asks for a service (or anything else, `service` null): kept on the client's record for their
// team, who add it as a service — and sent to their account manager as a message too.
export async function requestServiceAction(service: string | null, note?: string): Promise<ServiceActionResult<{ requests: ServiceRequest[] }>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;
  try {
    const response = await fetch(`${API}/requests`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...(service ? { service } : {}), ...(note?.trim() ? { note: note.trim() } : {}) }),
    });
    if (!response.ok) return failure(response, "Couldn't send your request. Please try again.");
    const { data } = await response.json();
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}
