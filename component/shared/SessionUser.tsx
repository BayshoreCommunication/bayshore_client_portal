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
    <div className="flex items-center gap-2.5 rounded-full border border-[#dce4e0] bg-white py-1.25 pr-3.5 pl-1.5">
      <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#0b1522] text-xs font-bold text-white">
        {initials}
      </div>
      <div>
        <div className="text-[12.5px] leading-[1.1] font-bold">{name}</div>
        <div className="text-[10.5px] text-[#6e808f]">Client Account</div>
      </div>
    </div>
  );
};
