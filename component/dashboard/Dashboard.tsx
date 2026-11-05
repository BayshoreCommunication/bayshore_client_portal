import type { ReactElement, ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Clapperboard,
  Clock,
  Globe,
  Heart,
  Image as ImageIcon,
  MapPin,
  MousePointerClick,
  Users,
  type LucideIcon,
} from "lucide-react";
import { poppins } from "@/component/shared/fonts";
import type { ChannelKey, DashboardCard, DashboardChannel, DashboardModel, PendingKind } from "./dashboardData";
import MeetingRows from "./MeetingRows";

type PendingStatus = "waiting" | "revision" | "approved";

// Each pending piece's icon tile, and the pill for where it stands.
const PENDING_ICONS: Record<PendingKind, { icon: LucideIcon; background: string; color: string }> = {
  blog: { icon: ImageIcon, background: "#d6ebdc", color: "#16a34a" },
  reel: { icon: Clapperboard, background: "#f6dcdf", color: "#dc2626" },
  post: { icon: ImageIcon, background: "#d6ebdc", color: "#16a34a" },
};

const PENDING_PILLS: Record<PendingStatus, { label: string; background: string; color: string; dot: string }> = {
  waiting: { label: "Waiting for Approval", background: "#fbecd3", color: "#a35a12", dot: "#d99136" },
  revision: { label: "Revision Requested", background: "#fbe0e0", color: "#b91c1c", dot: "#dc2626" },
  approved: { label: "Approved", background: "#d6eadb", color: "#15803d", dot: "#16a34a" },
};

// A right-column card: icon tile, title and subtitle, an optional count, the list, and a footer link.
const SideCard = ({
  icon: Icon,
  iconColor,
  iconBackground,
  title,
  sub,
  count,
  footer,
  children,
}: {
  icon: LucideIcon;
  iconColor: string;
  iconBackground: string;
  title: string;
  sub: string;
  count?: number;
  footer: { href: string; label: string };
  children: ReactNode;
}) => (
  <div className="overflow-hidden rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
    <div className="flex items-center gap-3 border-b border-[#eef0f2] px-4.5 pt-4.5 pb-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: iconBackground, color: iconColor }}>
        <Icon size={19} strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-bold text-[#0b0c24] uppercase">{title}</div>
        <div className="truncate text-[11.5px] text-[#6b7280]">{sub}</div>
      </div>
      {count !== undefined ? (
        <span className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-[#fbdada] text-[11.5px] font-bold text-[#dc2626]">
          {count}
        </span>
      ) : null}
    </div>
    <div className="flex flex-col gap-1 px-2.5 pt-2 pb-2">{children}</div>
    <Link
      href={footer.href}
      className="flex items-center justify-center gap-1.5 border-t border-[#eef0f2] py-3.5 text-[12px] font-bold tracking-[0.4px] text-[#0b0c24] uppercase no-underline hover:bg-[#f9fafb]"
    >
      {footer.label} <ArrowRight size={14} strokeWidth={2.25} />
    </Link>
  </div>
);

// The four headline cards: how each looks. Their figures come from the dashboard's data.
type TrendDirection = "up" | "down" | "flat";
const CARD_LOOK: Record<DashboardCard["key"], { icon: LucideIcon; color: string; background: string }> = {
  leads: { icon: Users, color: "#2f5fd8", background: "#dce4f3" },
  gmb: { icon: BarChart3, color: "#16a34a", background: "#d6ebdc" },
  clicks: { icon: MousePointerClick, color: "#4f46e5", background: "#e0e0f3" },
  social: { icon: Heart, color: "#dc2626", background: "#f6dcdf" },
};


// ── Performance by Channel — sample figures for now (the design) ─────────────

type IconType = (props: { size?: number }) => ReactElement;

// Brand marks this icon set doesn't have, drawn to sit beside the lucide icons.
const FacebookIcon: IconType = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.4V10H7v4h2.5v8h4v-8h3l.9-4h-3.9V8.7c0-.4.3-.7.7-.7z" />
  </svg>
);
const InstagramIcon: IconType = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const XIcon: IconType = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.3-8.3L2 3h6.3l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z" />
  </svg>
);
const LinkedinIcon: IconType = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M5 3.5a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4zM3.1 9.3h3.8V21H3.1zM9.3 9.3h3.6v1.6h.1c.5-.9 1.7-1.9 3.6-1.9 3.8 0 4.5 2.5 4.5 5.8V21h-3.8v-5.5c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21H9.3z" />
  </svg>
);
const GlobeIcon: IconType = ({ size = 20 }) => <Globe size={size} strokeWidth={1.75} />;
const MapPinIcon: IconType = ({ size = 20 }) => <MapPin size={size} strokeWidth={1.75} />;

