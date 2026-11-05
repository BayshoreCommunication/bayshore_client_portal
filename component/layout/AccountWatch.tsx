"use client";

import { useEffect, useRef } from "react";
import { signOutGoneAction } from "@/app/actions/auth";
import { checkMyAccountAction } from "@/app/actions/portal";
import { useRealtime } from "@/lib/realtime";

// Once the team deletes this client (or switches its login off), it is signed out — in every
// open tab:
//   • at once, when the backend says so live ("account:removed");
//   • and, should the live connection be down, the next time a page loads (the layout passes
//     `gone`), every half minute while a page stays open, and whenever the tab is looked at again.
const CHECK_EVERY_MS = 30_000;

const AccountWatch = ({ gone }: { gone: "removed" | "inactive" | null }) => {
  const leaving = useRef(false);

  const leave = (reason: "removed" | "inactive") => {
    if (leaving.current) return;
    leaving.current = true;
    void signOutGoneAction(reason).catch(() => {
      // Couldn't reach the portal's server just now: the next check tries again.
      leaving.current = false;
    });
  };
  const latest = useRef(leave);
  useEffect(() => {
    latest.current = leave;
  });

  useRealtime("account:removed", () => latest.current("removed"));

  useEffect(() => {
    if (gone) latest.current(gone);
  }, [gone]);

  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== "visible" || leaving.current) return;
      void checkMyAccountAction().then((state) => {
        if (state !== "ok") latest.current(state);
      });
    };
    const timer = setInterval(check, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, []);

  return null;
};

export default AccountWatch;
