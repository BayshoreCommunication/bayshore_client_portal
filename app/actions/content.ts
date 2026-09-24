"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8000/api/v1";
const API = `${BACKEND_API_URL}/content`;

// Where content is reviewed in this portal; refreshed after every change.
const LIST_PATH = "/content";

// Mirrors the backend's content model (models/content.model.ts).
export type ContentType = "image" | "carousel" | "story" | "video" | "blog" | "website" | "email" | "gmb" | "ad";
// A client never sees "draft" — the backend excludes it from /content/me.
export type ContentStatus = "pending_approval" | "revision_requested" | "approved";
export type ContentBatchType = "monthly" | "weekly" | "event" | "individual";
export type ContentMedia = "image" | "video" | "doc";

export interface ContentPerson {
  _id: string;
  fullName: string;
}

// One uploaded file, stored in DigitalOcean Spaces.
export interface ContentFile {
  url: string;
  name: string;
  size: number;
  mimeType: string;
  media: ContentMedia;
}

export interface ContentComment {
  author: "client" | "team";
  user?: ContentPerson | string;
  name?: string;
  // May be empty when the comment is only attachments.
  text: string;
  attachments?: ContentFile[];
  createdAt: string;
}

export interface ContentItem {
  _id: string;
  type: ContentType;
  title: string;
  batchMonth: string;
  // Older records may not have it — read those from isIndividual.
  batchType?: ContentBatchType;
  weekStart?: string;
  eventName?: string;
  eventDate?: string;
  isIndividual: boolean;
  sentReason?: string;
  status: ContentStatus;

  // Up to 10 files, and/or a pasted link (video, blog, website, email).
  files?: ContentFile[];
  link?: string;
  pageName?: string;
  pageUrl?: string;
  subject?: string;
  headline?: string;
  cta?: string;
  caption?: string;
  tags: string[];

  // Single-URL fields from before `files` existed.
  imageUrl?: string;
  imageAlt?: string;
  videoUrl?: string;
  docName?: string;
  docTitle?: string;
  docUrl?: string;

  comments: ContentComment[];
  createdBy?: ContentPerson | string;
  submittedAt?: string;
  approvedBy?: ContentPerson | string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// What POST /api/content/:id/comments (the upload route) answers with.
export interface ContentCommentResponse {
  success: boolean;
  message: string;
  data?: ContentItem;
  errors?: string[];
}

export interface MyContentListData {
  items: ContentItem[];
  // The regular monthly batches this client has (for the month dropdown) — not one-off sends.
  months: string[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

interface ContentActionResult<T> {
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

export async function listMyContentAction(
  params: {
    page?: number;
    limit?: number;
    batchMonth?: string;
    batchType?: ContentBatchType;
    individual?: boolean;
  } = {},
): Promise<ContentActionResult<MyContentListData>> {
  const accessToken = await token();
  if (!accessToken) return { ok: false, error: "Not authenticated." };

  try {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 50),
    });
    if (params.batchMonth) query.set("batchMonth", params.batchMonth);
    if (params.batchType) query.set("batchType", params.batchType);
    if (params.individual !== undefined) query.set("individual", String(params.individual));

    const response = await fetch(`${API}/me?${query}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return failure(response, "Failed to fetch content.");

    const { data } = await response.json();
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export async function getMyContentAction(id: string): Promise<ContentActionResult<ContentItem>> {
  const accessToken = await token();
  if (!accessToken) return { ok: false, error: "Not authenticated." };

  try {
    const response = await fetch(`${API}/me/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return failure(response, "Failed to fetch content.");

    const { data } = await response.json();
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export async function approveMyContentAction(id: string): Promise<ContentActionResult<ContentItem>> {
  const accessToken = await token();
  if (!accessToken) return { ok: false, error: "Not authenticated." };

  try {
    const response = await fetch(`${API}/me/${id}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return failure(response, "Failed to approve this item.");

    const { data } = await response.json();
    revalidatePath(LIST_PATH);
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}
