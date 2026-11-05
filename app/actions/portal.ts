"use server";

import { auth } from "@/auth";
import { portalMenusFor, portalStateFor, type AccountState } from "@/lib/portal-menus";

// The pages of the portal the signed-in client is shown (lib/portal-menus.ts). `null` when it
// couldn't be read.
export async function getMyPortalMenusAction(): Promise<string[] | null> {
  const session = await auth();
  if (!session?.accessToken) return null;
  return portalMenusFor(session.accessToken);
}

// The menus, and whether the account is still there (the layout signs out one that isn't).
export async function getMyPortalStateAction(): Promise<{ menus: string[] | null; account: AccountState }> {
  const session = await auth();
  if (!session?.accessToken) return { menus: null, account: "ok" };
  return portalStateFor(session.accessToken);
}

// Only whether the account is still there — asked now and then by an open page (AccountWatch).
export async function checkMyAccountAction(): Promise<AccountState> {
  return (await getMyPortalStateAction()).account;
}
