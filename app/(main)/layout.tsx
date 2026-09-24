import { redirect } from "next/navigation";
import "../globals.css";
import { auth } from "@/auth";
import Sidebar from "@/component/layout/Sidebar";
import Topbar from "@/component/layout/Topbar";
import { SessionUserProvider } from "@/component/shared/SessionUser";

const initialsFromName = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "C";

const MainLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();

  // proxy.ts already gate-keeps every request that reaches here (including
  // rotating an expiring access token) — this is defense-in-depth only.
  if (!session?.user || session.user.role !== "client") {
    redirect("/sign-in");
  }

  const name = session.user.name ?? "Client";

  return (
    <SessionUserProvider user={{ name, initials: initialsFromName(name) }}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-y-auto print:overflow-visible">
          <Topbar />
          <div className="flex flex-col gap-4.5 px-9 pt-6 pb-10 print:gap-0 print:p-0">{children}</div>
        </div>
      </div>
    </SessionUserProvider>
  );
};

export default MainLayout;
