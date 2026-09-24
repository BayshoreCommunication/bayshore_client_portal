import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8000/api/v1";

// The client's feedback on a piece — text and attached images, videos or documents —
// streamed on to the backend's POST /content/me/:id/comments, which also moves the
// piece to "revision requested". A route handler rather than a server action because
// actions cap request bodies at 1MB; this never holds the upload in memory.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{24}$/i.test(id)) {
    return Response.json({ success: false, message: "Content not found." }, { status: 404 });
  }

  const session = await auth();
  const accessToken = session?.accessToken;
  if (!accessToken) {
    return Response.json({ success: false, message: "Your session has ended — sign in again." }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data") || !request.body) {
    return Response.json({ success: false, message: "Expected a multipart form upload." }, { status: 400 });
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/content/me/${id}/comments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": contentType },
      body: request.body,
      // Required by Node's fetch to send a streamed body.
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    const body = await response.json().catch(() => ({ success: false, message: "The server sent an unexpected response." }));
    if (response.ok) {
      revalidatePath("/content");
      revalidatePath(`/content/${id}`);
    }
    return Response.json(body, { status: response.status });
  } catch {
    return Response.json({ success: false, message: "Couldn't reach the server. Please try again." }, { status: 502 });
  }
}
