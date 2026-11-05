import { BACKEND_API_URL } from "@/lib/backend";

// The pages of the portal a client is shown, as their team chose them in the company portal
// (backend: GET /clients/me/portal) — the keys of the entries in the sidebar's menu. `null`
// when it couldn't be read: the menu then shows everything, since leaving a client with no
// menu at all over a hiccup would be worse than showing them a page too many.
export async function portalMenusFor(accessToken: string): Promise<string[] | null> {
  return (await portalStateFor(accessToken)).menus;
}

// Whether the signed-in login still has a way in: "removed" when the backend says the login is
// gone (the client was deleted), "inactive" when it is switched off (the login, or its client
// paused or closed), "ok" otherwise — a hiccup included, which says nothing either way.
export type AccountState = "ok" | "removed" | "inactive";

// The menus, and — from the same answer — whether the account is still there.
export async function portalStateFor(accessToken: string): Promise<{ menus: string[] | null; account: AccountState }> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/clients/me/portal`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) {
      const message = await response
        .json()
        .then((body: { message?: unknown }) => (typeof body?.message === "string" ? body.message : ""))
        .catch(() => "");
      const account: AccountState = response.status === 401 && message === "User no longer exists" ? "removed" : response.status === 403 ? "inactive" : "ok";
      return { menus: null, account };
    }

    const body = (await response.json()) as { data?: { menus?: unknown } };
    const menus = body.data?.menus;
    return { menus: Array.isArray(menus) ? menus.filter((menu): menu is string => typeof menu === "string") : null, account: "ok" };
  } catch {
    return { menus: null, account: "ok" };
  }
}
