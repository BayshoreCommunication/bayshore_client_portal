"use client";

import { createContext, useContext } from "react";

export type SessionUserInfo = { name: string; initials: string };

const SessionUserContext = createContext<SessionUserInfo>({ name: "Client", initials: "C" });

export const SessionUserProvider = ({
  user,
  children,
}: {
  user: SessionUserInfo;
  children: React.ReactNode;
}) => <SessionUserContext.Provider value={user}>{children}</SessionUserContext.Provider>;

export const useSessionUser = () => useContext(SessionUserContext);

export const UserBadge = () => {
  const { name, initials } = useSessionUser();

  return (
    <div className="user-badge">
      <div className="avatar" style={{ background: "#0b1522" }}>
        {initials}
      </div>
      <div>
        <div className="user-name">{name}</div>
        <div className="user-role">Client Account</div>
      </div>
    </div>
  );
};
