import {
  FileText,
  GalleryHorizontalEnd,
  Globe,
  Image as ImageIcon,
  Mail,
  MapPin,
  Megaphone,
  Play,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import type { ContentFile, ContentItem, ContentMedia, ContentStatus, ContentType } from "@/app/actions/content";

// Badge and pill colors for each kind of content — the same kinds the team can prepare.
export const CONTENT_TYPES: Record<ContentType, { label: string; icon: LucideIcon; color: string; background: string }> = {
  image: { label: "Image Post", icon: ImageIcon, color: "#2f5fd8", background: "#d9e0ef" },
  carousel: { label: "Carousel", icon: GalleryHorizontalEnd, color: "#0891b2", background: "#cff1f7" },
  story: { label: "Story", icon: Smartphone, color: "#db2777", background: "#fbe0ee" },
  video: { label: "Video / Reel", icon: Play, color: "#dc2626", background: "#f4d7db" },
  blog: { label: "Blog Article", icon: FileText, color: "#d97706", background: "#f8e4c6" },
  website: { label: "Website Content", icon: Globe, color: "#16a34a", background: "#d2e7d8" },
  email: { label: "Email Newsletter", icon: Mail, color: "#7c3aed", background: "#e9e3fb" },
  gmb: { label: "Google Business Post", icon: MapPin, color: "#ea580c", background: "#fde4cf" },
  ad: { label: "Ad Creative", icon: Megaphone, color: "#334155", background: "#e2e8f0" },
};

export const CONTENT_TYPE_KEYS = Object.keys(CONTENT_TYPES) as ContentType[];

export const typeOf = (item: Pick<ContentItem, "type">) => CONTENT_TYPES[item.type] ?? CONTENT_TYPES.image;

// Which batch a piece belongs to: "September 2026", "Week of Sep 21", the event's
// name, or "Individual". Older records only carry isIndividual.
export const batchLabelOf = (item: Pick<ContentItem, "batchType" | "isIndividual" | "batchMonth" | "weekStart" | "eventName">) => {
  const batchType = item.batchType ?? (item.isIndividual ? "individual" : "monthly");
  if (batchType === "weekly" && item.weekStart) {
    return `Week of ${new Date(item.weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`;
  }
  if (batchType === "event") return item.eventName || "Event";
  if (batchType === "individual") return "Individual";
  return item.batchMonth;
};

// A piece's files. Older records kept a single file in imageUrl / videoUrl / docUrl.
export const filesOf = (item: ContentItem): ContentFile[] => {
  if (item.files?.length) return item.files;
  const legacy: ContentFile[] = [];
  if (item.imageUrl) legacy.push({ url: item.imageUrl, name: item.imageAlt || item.title, size: 0, mimeType: "", media: "image" });
  if (item.videoUrl && item.videoUrl !== item.link) legacy.push({ url: item.videoUrl, name: item.title, size: 0, mimeType: "", media: "video" });
  if (item.docUrl && item.docUrl !== item.link) legacy.push({ url: item.docUrl, name: item.docName || item.title, size: 0, mimeType: "", media: "doc" });
  return legacy;
};

// ── Files attached to feedback — the backend's rules (models/content.model.ts) ──

export const MAX_ATTACHMENTS = 5;

const MEDIA_MAX_BYTES: Record<ContentMedia, number> = {
  image: 10 * 1024 * 1024,
  video: 200 * 1024 * 1024,
  doc: 20 * 1024 * 1024,
};

const UPLOADABLE_MIME_TYPES: Record<ContentMedia, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/quicktime", "video/webm"],
  doc: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.oasis.opendocument.text",
    "application/rtf",
    "text/rtf",
    "text/plain",
  ],
};

export const mediaOf = (file: { type: string }): ContentMedia =>
  file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "doc";

// Why a file can't be attached, or null when it's fine.
export const uploadProblem = (file: File): string | null => {
  const media = mediaOf(file);
  if (!UPLOADABLE_MIME_TYPES[media].includes(file.type)) return `"${file.name}" isn't a supported file type`;
  if (file.size > MEDIA_MAX_BYTES[media]) return `"${file.name}" is over the ${MEDIA_MAX_BYTES[media] / (1024 * 1024)}MB limit for ${media}s`;
  return null;
};

export const fileSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const extensionOf = (name: string) => name.split(".").pop()?.toUpperCase() ?? "FILE";

export const CONTENT_STATUSES: Record<ContentStatus, { label: string; color: string; background: string; dot: string }> = {
  pending_approval: { label: "Waiting for Approval", color: "#a35a12", background: "#fbecd3", dot: "#d99136" },
  revision_requested: { label: "In Revision", color: "#b91c1c", background: "#f8dcdc", dot: "#dc2626" },
  approved: { label: "Approved", color: "#15803d", background: "#d6eadb", dot: "#16a34a" },
};

export const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export const shortDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";

export const personNameOf = (person: unknown) =>
  person && typeof person === "object" && "fullName" in person
    ? String((person as { fullName: string }).fullName)
    : undefined;
