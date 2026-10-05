import { notFound, redirect } from "next/navigation";
import { getMyProjectAction } from "@/app/actions/project";
import ProjectForm from "@/component/projects/ProjectForm";
import { canEditProject } from "@/component/projects/projectUi";

const EditProjectPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const result = await getMyProjectAction(slug);

  if (result.status === 404 || result.status === 422) notFound();

  if (!result.ok || !result.data) {
    return (
      <div role="alert" className="rounded-xl border border-[#f5c2c2] bg-[#fdecec] px-4 py-3 text-[12.5px] font-medium text-[#b42318]">
        {result.error ?? "Could not load this project."} Please refresh the page to try again.
      </div>
    );
  }

  // A completed project can't be changed; its page says where it stands.
  if (!canEditProject(result.data)) redirect(`/projects/${slug}`);

  return <ProjectForm project={result.data} />;
};

export default EditProjectPage;
