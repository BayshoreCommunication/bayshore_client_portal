"use server";

import { auth } from "@/auth";
import { BACKEND_API_URL } from "@/lib/backend";
import type { MessagePage } from "@/component/messages/chat";

// The client's conversation with the BayShore team (backend: /messages/me). Sending goes through
// the upload route (app/api/messages/route.ts), since a message can carry files.

const token = async () => (await auth())?.accessToken;

// A page of it, oldest first: the newest, or the one before `before`. `report`: only the
// comments on that report.
export async function listMyMessagesAction(params: { before?: string; report?: string } = {}): Promise<MessagePage | null> {
  const accessToken = await token();
  if (!accessToken) return null;
  const query = new URLSearchParams({ limit: "40" });
  if (params.before) query.set("before", params.before);
  if (params.report) query.set("report", params.report);
  try {
    const response = await fetch(`${BACKEND_API_URL}/messages/me?${query}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    if (!response.ok) return null;
    return ((await response.json()) as { data: MessagePage }).data;
  } catch {
    return null;
  }
}

// Everything in it has been seen.
export async function markMyMessagesReadAction(): Promise<boolean> {
  const accessToken = await token();
  if (!accessToken) return false;
  try {
    const response = await fetch(`${BACKEND_API_URL}/messages/me/read`, { method: "PATCH", headers: { Authorization: `Bearer ${accessToken}` } });
    return response.ok;
  } catch {
    return false;
  }
}

// How many messages from the team are unread, for the sidebar.
export async function countUnreadMessagesAction(): Promise<number> {
  const accessToken = await token();
  if (!accessToken) return 0;
  try {
    const response = await fetch(`${BACKEND_API_URL}/messages/unread-count`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    if (!response.ok) return 0;
    return ((await response.json()) as { data: { unread: number } }).data.unread ?? 0;
  } catch {
    return 0;
  }
}
