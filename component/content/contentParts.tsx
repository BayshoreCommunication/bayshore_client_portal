"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Download, ExternalLink, FileText, Film, FilePlus2, ImagePlus, Link2, Play, X, type LucideIcon } from "lucide-react";
import type { ContentFile, ContentItem, ContentMedia, ContentStatus } from "@/app/actions/content";
import { CONTENT_STATUSES, MAX_ATTACHMENTS, extensionOf, fileSize, formatDate, mediaOf, typeOf, uploadProblem, versionsOf } from "./contentUi";

// Building blocks for the client's content details page.

export const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";

export type Badge = { icon: LucideIcon; color: string; background: string };

export const IconBadge = ({ badge, size = "md" }: { badge: Badge; size?: "sm" | "md" }) => {
  const Icon = badge.icon;
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-lg ${size === "sm" ? "h-7 w-7" : "h-8 w-8"}`}
      style={{ background: badge.background, color: badge.color }}
    >
      <Icon size={size === "sm" ? 14 : 16} strokeWidth={2} />
    </span>
  );
};

// A section: icon + title header, then the body. `divided` draws a line under the header.
export const Card = ({
  badge,
  title,
  aside,
  divided = false,
  children,
}: {
  badge: Badge;
  title: string;
  aside?: ReactNode;
  divided?: boolean;
  children: ReactNode;
}) => (
  <section className={cardClass}>
    <div className={`flex items-center justify-between gap-3 px-5 pt-4.5 ${divided ? "border-b border-[#eef0f2] pb-4" : ""}`}>
      <div className="flex items-center gap-3">
        <IconBadge badge={badge} />
        <h2 className="text-[13px] font-semibold text-[#0b0c24] uppercase">{title}</h2>
      </div>
      {aside}
    </div>
    <div className="px-5 pt-4 pb-5">{children}</div>
  </section>
);

export const StatusBadge = ({ status }: { status: ContentStatus }) => {
  const meta = CONTENT_STATUSES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10.5px] font-medium whitespace-nowrap"
      style={{ background: meta.background, color: meta.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
};

export const GRAY: Omit<Badge, "icon"> = { color: "#4b5260", background: "#eceef1" };
export const BLUE: Omit<Badge, "icon"> = { color: "#2f5fd8", background: "#d9e0ef" };

export const DetailRow = ({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) => (
  <div className="flex items-center justify-between gap-3 border-b border-[#eef0f2] py-3 first:pt-0 last:border-b-0 last:pb-0">
    <span className="flex items-center gap-2 text-[11.5px] text-[#6b7280]">
      <Icon size={14} strokeWidth={2} /> {label}
    </span>
    <span className="text-right text-[12px] font-medium text-[#1f2530]">{children}</span>
  </div>
);

const isPdf = (file: ContentFile) => file.mimeType === "application/pdf" || /\.pdf$/i.test(file.name);

// One file, as large as it reads well: the image, a playable video, the PDF — or a
// download card for documents the browser can't show.
// The tinted surface a preview sits on, so the piece itself stands apart from the white card around it.
const stageClass = "rounded-xl border border-[#d6e0f1] bg-[#eaf0fa]";

const FileView = ({ file, poster }: { file: ContentFile; poster?: string }) => {
  if (file.media === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={file.url} alt={file.name} className="block max-h-[60vh] w-full rounded-lg object-contain" />;
  }
  if (file.media === "video") {
    return <video src={file.url} controls poster={poster} className="block max-h-[60vh] w-full rounded-lg bg-black" />;
  }
  if (isPdf(file)) {
    return <iframe src={`${file.url}#view=FitH`} title={file.name} className="block h-[60vh] min-h-105 w-full rounded-lg border border-[#d6e0f1] bg-white" />;
  }
  // A document the browser can't show in place (Word, text…): a panel the size of a preview,
  // with the file front and centre.
  return (
    <div className="flex min-h-70 flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#d97706] shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
        <FileText size={30} strokeWidth={1.6} />
      </span>
      <div className="max-w-full">
        <div className="text-[16px] font-semibold wrap-anywhere text-[#0b0c24]">{file.name}</div>
        <div className="mt-1 text-[12px] text-[#6b7280]">
          {extensionOf(file.name)}
          {file.size ? ` · ${fileSize(file.size)}` : ""} — download it to read
        </div>
      </div>
      <a
        href={file.url}
        download={file.name}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0b0c24] px-5 text-[12.5px] font-medium text-white no-underline hover:bg-[#1e2140]"
      >
        <Download size={15} strokeWidth={2} /> Download
      </a>
    </div>
  );
};

