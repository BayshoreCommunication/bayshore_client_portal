import { auth } from "@/auth";
import { listMyReportsAction } from "@/app/actions/reports";
import Dashboard from "@/component/dashboard/Dashboard";
import { buildDashboard } from "@/component/dashboard/dashboardData";

// Enough recent reports to compare the latest period and draw a six-point trend.
const DASHBOARD_REPORTS = 12;

const DashboardPage = async () => {
  const [session, result] = await Promise.all([auth(), listMyReportsAction({ limit: DASHBOARD_REPORTS, full: true })]);

  return (
    <Dashboard
      name={session?.user?.name ?? "there"}
      model={result.ok && result.data ? buildDashboard(result.data.reports) : null}
      error={result.ok ? undefined : result.error}
    />
  );
};

export default DashboardPage;