// Each channel's card: its name, icon and colors. The figures come from the published reports.
type ChannelLook = { name: string; sub: string; icon: IconType; color: string; tint: string; tile: string };
const CHANNEL_LOOK: Record<ChannelKey, ChannelLook> = {
  website: { name: "Website & SEO", sub: "Organic search performance", icon: GlobeIcon, color: "#eba445", tint: "#ecd3ae", tile: "#f5e3c9" },
  gmb: { name: "Google Business Profile", sub: "Local search & maps", icon: MapPinIcon, color: "#16a34a", tint: "#bfe3cb", tile: "#d8efe0" },
  facebook: { name: "Facebook", sub: "Page reach", icon: FacebookIcon, color: "#1877f2", tint: "#c3d9f7", tile: "#dbe8fb" },
  instagram: { name: "Instagram", sub: "Posts, reels & stories", icon: InstagramIcon, color: "#e1306c", tint: "#f5c3d5", tile: "#fbdde8" },
  twitter: { name: "Twitter / X", sub: "Posts & conversations", icon: XIcon, color: "#1f2937", tint: "#cfd4db", tile: "#e3e6ea" },
  linkedin: { name: "LinkedIn", sub: "Company page activity", icon: LinkedinIcon, color: "#0a66c2", tint: "#bcd5ee", tile: "#d8e6f5" },
};

// 71240 → "71,240"; axis ticks → "80K".
const formatNumber = (value: number) => value.toLocaleString("en-US");
const formatTick = (value: number) => (value >= 1000 ? `${Math.round((value / 1000) * 10) / 10}K` : String(value));

// A round top for the chart: 4 equal steps of 1, 2, 2.5 or 5 × a power of ten.
const niceMax = (value: number) => {
  const rough = value / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * power).find((candidate) => candidate >= rough) ?? rough;
  return step * 4;
};

