import { forwardProjectForm } from "../forward";

// Edits a project and adds files to it: a multipart form with whatever changes,
// new files under `files`, and URLs to drop under `removeFiles`. Without new
// files, updateMyProjectAction (app/actions/project.ts) does the same.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{24}$/i.test(id)) {
    return Response.json({ success: false, message: "Project not found." }, { status: 404 });
  }

  return forwardProjectForm(request, "PATCH", id);
}
