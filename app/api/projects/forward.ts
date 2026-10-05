import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { BACKEND_API_URL } from "@/lib/backend";

// Passes a multipart project form — its fields and attached files — straight on to
// the backend's /projects/me routes. Route handlers rather than server actions
// because actions cap request bodies at 1MB; this never holds the upload in memory.
// The backend checks everything: the fields, the file types, sizes and count.
export async function forwardProjectForm(request: Request, method: "POST" | "PATCH", id?: string) {
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
    const response = await fetch(`${BACKEND_API_URL}/projects/me${id ? `/${id}` : ""}`, {
      method,
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": contentType },
      body: request.body,
      // Required by Node's fetch to send a streamed body.
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    const body = await response.json().catch(() => ({ success: false, message: "The server sent an unexpected response." }));
    if (response.ok) {
      revalidatePath("/projects");
      if (id) revalidatePath(`/projects/${id}`);
    }
    return Response.json(body, { status: response.status });
  } catch {
    return Response.json({ success: false, message: "Couldn't reach the server. Please try again." }, { status: 502 });
  }
}
