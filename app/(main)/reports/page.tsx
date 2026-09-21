import { listMyReportsAction } from "@/app/actions/reports";
import Reports from "@/component/reports/Reports";

// A client has a handful of reports a month at most, so the page loads them
// in one go and the list filters and pages them in the browser.
const REPORTS_LIMIT = 100;

const ReportsPage = async () => {
  const result = await listMyReportsAction({ limit: REPORTS_LIMIT });

  if (!result.ok || !result.data) {
    return (
      <div className="report-error-banner" role="alert">
        {result.error ?? "Could not load your reports."}
      </div>
    );
  }

  return <Reports reports={result.data.reports} />;
};

export default ReportsPage;
