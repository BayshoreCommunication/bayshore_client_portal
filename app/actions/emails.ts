"use server";

import { auth } from "@/auth";
import { BACKEND_API_URL } from "@/lib/backend";

// The signed-in client's email addresses: the one they sign in with, and their others — each
// emailed a copy of everything sent to the first (backend: utils/email.ts → sendEmail).
export type MyEmails = { primary: string; secondary: string[] };
export type EmailsResult = { ok: true; data: MyEmails } | { ok: false; error: string };

const API = `${BACKEND_API_URL}/clients/me/emails`;

async function call(method: "GET" | "POST" | "DELETE", email?: string): Promise<EmailsResult> {
  const session = await auth();
  if (!session?.accessToken) return { ok: false, error: "Please sign in again." };
  try {
    const response = await fetch(API, {
      method,
      headers: { Authorization: `Bearer ${session.accessToken}`, ...(email === undefined ? {} : { "Content-Type": "application/json" }) },
      body: email === undefined ? undefined : JSON.stringify({ email }),
      cache: "no-store",
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const errors: unknown = body?.errors;
      const first = Array.isArray(errors) && typeof errors[0] === "string" ? errors[0] : undefined;
      return { ok: false, error: first ?? (typeof body?.message === "string" ? body.message : "Something went wrong. Please try again.") };
    }
    return { ok: true, data: body.data as MyEmails };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export async function getMyEmailsAction(): Promise<EmailsResult> {
  return call("GET");
}

export async function addMyEmailAction(email: string): Promise<EmailsResult> {
  return call("POST", email);
}

export async function removeMyEmailAction(email: string): Promise<EmailsResult> {
  return call("DELETE", email);
}