const ChannelCard = ({ channel: data }: { channel: DashboardChannel }) => {
  const channel = { ...CHANNEL_LOOK[data.key], ...data };
  const empty = data.headline === null || !data.bars.some((bar) => bar.value > 0);
  const top = niceMax(Math.max(1, ...data.bars.map((bar) => bar.value)));
  const ticks = [4, 3, 2, 1, 0].map((step) => (top / 4) * step);
  const months = data.bars.map((bar) => bar.label);

  return (
    <div className="rounded-2xl border border-[#e6e8eb] bg-white px-5 pt-5 pb-5 shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: channel.tile, color: channel.color }}>
            <channel.icon size={21} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-bold text-[#0b0c24] uppercase">{channel.name}</div>
            <div className="truncate text-[12px] text-[#6b7280]">{channel.sub}</div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[24px] leading-none font-bold text-[#0b0c24]">{channel.headline === null ? "—" : formatNumber(channel.headline)}</div>
          <div className="mt-1 text-[11.5px] text-[#6b7280]">{channel.headlineLabel}</div>
        </div>
      </div>

      {/* Six months of the headline figure: earlier months light, this month solid. */}
      <div className="mt-6 flex gap-2">
        <div className="flex h-34 flex-col justify-between pb-0 text-right text-[10px] text-[#4b5260]">
          {ticks.map((tick) => (
            <span key={tick} className="-my-1.5 leading-3">
              {formatTick(tick)}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative h-34">
            {ticks.map((tick, index) => (
              <span key={tick} className="absolute inset-x-0 border-t border-[#f0f1f3]" style={{ top: `${(index / 4) * 100}%` }} />
            ))}
            {empty ? (
              <div className="absolute inset-0 grid place-items-center text-center text-[11.5px] text-[#9ca3af]">
                No figures yet — they show here once a report includes them.
              </div>
            ) : (
              <div className="absolute inset-0 flex items-end gap-2.5">
                {data.bars.map((bar, index) => {
                  const current = index === data.bars.length - 1;
                  return (
                    <div
                      key={`${bar.label}-${index}`}
                      title={`${bar.label}: ${formatNumber(bar.value)}`}
                      className="flex-1 rounded-t-[3px]"
                      style={{ height: `${(bar.value / top) * 100}%`, background: current ? channel.color : channel.tint }}
                    />
                  );
                })}
              </div>
            )}
          </div>
          <div className="mt-2 flex gap-2.5">
            {months.map((month, index) => {
              const current = index === months.length - 1;
              return (
                <span key={`${month}-${index}`} className={`flex flex-1 items-center justify-center gap-1.5 text-[10.5px] ${current ? "text-[#0b0c24]" : "text-[#6b7280]"}`}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: current ? channel.color : channel.tint }} />
                  {month}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {channel.metrics.map((metric) => (
          <div key={metric.label} className="min-w-0">
            <div className="truncate text-[11.5px] text-[#4b5260]">{metric.label}</div>
            <div className="mt-1 flex items-center gap-2.5">
              <span className="text-[20px] leading-none font-bold text-[#0b0c24]">{metric.value}</span>
              {metric.change && metric.change.direction !== "flat" ? (
                <span
                  className={`inline-flex items-center gap-1.5 text-[12.5px] font-medium ${
                    metric.change.direction === "up" ? "text-[#16a34a]" : "text-[#e11d2e]"
                  }`}
                >
                  <svg width="12" height="7" viewBox="0 0 12 7" fill="currentColor" aria-hidden className={metric.change.direction === "up" ? "" : "rotate-180"}>
                    <path d="M6 0 12 7H0z" />
                  </svg>
                  {metric.change.percent.toFixed(1)}%
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// The ▲/▼ at a card's bottom right. Always shown: a grey "0.0%" when nothing changed,
// and a grey "—" when there's no earlier report to compare with.
const MetricTrend = ({ change, note }: { change: { percent: number; direction: TrendDirection } | null; note: string | null }) => {
  const direction = change?.direction;
  const color = direction === "up" ? "text-[#16a34a]" : direction === "down" ? "text-[#e11d2e]" : "text-[#8a94a6]";

  return (
    <div className={`flex shrink-0 items-center gap-1.5 pb-1 text-[12px] font-medium whitespace-nowrap ${color}`}>
      {direction === "up" || direction === "down" ? (
        <svg width="12" height="7" viewBox="0 0 12 7" fill="currentColor" aria-hidden className={direction === "up" ? "" : "rotate-180"}>
          <path d="M6 0 12 7H0z" />
        </svg>
      ) : null}
      {change ? `${change.percent.toFixed(1)}%` : "—"}
      <span className="ml-3 font-normal text-[#56637a]">
        vs<span className="ml-3">{note ?? "last period"}</span>
      </span>
    </div>
  );
};

const Dashboard = ({ name, model, error }: { name: string; model: DashboardModel | null; error?: string }) => {
  // What waits on them: pieces sent for their approval, and those they asked to be changed.
  const awaitingApproval = model?.content.items ?? [];
  const needDecision = model?.content.needDecision ?? 0;
  const meetings = model?.meetings.items ?? [];
  return (
    <>
      <div className={`${poppins.className} mt-1.5 flex items-start justify-between`}>
        <div>
          <div className="text-[30px] leading-tight font-bold tracking-[-0.2px] text-[#0b0c24]">Welcome back, {name}</div>
          <div className="mt-1.5 text-[13px] text-[#4b5563]">
            {model?.period
              ? `Here's how your marketing performed in ${model.period}${model.comparedWith ? `, compared to ${model.comparedWith}` : ""}.`
              : "Your figures show here once your first report is published."}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-[#f5c2c2] bg-[#fdecec] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#b42318]" role="alert">
          {error}
        </div>
      ) : null}

      <div className={`${poppins.className} grid grid-cols-4 gap-4`}>
        {(model?.cards ?? []).map((data) => {
          const card = { ...CARD_LOOK[data.key], ...data };
          return (
          <div className="rounded-xl border border-[#e6e8eb] bg-white px-4 pt-3.5 pb-4.5 shadow-[0_2px_6px_rgba(15,23,42,0.05)]" key={card.key}>
            <div className="mb-5 flex items-center gap-3">
              <span
                className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg border"
                style={{ background: card.background, color: card.color, borderColor: `${card.color}33` }}
              >
                <card.icon size={16} strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold tracking-[0.2px] text-[#4a4a4a]">{card.title}</span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#d6dce7] text-[#34466b]">
                <ArrowUpRight size={15} strokeWidth={2} />
              </span>
            </div>
            <div className="flex items-end justify-between gap-2">
              <span className="text-[34px] leading-none font-semibold tracking-[-0.3px] text-[#0a0a0f]">{card.value}</span>
              <MetricTrend change={card.change} note={card.note} />
            </div>
          </div>
          );
        })}
      </div>

      <div className="mt-1 flex items-center justify-between">
        <div className="text-base font-bold text-[#0d1e2c]">Performance by Channel</div>
        {model?.latestId ? (
          <Link
            href={`/reports/${model.latestId}`}
            className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#2563eb] hover:underline"
          >
            View full report <ArrowRight size={13} strokeWidth={2.5} />
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-[minmax(0,2.7fr)_minmax(300px,1fr)] items-start gap-5">
        <div className="grid grid-cols-2 gap-4">
          {(model?.channels ?? []).map((channel) => (
            <ChannelCard key={channel.key} channel={channel} />
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <SideCard
            icon={Clock}
            iconColor="#d97706"
            iconBackground="#f8e4c6"
            title="Content for approval"
            sub={needDecision ? `${needDecision} ${needDecision === 1 ? "item needs" : "items need"} a decision` : "Nothing waiting on you"}
            count={needDecision}
            footer={{ href: "/content", label: `Review All (${needDecision})` }}
          >
            {awaitingApproval.length ? null : <p className="px-2 py-3 text-[12px] text-[#9ca3af]">You&apos;re all caught up — new content shows here when it&apos;s sent for your approval.</p>}
            {awaitingApproval.map((item) => {
              const tile = PENDING_ICONS[item.kind];
              const pill = PENDING_PILLS[item.status];
              return (
                <Link
                  href={`/content/${item.id}`}
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-inherit no-underline hover:bg-[#f7f8fa]"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: tile.background, color: tile.color }}
                  >
                    <tile.icon size={18} strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-bold text-[#0b0c24]">{item.title}</span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] text-[#6b7280]">{item.sub}</span>
                      <span
                        className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-px text-[9.5px] font-semibold"
                        style={{ background: pill.background, color: pill.color }}
                      >
                        <span className="h-1 w-1 rounded-full" style={{ background: pill.dot }} />
                        {pill.label}
                      </span>
                    </span>
                  </span>
                </Link>
              );
            })}
          </SideCard>

          <SideCard
            icon={CalendarDays}
            iconColor="#2f5fd8"
            iconBackground="#dce4f3"
            title="Upcoming Meetings"
            sub="With your account manager"
            footer={{ href: "/calendar", label: meetings.length ? `View All (${meetings.length})` : "Open calendar" }}
          >
            {meetings.length ? <MeetingRows meetings={meetings} /> : <p className="px-2 py-3 text-[12px] text-[#9ca3af]">No meetings booked in the next two months.</p>}
          </SideCard>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
