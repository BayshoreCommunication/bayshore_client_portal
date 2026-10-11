import { auth } from "@/auth";
import { BACKEND_API_URL } from "@/lib/backend";

// The photos and videos a signed-in client uploads with their onboarding, passed on to the
// backend's /onboarding/me/media routes (which send them to DigitalOcean Spaces). Route
// handlers rather than server actions because actions cap request bodies at 1MB; the upload is
// streamed through, never held in memory here. The backend checks everything: the kind, the
// file types, sizes and count.

const KINDS = ["professionalPhotos", "businessPhotos", "videos"];

type Context = { params: Promise<{ kind: string }> };

async function send(kind: string, init: (accessToken: string) => RequestInit) {
  if (!KINDS.includes(kind)) return Response.json({ success: false, message: "Unknown kind of photos or videos." }, { status: 404 });

  const session = await auth();
  if (!session?.accessToken) return Response.json({ success: false, message: "Your session has ended — sign in again." }, { status: 401 });

  try {
    const response = await fetch(`${BACKEND_API_URL}/onboarding/me/media/${kind}`, init(session.accessToken));
    const body = await response.json().catch(() => ({ success: false, message: "The server sent an unexpected response." }));
    return Response.json(body, { status: response.status });
  } catch {
    return Response.json({ success: false, message: "Couldn't reach the server. Please try again." }, { status: 502 });
  }
}

// Adds files: a multipart form with them under `files`.
export async function POST(request: Request, { params }: Context) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data") || !request.body) {
    return Response.json({ success: false, message: "Expected a multipart form upload." }, { status: 400 });
  }

  return send((await params).kind, (accessToken) => ({
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": contentType },
    body: request.body,
    // Required by Node's fetch to send a streamed body.
    duplex: "half",
  }) as RequestInit);
}

// Takes one file back: its `url`, as JSON.
export async function DELETE(request: Request, { params }: Context) {
  const { url } = (await request.json().catch(() => ({}))) as { url?: unknown };

  return send((await params).kind, (accessToken) => ({
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  }));
}
