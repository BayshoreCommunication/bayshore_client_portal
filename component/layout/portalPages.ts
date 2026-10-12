// The pages of the portal a client's team can turn on or off for them (the backend's
// CLIENT_PORTAL_MENUS; the sidebar's entries carry the same keys). Each lives at "/" + its
// key. Any other page — Settings — is always there.
const PORTAL_PAGES = ["dashboard", "onboarding", "reports", "content", "leads", "projects", "services", "calendar", "messages", "payments", "notifications"];

// Whether the page at `pathname` is one the client is shown. `menus` are the pages left on
// for them; null means all of them.
export const isPageShown = (pathname: string, menus: string[] | null) => {
  const page = pathname.split("/")[1] ?? "";
  return !menus || !PORTAL_PAGES.includes(page) || menus.includes(page);
};

// Where a client is sent from a page they aren't shown: the first one they are, or Settings.
export const firstShownPage = (menus: string[] | null) => {
  const page = menus ? PORTAL_PAGES.find((key) => menus.includes(key)) : PORTAL_PAGES[0];
  return page ? `/${page}` : "/settings";
};
