import { Bell, CheckCircle2, Inbox, MessageSquareText, PencilLine, RotateCcw, type LucideIcon } from "lucide-react";
import type { NotificationType } from "@/app/actions/notifications";

// What each kind of notification looks like — shared by the bell in the top bar and the
// Notifications page.
type Kind = { label: string; icon: LucideIcon; color: string; background: string };

const KINDS: Record<NotificationType, Kind> = {
  content_sent: { label: "New content", icon: Inbox, color: "#2f5fd8", background: "#d9e0ef" },
  content_resubmitted: { label: "Updated content", icon: RotateCcw, color: "#d97706", background: "#f8e4c6" },
  content_comment: { label: "Reply", icon: MessageSquareText, color: "#7c3aed", background: "#e9e3fb" },
  // The team's side of the conversation — listed so an unexpected one still looks right.
  content_feedback: { label: "Changes requested", icon: MessageSquareText, color: "#dc2626", background: "#f4d7db" },
  content_approved: { label: "Approved", icon: CheckCircle2, color: "#16a34a", background: "#d2e7d8" },
  content_caption_edited: { label: "Caption edited", icon: PencilLine, color: "#2f5fd8", background: "#d9e0ef" },
};
const UNKNOWN: Kind = { label: "Notification", icon: Bell, color: "#4b5260", background: "#eceef1" };

export const kindOf = (type: NotificationType): Kind => KINDS[type] ?? UNKNOWN;

// What a client is told about, in the order shown on the Notifications page.
export const CLIENT_NOTIFICATIONS: { type: NotificationType; description: string }[] = [
  { type: "content_sent", description: "BayShore sent you new content to review and approve." },
  { type: "content_resubmitted", description: "BayShore made the changes you asked for and sent the piece back." },
  { type: "content_comment", description: "BayShore replied to your comments on a piece." },
];

// The backend keeps a notification this long (models/notification.model.ts), then deletes it.
export const NOTIFICATION_RETENTION_DAYS = 90;

// "just now", "5m ago", "3h ago", "2d ago" — after a week, the date.
export const timeAgo = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// The full date and time, for a tooltip on the short form.
export const exactTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

// ── The Notifications page's filter and pages, kept in the URL ───────────────

export const NOTIFICATIONS_PER_PAGE = 20;

export type NotificationFilter = "all" | "unread";

export const isNotificationFilter = (value: unknown): value is NotificationFilter => value === "all" || value === "unread";

export const notificationsHref = ({ filter, page }: { filter?: NotificationFilter; page?: number }) => {
  const params = new URLSearchParams();
  if (filter === "unread") params.set("filter", "unread");
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/notifications?${query}` : "/notifications";
};

// Up to 7 slots, so the page buttons never change width while paging:
//   few pages:   1 2 3 4 5
//   near start:  1 2 3 4 5 … 12
//   in middle:   1 … 5 6 7 … 12
//   near end:    1 … 8 9 10 11 12
export const pageItems = (page: number, total: number): (number | "gap-start" | "gap-end")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "gap-end", total];
  if (page >= total - 3) return [1, "gap-start", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "gap-start", page - 1, page, page + 1, "gap-end", total];
};

// ── Keeping the bell and the page in step ────────────────────────────────────

// Reading a notification in one place should be reflected in the other at once, not at the
// bell's next check. Whoever changes something says so; whoever shows a count listens.
const CHANGED = "notifications:changed";

export const announceNotificationsChanged = () => window.dispatchEvent(new Event(CHANGED));

// Returns the function that stops listening.
export const onNotificationsChanged = (listener: () => void) => {
  window.addEventListener(CHANGED, listener);
  return () => window.removeEventListener(CHANGED, listener);
};