// A pasted link that can be shown in place: a YouTube or Vimeo video, or a Google Drive /
// Docs file shared for viewing. Anything else returns null — most sites refuse to be framed.
const embedOf = (link: string): { src: string; tall: boolean } | null => {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be" && parts[0]) return { src: `https://www.youtube.com/embed/${parts[0]}`, tall: false };
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = url.searchParams.get("v") ?? (["shorts", "embed", "live"].includes(parts[0]) ? parts[1] : null);
    return id ? { src: `https://www.youtube.com/embed/${id}`, tall: false } : null;
  }
  if (host === "vimeo.com" && /^\d+$/.test(parts[0] ?? "")) return { src: `https://player.vimeo.com/video/${parts[0]}`, tall: false };
  if (host === "drive.google.com" && parts[0] === "file" && parts[1] === "d" && parts[2]) {
    return { src: `https://drive.google.com/file/d/${parts[2]}/preview`, tall: true };
  }
  if (host === "docs.google.com" && ["document", "presentation", "spreadsheets"].includes(parts[0]) && parts[1] === "d" && parts[2]) {
    return { src: `https://docs.google.com/${parts[0]}/d/${parts[2]}/preview`, tall: true };
  }
  return null;
};

// The link the team pasted. Shown in place when it can be; otherwise a panel to open it —
// the size of a preview when the link is all there is (`large`), a row under the files when not.
const LinkView = ({ link, type, large }: { link: string; type: { label: string; color: string; background: string }; large: boolean }) => {
  const embed = embedOf(link);
  const open = (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-[#eceef1] bg-[#fafbfc] p-4 text-inherit no-underline hover:bg-[#f3f4f6]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: type.background, color: type.color }}>
        <Link2 size={18} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-[#0b0c24]">Open the {type.label.toLowerCase()}</span>
        <span className="block truncate text-[11.5px] text-[#6b7280]">{link}</span>
      </span>
      <ExternalLink size={15} strokeWidth={2} className="shrink-0 text-[#4b5260]" />
    </a>
  );

  if (embed) {
    return (
      <>
        <iframe
          src={embed.src}
          title={`${type.label} preview`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className={`block w-full rounded-xl border border-[#d6e0f1] ${embed.tall ? "h-[60vh] min-h-105 bg-white" : "aspect-video bg-black"}`}
        />
        {open}
      </>
    );
  }
  if (!large) return open;

  let host = link;
  try {
    host = new URL(link).hostname.replace(/^www\./, "");
  } catch {
    // Not a full URL — show it as it was pasted.
  }
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={`${stageClass} group flex min-h-70 flex-col items-center justify-center gap-4 p-6 text-center text-inherit no-underline hover:border-[#b9c9e8]`}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-[0_1px_3px_rgba(15,23,42,0.08)]" style={{ color: type.color }}>
        <Link2 size={28} strokeWidth={1.75} />
      </span>
      <span className="max-w-full">
        <span className="block text-[16px] font-semibold text-[#0b0c24]">{host}</span>
        <span className="mt-1 block text-[12px] wrap-anywhere text-[#6b7280]">{link}</span>
      </span>
      <span className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0b0c24] px-5 text-[12.5px] font-medium text-white group-hover:bg-[#1e2140]">
        Open the {type.label.toLowerCase()} <ExternalLink size={15} strokeWidth={2} />
      </span>
    </a>
  );
};

// A small thumbnail to switch between a piece's files. One the piece no longer uses —
// replaced during a revision — is washed in yellow and says so.
const Thumb = ({
  file,
  active,
  previous,
  poster,
  onClick,
}: {
  file: ContentFile;
  active: boolean;
  previous?: boolean;
  // The video's cover image, when the piece has one.
  poster?: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={`Show ${previous ? "the previous " : ""}${file.name}`}
    aria-current={active}
    className={`relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 bg-[#f3f4f6] ${
      active ? (previous ? "border-[#ca8a04]" : "border-[#0b0c24]") : `${previous ? "border-[#eab308]" : "border-transparent"} opacity-75 hover:opacity-100`
    }`}
  >
    {file.media === "image" ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={file.url} alt="" className="h-full w-full object-cover" />
    ) : file.media === "video" ? (
      <>
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="h-full w-full object-cover" />
        ) : (
          <video src={file.url} muted preload="metadata" className="h-full w-full bg-black object-cover" />
        )}
        <span className="absolute inset-0 flex items-center justify-center text-white">
          <Play size={16} strokeWidth={2} fill="currentColor" />
        </span>
      </>
    ) : (
      <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-white text-[#d97706]">
        <FileText size={18} strokeWidth={1.75} />
        <span className="text-[8.5px] font-bold">{extensionOf(file.name)}</span>
      </span>
    )}
    {previous ? (
      <>
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#facc15]/30" />
        <span className="absolute inset-x-0 bottom-0 bg-[#facc15] py-px text-center text-[8px] font-bold tracking-[0.3px] text-[#422006]">PREVIOUS</span>
      </>
    ) : null}
  </button>
);

const stripDivider = <span aria-hidden="true" className="mx-1 h-10 w-px shrink-0 bg-[#e2e5e9]" />;

// The piece itself, large: every file (one shown big, the rest to switch to), and the link
// if the team pasted one — played or shown in place when it can be. The newest files come
// first, and it opens on them; whatever the piece had before follows, in yellow, to compare
// with — files still in it from an earlier version, then the ones BayShore replaced during a
// revision.
export const Preview = ({ item }: { item: ContentItem }) => {
  const { latest, earlier } = versionsOf(item);
  const previous = item.previousFiles ?? [];
  const all = [...latest, ...earlier, ...previous];
  const [shown, setShown] = useState(0);
  const type = typeOf(item);
  const poster = item.videoThumbnail?.url;
  const index = Math.min(shown, all.length - 1);
  const current = all[index];
  const before = latest.length + earlier.length;
  // From an earlier version, but still in the piece.
  const kept = index >= latest.length && index < before ? earlier[index - latest.length] : undefined;
  // Replaced during a revision.
  const old = index >= before ? previous[index - before] : undefined;

  return (
    <div className="flex flex-col gap-3">
      {current ? (
        <div className={kept || old ? "rounded-xl border-2 border-[#eab308] bg-[#fef9c3] p-2.5" : `${stageClass} p-2.5`}>
          {/* Which version is on show — said only when there is more than one to tell apart. */}
          {earlier.length + previous.length > 0 ? (
            <div className="mb-2 flex flex-wrap items-center gap-2 px-0.5 text-[11px]">
              {kept || old ? (
                <>
                  <span className="rounded bg-[#facc15] px-1.5 py-0.5 text-[10px] font-bold text-[#422006]">PREVIOUS VERSION</span>
                  <span className="text-[#713f12]">
                    {old ? (
                      <>
                        Replaced {formatDate(old.replacedAt)}
                        {old.revision ? ` · revision ${old.revision}` : ""}
                      </>
                    ) : (
                      <>
                        Still part of this piece
                        {kept?.uploadedAt ? ` · added ${formatDate(kept.uploadedAt)}` : ""}
                      </>
                    )}
                  </span>
                </>
              ) : (
                <span className="rounded bg-[#16a34a] px-1.5 py-0.5 text-[10px] font-bold text-white">LATEST VERSION</span>
              )}
            </div>
          ) : null}
          {/* Keyed by file, so switching shows the new one at once instead of the last one under a new label. */}
          <FileView key={current.url} file={current} poster={poster} />
        </div>
      ) : null}

      {all.length > 1 ? (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {latest.map((file, at) => (
            <Thumb key={file.url} file={file} poster={poster} active={at === index} onClick={() => setShown(at)} />
          ))}
          {earlier.length > 0 ? stripDivider : null}
          {earlier.map((file, at) => (
            <Thumb key={file.url} file={file} previous poster={poster} active={latest.length + at === index} onClick={() => setShown(latest.length + at)} />
          ))}
          {previous.length > 0 && before > 0 ? stripDivider : null}
          {previous.map((file, at) => (
            <Thumb key={`previous-${file.url}`} file={file} previous active={before + at === index} onClick={() => setShown(before + at)} />
          ))}
          <span className="ml-1 shrink-0 text-[11px] text-[#6b7280]">
            {index + 1} of {all.length}
          </span>
        </div>
      ) : null}

      {/* The video's cover, on its own too: once the video plays, the player no longer shows it. */}
      {item.videoThumbnail ? (
        <a
          href={item.videoThumbnail.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-[#eceef1] bg-[#fafbfc] p-3 text-inherit no-underline hover:bg-[#f3f4f6]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.videoThumbnail.url} alt="" className="h-14 w-24 shrink-0 rounded-lg bg-[#f3f4f6] object-cover" />
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-[#0b0c24]">Video thumbnail</span>
            <span className="block truncate text-[11.5px] text-[#6b7280]">{item.videoThumbnail.name || "Cover image"}</span>
          </span>
          <ExternalLink size={15} strokeWidth={2} className="shrink-0 text-[#4b5260]" />
        </a>
      ) : null}

      {item.link ? <LinkView link={item.link} type={type} large={!current} /> : null}

      {!current && !item.link ? (
        <div className={`${stageClass} flex min-h-70 w-full flex-col items-center justify-center gap-3`} style={{ color: type.color }}>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70">
            <type.icon size={26} strokeWidth={1.75} />
          </span>
          <span className="text-[12px] font-medium text-[#4b5260]">No files attached</span>
        </div>
      ) : null}
    </div>
  );
};

// ── Files attached to a comment ─────────────────────────────────────────────

const MEDIA_ICON: Record<ContentMedia, LucideIcon> = { image: ImagePlus, video: Film, doc: FileText };

// A sent attachment inside a comment bubble.
export const AttachmentView = ({ file }: { file: ContentFile }) => {
  if (file.media === "image") {
    return (
      <a href={file.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-[#e6e8eb]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={file.url} alt={file.name} className="block h-32 w-auto max-w-full object-cover" />
      </a>
    );
  }

  if (file.media === "video") {
    return <video src={file.url} controls preload="metadata" className="block max-h-56 w-full max-w-90 rounded-lg bg-black" />;
  }

  return (
    <a
      href={file.url}
      download={file.name}
      target="_blank"
      rel="noopener noreferrer"
      className="flex max-w-80 items-center gap-2.5 rounded-lg border border-[#e6e8eb] bg-white px-3 py-2 text-inherit no-underline hover:bg-[#f9fafb]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#f8e4c6] text-[#d97706]">
        <FileText size={15} strokeWidth={2} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-medium text-[#1f2530]">{file.name}</span>
        <span className="block text-[10.5px] text-[#6b7280]">
          {extensionOf(file.name)}
          {file.size ? ` · ${fileSize(file.size)}` : ""}
        </span>
      </span>
      <Download size={14} strokeWidth={2} className="ml-1 shrink-0 text-[#6b7280]" />
    </a>
  );
};

// A file picked to go with a comment, not uploaded yet.
export type Attachment = { id: string; file: File; media: ContentMedia; url: string };

// A picked file waiting in the comment box, with a remove button.
export const PendingChip = ({ file, onRemove, disabled }: { file: Attachment; onRemove: () => void; disabled?: boolean }) => {
  const Icon = MEDIA_ICON[file.media];
  return (
    <div className="relative flex items-center gap-2 rounded-lg border border-[#e6e8eb] bg-[#fafbfc] py-1.5 pr-8 pl-1.5">
      {file.media === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={file.url} alt="" className="h-9 w-9 rounded-md object-cover" />
      ) : (
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-md ${
            file.media === "video" ? "bg-[#f4d7db] text-[#dc2626]" : "bg-[#f8e4c6] text-[#d97706]"
          }`}
        >
          <Icon size={16} strokeWidth={2} />
        </span>
      )}
      <span className="min-w-0">
        <span className="block max-w-40 truncate text-[11.5px] font-medium text-[#1f2530]">{file.file.name}</span>
        <span className="block text-[10px] text-[#6b7280]">{fileSize(file.file.size)}</span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${file.file.name}`}
        className="absolute top-1/2 right-1.5 flex h-5.5 w-5.5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[#6b7280] hover:bg-[#eceef1] hover:text-[#1f2530]"
      >
        <X size={13} strokeWidth={2.25} />
      </button>
    </div>
  );
};

// Files picked for a comment — checked against the backend's rules, up to
// MAX_ATTACHMENTS. Previews are freed when files are removed or the page closes.
export const useAttachments = () => {
  const [files, setFiles] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(files);

  useEffect(() => {
    latest.current = files;
  }, [files]);
  useEffect(() => () => latest.current.forEach((entry) => URL.revokeObjectURL(entry.url)), []);

  const add = (picked: File[]) => {
    const problems = picked.map(uploadProblem).filter(Boolean);
    const allowed = picked.filter((file) => !uploadProblem(file));
    const room = MAX_ATTACHMENTS - files.length;
    const kept = allowed.slice(0, Math.max(0, room));
    setError(
      problems.length
        ? `${problems.join("; ")} — skipped.`
        : allowed.length > room
          ? `Up to ${MAX_ATTACHMENTS} files per comment — only the first ${Math.max(0, room)} were added.`
          : null,
    );
    const added = kept.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      media: mediaOf(file),
      url: URL.createObjectURL(file),
    }));
    if (added.length) setFiles((current) => [...current, ...added]);
  };

  const remove = (id: string) =>
    setFiles((current) => {
      const gone = current.find((entry) => entry.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return current.filter((entry) => entry.id !== id);
    });

  const clear = () => {
    files.forEach((entry) => URL.revokeObjectURL(entry.url));
    setFiles([]);
    setError(null);
  };

  return { files, error, add, remove, clear, full: files.length >= MAX_ATTACHMENTS };
};

const PICKERS: { label: string; icon: LucideIcon; accept: string }[] = [
  { label: "Image", icon: ImagePlus, accept: "image/*" },
  { label: "Video", icon: Film, accept: "video/*" },
  { label: "Doc", icon: FilePlus2, accept: ".pdf,.doc,.docx,.txt,.rtf,.odt" },
];

// The Image / Video / Doc buttons that open a file picker.
export const AttachmentPickers = ({ onPick, disabled }: { onPick: (files: File[]) => void; disabled?: boolean }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    {PICKERS.map((picker) => (
      <label
        key={picker.label}
        title={`Attach ${picker.label.toLowerCase()}`}
        className={`inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#e6e8eb] bg-white px-2.5 text-[11.5px] font-medium ${
          disabled ? "cursor-not-allowed text-[#c4cad2]" : "cursor-pointer text-[#4b5260] hover:bg-[#f3f4f6] hover:text-[#1f2530]"
        }`}
      >
        <picker.icon size={14} strokeWidth={2} /> {picker.label}
        <input
          type="file"
          multiple
          accept={picker.accept}
          disabled={disabled}
          className="hidden"
          onChange={(event) => {
            onPick(Array.from(event.target.files ?? []));
            // Let the same file be picked again after removing it.
            event.target.value = "";
          }}
        />
      </label>
    ))}
  </div>
);
