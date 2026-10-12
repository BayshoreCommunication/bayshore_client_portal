"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { firstShownPage, isPageShown } from "./portalPages";

// Keeps a client off the pages their team hasn't turned on for them, as they move around the
// portal: a page that isn't in their menu isn't shown, and they are sent to the first one that
// is. (Arriving at such a page from outside is turned away sooner, by app/(main)/layout.tsx.)
const PortalGuard = ({ menus, children }: { menus: string[] | null; children: ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const shown = isPageShown(pathname, menus);

  useEffect(() => {
    if (!shown) router.replace(firstShownPage(menus));
  }, [shown, menus, router]);

  return shown ? children : null;
};

export default PortalGuard;
