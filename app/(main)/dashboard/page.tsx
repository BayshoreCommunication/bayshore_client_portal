import { auth } from "@/auth";
import { getMyDashboardAction } from "@/app/actions/dashboard";
import Dashboard from "@/component/dashboard/Dashboard";
import { buildDashboard } from "@/component/dashboard/dashboardData";

// The client's dashboard: everything on it comes from one call (backend: GET /dashboard/me).
const DashboardPage = async () => {
  const [session, result] = await Promise.all([auth(), getMyDashboardAction()]);

  return (
    <Dashboard
      name={session?.user?.name ?? "there"}
      model={result.ok ? buildDashboard(result.data) : null}
      error={result.ok ? undefined : result.error}
    />
  );
};

export default DashboardPage;
