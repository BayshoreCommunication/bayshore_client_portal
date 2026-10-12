import { headers } from "next/headers";
import { redirect } from "next/navigation";
import "../globals.css";
import { auth } from "@/auth";
import { getMyPortalMenusAction } from "@/app/actions/portal";
import PortalGuard from "@/component/layout/PortalGuard";
import { firstShownPage, isPageShown } from "@/component/layout/portalPages";
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
  // Which pages their team has left on for them (null: couldn't be read, so all of them).
  const menus = await getMyPortalMenusAction();
  // A page that isn't one of them can't be opened by its address either: they land on the
  // first page they are shown. (proxy.ts passes the path along; a layout can't see it itself.)
  const pathname = (await headers()).get("x-pathname");
  if (pathname && !isPageShown(pathname, menus)) redirect(firstShownPage(menus));

  return (
    <SessionUserProvider user={{ name, initials: initialsFromName(name) }}>
      <div className="flex min-h-screen">
        <Sidebar menus={menus} />
        {/* No overflow here on purpose: the window is what scrolls, and an overflow container that
            never scrolls would stop `sticky` from working on every page inside it. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <div className="flex flex-col gap-4.5 px-9 pt-6 pb-10 print:gap-0 print:p-0">
            <PortalGuard menus={menus}>{children}</PortalGuard>
          </div>
        </div>
      </div>
    </SessionUserProvider>
  );
};

export default MainLayout;
