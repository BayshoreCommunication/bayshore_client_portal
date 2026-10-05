import { redirect } from "next/navigation";
import { listMyProjectsAction } from "@/app/actions/project";
import Projects from "@/component/projects/Projects";
import {
  PROJECTS_PER_PAGE,
  isProjectPriority,
  isProjectStatus,
  projectsHref,
  type ProjectFilters,
} from "@/component/projects/projectUi";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const ProjectsPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const params = await searchParams;
  const rawStatus = first(params.status);
  const rawPriority = first(params.priority);
  const filters: ProjectFilters = {
    status: isProjectStatus(rawStatus) ? rawStatus : "all",
    priority: isProjectPriority(rawPriority) ? rawPriority : "all",
    q: first(params.q)?.trim() ?? "",
  };
  const page = Math.max(1, Number(first(params.page)) || 1);

  const result = await listMyProjectsAction({
    page,
    limit: PROJECTS_PER_PAGE,
    status: filters.status,
    priority: filters.priority,
    search: filters.q,
  });

  // A stale or hand-edited ?page=99 — or deleting the last project on a page —
  // lands on the last page that exists instead of an empty list.
  const totalPages = result.data?.pagination.totalPages ?? 0;
  if (totalPages > 0 && page > totalPages) redirect(projectsHref({ ...filters, page: totalPages }));

  return <Projects data={result.ok ? result.data : undefined} error={result.error} filters={filters} />;
};

export default ProjectsPage;
