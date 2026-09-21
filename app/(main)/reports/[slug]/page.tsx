import { notFound } from "next/navigation";
import { getMyReportAction } from "@/app/actions/reports";
import ReportDetails from "@/component/reports/ReportDetails";

// The `slug` in the URL is the report's id.
const ReportDetailsPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ print?: string }>;
}) => {
  const { slug } = await params;
  const { print } = await searchParams;
  const result = await getMyReportAction(slug);

  // 404 = not published, or not yours; 422 = the id isn't even a valid id.
  if (result.status === 404 || result.status === 422) notFound();

  if (!result.ok || !result.data) {
    return (
      <div className="report-error-banner" role="alert">
        {result.error ?? "Could not load this report."}
      </div>
    );
  }

  return <ReportDetails report={result.data.report} previous={result.data.previous} autoPrint={print === "1"} />;
};

export default ReportDetailsPage;
