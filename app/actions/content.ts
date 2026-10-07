"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { BACKEND_API_URL } from "@/lib/backend";

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
  // When it was added to the piece — the same moment for files added in one save. Missing on
  // files from before this was kept, and on comment attachments.
  uploadedAt?: string;
}

// A file the piece used to have: BayShore replaced it while answering a revision, and it is
// kept so the two can be compared.
export interface ContentPreviousFile extends ContentFile {
  replacedAt: string;
  // The revision it was replaced in.
  revision?: number;
}

export interface ContentComment {
  author: "client" | "team";
  user?: ContentPerson | string;
  name?: string;
  // May be empty when the comment is only attachments.
  text: string;
  attachments?: ContentFile[];
  // On a request for changes: the revision round it belongs to (1, 2, …). The first comment
  // with a number is the one that opened that round.
  revision?: number;
  createdAt: string;
}

// One thing the client asked for during a revision: their words, and any files they sent.
export interface ContentRevisionRequest {
  text: string;
  attachments?: ContentFile[];
  name?: string;
  createdAt: string;
}

// One round of changes on a piece: what the client asked for, and BayShore's answer. A piece —
// a reel, a post, an image, a video — can go through any number of these.
export interface ContentRevision {
  // 1, 2, … in the order they were asked for.
  number: number;
  // Empty when BayShore opened the round on the client's behalf.
  requests: ContentRevisionRequest[];
  requestedAt: string;
  requestedByName?: string;
  // BayShore's feedback on it, in order: what was changed, with any files.
  responses?: ContentRevisionRequest[];
  // Set once the team has sent the revised piece back, with their note if they left one.
  submittedAt?: string;
  submittedByName?: string;
  note?: string;
}

// What a piece tells its group-mates about itself.
export interface ContentPiece {
  _id: string;
  type: ContentType;
  title: string;
  status: ContentStatus;
  // How many times the piece has been sent back for a revision.
  revisionCount?: number;
  // In revision, with no reply from BayShore since the client last asked for changes.
  awaitingTeam?: boolean;
  // The piece's revisions, oldest first — sent with a single piece's page, not with lists.
  revisions?: ContentRevision[];
  // The piece's first image, when it has one.
  thumbnail?: string;
  // The piece's messages, oldest first — sent with a single piece's page, not with lists.
  comments?: ContentComment[];
}

export interface ContentItem {
  _id: string;
  type: ContentType;
  title: string;

  // Pieces BayShore sent together are one item: every piece in this one's group, in the
  // order added (this piece included). Comes with a single piece and with a grouped list;
  // a piece sent on its own is a group of one.
  pieces?: ContentPiece[];
  batchMonth: string;
  // Older records may not have it — read those from isIndividual.
  batchType?: ContentBatchType;
  weekStart?: string;
  eventName?: string;
  eventDate?: string;
  isIndividual: boolean;
  sentReason?: string;
  status: ContentStatus;
  // How many times the piece has been sent back for a revision.
  revisionCount?: number;
  // Every revision the piece has been through, oldest first.
  revisions?: ContentRevision[];

  // Up to 10 files, and/or a pasted link (video, blog, website, email).
  files?: ContentFile[];
  link?: string;
  // Files replaced during a revision, newest first. `files` is always the piece as it stands.
  previousFiles?: ContentPreviousFile[];
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
    // One item per group of pieces sent together (its first piece, with `pieces`), not one per piece.
    grouped?: boolean;
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
    if (params.grouped) query.set("grouped", "true");

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

// `comment` is an optional note left with the approval; it joins the piece's comments.
export async function approveMyContentAction(id: string, comment?: string): Promise<ContentActionResult<ContentItem>> {
  const accessToken = await token();
  if (!accessToken) return { ok: false, error: "Not authenticated." };

  try {
    const note = comment?.trim();
    const response = await fetch(`${API}/me/${id}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, ...(note ? { "Content-Type": "application/json" } : {}) },
      body: note ? JSON.stringify({ comment: note }) : undefined,
    });
    if (!response.ok) return failure(response, "Failed to approve this item.");

    const { data } = await response.json();
    revalidatePath(LIST_PATH);
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// The client's own edit of a piece: its caption and tags, while it is still open (waiting
// for approval or in revision). The team sees a note on the piece's comments.
export async function updateMyContentAction(
  id: string,
  changes: { caption: string; tags: string[] },
): Promise<ContentActionResult<ContentItem>> {
  const accessToken = await token();
  if (!accessToken) return { ok: false, error: "Not authenticated." };

  try {
    const response = await fetch(`${API}/me/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    if (!response.ok) return failure(response, "Failed to save your changes.");

    const { data } = await response.json();
    revalidatePath(LIST_PATH);
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}
