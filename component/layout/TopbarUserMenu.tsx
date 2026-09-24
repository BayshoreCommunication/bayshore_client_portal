"use client";

import Link from "next/link";
import { ChevronDown, LogOut, User } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { useSessionUser } from "@/component/shared/SessionUser";

const itemClass =
  "flex w-full cursor-pointer items-center gap-2 rounded-md border-none bg-transparent px-2.5 py-2 text-left text-[12.5px] font-semibold no-underline";

// A CSS-hover dropdown (Tailwind's `group`) — group-focus-within keeps it
// reachable by keyboard too, not just a mouse hover.
const TopbarUserMenu = () => {
  const { name, initials } = useSessionUser();

  return (
    <div className="group relative">
      <button
        type="button"
        className="flex h-10 cursor-pointer items-center gap-2 rounded-[10px] border border-[#e2e5e9] bg-white pl-1.5 pr-3 font-inherit text-inherit shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-[#f9fafb]"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0b1522] text-[11px] font-bold text-white">
          {initials}
        </div>
        <span className="whitespace-nowrap text-[12.5px] font-bold text-[#17242f]">{name}</span>
        <ChevronDown size={14} strokeWidth={2} />
      </button>

      <div className="invisible absolute right-0 top-[calc(100%+8px)] z-40 flex w-45 -translate-y-1 flex-col gap-0.5 rounded-[10px] border border-[#e2e5e9] bg-white p-1.5 opacity-0 shadow-[0_10px_28px_rgba(15,23,42,0.14)] transition-all duration-150 ease-out group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <Link href="/settings" className={`${itemClass} text-[#33434f] hover:bg-[#f3f4f6]`}>
          <User size={14} strokeWidth={2} /> Profile
        </Link>
        <form action={signOutAction}>
          <button type="submit" className={`${itemClass} text-[#b91c1c] hover:bg-[#fef2f2]`}>
            <LogOut size={14} strokeWidth={2} /> Sign out
          </button>
        </form>
      </div>
    </div>
  );
};

export default TopbarUserMenu;
