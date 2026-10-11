"use client";

import {
  Bell,
  Briefcase,
  Calendar,
  CreditCard,
  FileText,
  Layers,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect } from "react";

type NavItem = {
  // What the team's choice of pages knows this one by (the backend's CLIENT_PORTAL_MENUS).
  // Without one — Settings — it is always shown.
  key?: string;
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
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { key: "onboarding", label: "Onboarding", icon: LayoutDashboard, href: "/onboarding" },
      { key: "reports", label: "Reports", icon: FileText, href: "/reports" },
      { key: "content", label: "Content", icon: Layers, href: "/content" },
      { key: "leads", label: "Leads", icon: UserPlus, href: "/leads" },
      { key: "projects", label: "Projects", icon: Briefcase, href: "/projects" },
      { key: "services", label: "Services", icon: Package, href: "/services" },
    ],
  },
  {
    heading: "Workspace",
    items: [
      { key: "calendar", label: "Calendar", icon: Calendar, href: "/calendar" },
      { key: "messages", label: "Messages", icon: MessageSquare, href: "/messages", badge: 2 },
      { key: "payments", label: "Payments", icon: CreditCard, href: "/payments" },
    ],
  },
  {
    heading: "Account",
    items: [
      { key: "notifications", label: "Notifications", icon: Bell, href: "/notifications" },
      { label: "Settings", icon: Settings, href: "/settings" },
    ],
  },
];

// `menus` are the pages the client's team has left on for them, by key; null means all of them.
const Sidebar = ({ menus }: { menus: string[] | null }) => {
  const pathname = usePathname();
  const router = useRouter();

  const shown = (item: NavItem) => !item.key || !menus || menus.includes(item.key);
  const sections = NAV_SECTIONS.map((section) => ({ ...section, items: section.items.filter(shown) })).filter((section) => section.items.length > 0);

  // A page that was taken off their menu isn't opened by its address either: they are sent to
  // the first page they do have.
  const hidden = NAV_SECTIONS.flatMap((section) => section.items).some((item) => !shown(item) && pathname.startsWith(item.href));
  const home = sections[0]?.items[0]?.href ?? "/settings";
  useEffect(() => {
    if (hidden) router.replace(home);
  }, [hidden, home, router]);

  return (
    // Stays put on the left while the page scrolls beside it; on a short screen it scrolls on its own.
    <div className="sticky top-0 flex h-screen w-[230px] shrink-0 flex-col self-start overflow-y-auto bg-[#0b1522] px-3.5 py-5 text-[#8b9baa] print:hidden">
      <div className="px-2.5 pb-6">
        {/* The front page — which, for someone signed in, is their dashboard (see proxy.ts). */}
        <Link
          href="/"
          className="block font-serif text-xl font-bold tracking-[0.5px] text-white no-underline"
        >
          BayShore
        </Link>
        <div className="mt-0.5 text-[9px] uppercase tracking-[1.5px] text-[#728496]">
          Client&apos;s Portal
        </div>
      </div>

      <ul className="flex flex-col gap-1 list-none">
        {sections.map((section) => (
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
                  <Link
                    href={item.href}
                    className="flex flex-1 items-center gap-2.5 text-inherit no-underline"
                  >
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
    </div>
  );
};

export default Sidebar;
