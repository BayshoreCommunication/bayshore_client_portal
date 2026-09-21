import ProjectDetails from "@/component/projects/ProjectDetails";

const ProjectDetailsPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;

  return <ProjectDetails projectId={slug} />;
};

export default ProjectDetailsPage;
