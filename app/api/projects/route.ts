import { forwardProjectForm } from "./forward";

// Opens a project with attached files: a multipart form with name, description,
// targetDate, priority and the files under `files`. Without files,
// createMyProjectAction (app/actions/project.ts) does the same.
export async function POST(request: Request) {
  return forwardProjectForm(request, "POST");
}
