"use client";

import { signOutAction } from "@/app/actions/auth";
import { useRealtime } from "@/lib/realtime";

// When the team deletes this client, its logins go with it: sign out of every open tab at once.
const AccountWatch = () => {
  useRealtime("account:removed", () => {
    void signOutAction();
  });
  return null;
};

export default AccountWatch;
