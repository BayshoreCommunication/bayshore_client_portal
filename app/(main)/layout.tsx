import { redirect } from "next/navigation";
import "../globals.css";
import "../portal.css";
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
      <div className="std-page">
        <Sidebar />
        <div className="workspace">
          <Topbar name={name} initials={initialsFromName(name)} />
          <div className="content-area">{children}</div>
        </div>
      </div>
    </SessionUserProvider>
  );
};

export default MainLayout;
