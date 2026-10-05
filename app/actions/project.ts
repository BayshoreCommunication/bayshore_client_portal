"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { BACKEND_API_URL } from "@/lib/backend";

// The signed-in client's own projects only.
const API = `${BACKEND_API_URL}/projects/me`;

// Where projects are listed in this portal; refreshed after every change.
const LIST_PATH = "/projects";

// Mirror backend/models/project.model.ts — keep the lists in step.
export type ProjectPriority = "low" | "normal" | "high";
// Set by the BayShore team; a client sees it but can't change it.
export type ProjectStatus = "new" | "in_progress" | "completed";

export interface ProjectFile {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface MyProject {
  _id: string;
  name: string;
  description?: string;
  targetDate?: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  files: ProjectFile[];
  // Whether the client opened it or the team did on their behalf.
  requestedBy: "client" | "team";
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MyProjectListData {
  projects: MyProject[];
  // Per status across all the client's projects — it doesn't change when the
  // list is narrowed by status, priority or search.
  summary: Record<"total" | ProjectStatus, number>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

export interface MyProjectInput {
  name: string;
  description?: string;
  // A bare date, "2026-10-30". Send "" when editing to clear it.
  targetDate?: string;
  priority?: ProjectPriority;
}

// Editing sends only what changes. `removeFiles` drops attached files by URL.
export type MyProjectUpdateInput = Partial<MyProjectInput> & { removeFiles?: string[] };

interface ProjectActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: string[];
  // HTTP status of a failed request, so pages can tell "not found" (404) from
  // "not allowed any more" (409: completed, or already started) and other errors.
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

const authorised = (accessToken: string, json = false): HeadersInit => ({
  Authorization: `Bearer ${accessToken}`,
  ...(json ? { "Content-Type": "application/json" } : {}),
});

export async function listMyProjectsAction(
  params: {
    page?: number;
    limit?: number;
    status?: "all" | ProjectStatus;
    priority?: "all" | ProjectPriority;
    search?: string;
  } = {},
): Promise<ProjectActionResult<MyProjectListData>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
    });
    if (params.status && params.status !== "all") query.set("status", params.status);
    if (params.priority && params.priority !== "all") query.set("priority", params.priority);
    if (params.search?.trim()) query.set("q", params.search.trim());

    const response = await fetch(`${API}?${query}`, {
      headers: authorised(accessToken),
      cache: "no-store",
    });
    if (!response.ok) return failure(response, "Failed to fetch projects.");

    const { data } = await response.json();
    const { projects, summary, pagination } = data;
    return {
      ok: true,
      data: {
        projects,
        summary,
        pagination: {
          ...pagination,
          hasPreviousPage: pagination.page > 1,
          hasNextPage: pagination.page < pagination.totalPages,
        },
      },
    };
  } catch {
    return NETWORK_ERROR;
  }
}

export async function getMyProjectAction(id: string): Promise<ProjectActionResult<MyProject>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}`, {
      headers: authorised(accessToken),
      cache: "no-store",
    });
    if (!response.ok) return failure(response, "Failed to fetch project.");

    const { data } = await response.json();
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// Opens a project without files. To attach files, post a multipart form to
// /api/projects instead (see app/api/projects/route.ts): a server action caps the
// request body at 1MB, so uploads go through that route handler.
export async function createMyProjectAction(input: MyProjectInput): Promise<ProjectActionResult<MyProject>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(API, {
      method: "POST",
      headers: authorised(accessToken, true),
      body: JSON.stringify(input),
    });
    if (!response.ok) return failure(response, "Failed to create project.");

    const { data } = await response.json();
    revalidatePath(LIST_PATH);
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// Changes a project's details and drops attached files (`removeFiles`). Allowed until
// the project is completed (409 after that). To add files, send a multipart PATCH to
// /api/projects/[id] instead (see app/api/projects/[id]/route.ts).
export async function updateMyProjectAction(
  id: string,
  input: MyProjectUpdateInput,
): Promise<ProjectActionResult<MyProject>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}`, {
      method: "PATCH",
      headers: authorised(accessToken, true),
      body: JSON.stringify(input),
    });
    if (!response.ok) return failure(response, "Failed to update project.");

    const { data } = await response.json();
    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${id}`);
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// Allowed only while the project is still "new"; once the team has started on it
// the backend answers 409 with a message to show.
export async function deleteMyProjectAction(id: string): Promise<ProjectActionResult<null>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: authorised(accessToken),
    });
    if (!response.ok) return failure(response, "Failed to delete project.");

    revalidatePath(LIST_PATH);
    return { ok: true, data: null };
  } catch {
    return NETWORK_ERROR;
  }
}
