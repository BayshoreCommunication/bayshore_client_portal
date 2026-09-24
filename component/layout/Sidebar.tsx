"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import {
  LayoutDashboard,
  FileText,
  Layers,
  UserPlus,
  Package,
  Briefcase,
  Calendar,
  MessageSquare,
  CreditCard,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
};

type NavSection = {
  heading: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    heading: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { label: "Reports", icon: FileText, href: "/reports" },
      { label: "Content", icon: Layers, href: "/content" },
      { label: "Leads", icon: UserPlus, href: "/leads" },
      { label: "Projects", icon: Briefcase, href: "/projects" },
      { label: "Services", icon: Package, href: "/services" },
    ],
  },
  {
    heading: "Workspace",
    items: [
      { label: "Calendar", icon: Calendar, href: "/calendar" },
      { label: "Messages", icon: MessageSquare, href: "/messages", badge: 2 },
      { label: "Payments", icon: CreditCard, href: "/payments" },
    ],
  },
  {
    heading: "Account",
    items: [
      { label: "Notifications", icon: Bell, href: "/notifications" },
      { label: "Settings", icon: Settings, href: "/settings" },
    ],
  },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <div className="flex w-[230px] shrink-0 flex-col bg-[#0b1522] px-3.5 py-5 text-[#8b9baa] print:hidden">
      <div className="px-2.5 pb-6">
        <div className="font-serif text-xl font-bold tracking-[0.5px] text-white">BayShore</div>
        <div className="mt-0.5 text-[9px] uppercase tracking-[1.5px] text-[#728496]">Client&apos;s Portal</div>
      </div>

      <ul className="flex flex-col gap-1 list-none">
        {NAV_SECTIONS.map((section) => (
          <Fragment key={section.heading}>
            <li className="px-3 pb-1.5 pt-[18px] text-[10px] font-bold uppercase tracking-wide text-[#485b6d]">
              {section.heading}
            </li>
            {section.items.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <li
                  key={item.label}
                  className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-[13.5px] font-medium ${
                    item.badge ? "justify-between" : ""
                  } ${
                    isActive
                      ? "rounded-r-md border-l-[3px] border-[#d99136] bg-[#142232] font-semibold text-white"
                      : "rounded-md text-[#9cb0c3] hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <Link href={item.href} className="flex flex-1 items-center gap-2.5 text-inherit no-underline">
                    <Icon size={17} strokeWidth={2} />
                    {item.label}
                  </Link>
                  {item.badge ? (
                    <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#dc2626] px-1 text-[10.5px] font-bold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </Fragment>
        ))}
      </ul>

      <div className="mt-auto rounded-lg bg-[#0f1c2c] p-3.5">
        <p className="mb-2.5 text-[11px] leading-[1.4] text-[#7b8e9f]">
          Need help with a report or an approval? We&apos;re here for you.
        </p>
        <a
          href="#"
          className="block w-full rounded-[5px] border border-[#23374e] bg-[#15273c] p-[7px] text-center text-[11.5px] font-semibold text-[#d1dbe5] no-underline"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
