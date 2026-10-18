import { BACKEND_API_URL } from "@/lib/backend";

// The pages of the portal a client is shown, as their team chose them in the company portal
// (backend: GET /clients/me/portal) — the keys of the entries in the sidebar's menu. `null`
// when it couldn't be read: the menu then shows everything, since leaving a client with no
// menu at all over a hiccup would be worse than showing them a page too many.
export async function portalMenusFor(accessToken: string): Promise<string[] | null> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/clients/me/portal`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return null;

    const body = (await response.json()) as { data?: { menus?: unknown } };
    const menus = body.data?.menus;
    return Array.isArray(menus) ? menus.filter((menu): menu is string => typeof menu === "string") : null;
  } catch {
    return null;
  }
}
