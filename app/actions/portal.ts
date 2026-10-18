"use server";

import { auth } from "@/auth";
import { portalMenusFor } from "@/lib/portal-menus";

// The pages of the portal the signed-in client is shown (lib/portal-menus.ts). `null` when it
// couldn't be read.
export async function getMyPortalMenusAction(): Promise<string[] | null> {
  const session = await auth();
  if (!session?.accessToken) return null;
  return portalMenusFor(session.accessToken);
}
