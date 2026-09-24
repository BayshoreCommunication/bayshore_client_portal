"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Download, ExternalLink, FileText, Film, FilePlus2, ImagePlus, Link2, Play, X, type LucideIcon } from "lucide-react";
import type { ContentFile, ContentItem, ContentMedia, ContentStatus } from "@/app/actions/content";
import { CONTENT_STATUSES, MAX_ATTACHMENTS, extensionOf, fileSize, filesOf, mediaOf, typeOf, uploadProblem } from "./contentUi";

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

// A section: icon + title header, then the body.
export const Card = ({ badge, title, aside, children }: { badge: Badge; title: string; aside?: ReactNode; children: ReactNode }) => (
  <section className={cardClass}>
    <div className="flex items-center justify-between gap-3 px-5 pt-4.5">
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
const FileView = ({ file }: { file: ContentFile }) => {
  if (file.media === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={file.url} alt={file.name} className="block max-h-130 w-full rounded-xl bg-[#f3f4f6] object-contain" />;
  }
  if (file.media === "video") {
    return <video src={file.url} controls className="block max-h-130 w-full rounded-xl bg-black" />;
  }
  if (isPdf(file)) {
    return <iframe src={`${file.url}#view=FitH`} title={file.name} className="block h-130 w-full rounded-xl border border-[#eceef1] bg-white" />;
  }
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#eceef1] bg-[#fafbfc] p-5">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#f8e4c6] text-[#d97706]">
        <FileText size={26} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold text-[#0b0c24]">{file.name}</div>
        <div className="mt-0.5 text-[11.5px] text-[#6b7280]">
          {extensionOf(file.name)}
          {file.size ? ` · ${fileSize(file.size)}` : ""} — download it to read
        </div>
      </div>
      <a
        href={file.url}
        download={file.name}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0b0c24] px-4 text-[12px] font-medium text-white no-underline hover:bg-[#1e2140]"
      >
        <Download size={14} strokeWidth={2} /> Download
      </a>
    </div>
  );
};

// A small thumbnail to switch between a piece's files.
const Thumb = ({ file, active, onClick }: { file: ContentFile; active: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={`Show ${file.name}`}
    aria-current={active}
    className={`relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 bg-[#f3f4f6] ${
      active ? "border-[#0b0c24]" : "border-transparent opacity-75 hover:opacity-100"
    }`}
  >
    {file.media === "image" ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={file.url} alt="" className="h-full w-full object-cover" />
    ) : file.media === "video" ? (
      <>
        <video src={file.url} muted preload="metadata" className="h-full w-full bg-black object-cover" />
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
  </button>
);

// The piece itself: every file (one large, the rest to switch to), and the link if
// the team pasted one.
export const Preview = ({ item }: { item: ContentItem }) => {
  const files = filesOf(item);
  const [shown, setShown] = useState(0);
  const type = typeOf(item);
  const current = files[Math.min(shown, files.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      {current ? <FileView file={current} /> : null}

      {files.length > 1 ? (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {files.map((file, index) => (
            <Thumb key={file.url} file={file} active={file === current} onClick={() => setShown(index)} />
          ))}
          <span className="ml-1 shrink-0 text-[11px] text-[#6b7280]">
            {files.indexOf(current) + 1} of {files.length}
          </span>
        </div>
      ) : null}

      {item.link ? (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-[#eceef1] bg-[#fafbfc] p-4 text-inherit no-underline hover:bg-[#f3f4f6]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: type.background, color: type.color }}>
            <Link2 size={18} strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-[#0b0c24]">Open the {type.label.toLowerCase()}</span>
            <span className="block truncate text-[11.5px] text-[#6b7280]">{item.link}</span>
          </span>
          <ExternalLink size={15} strokeWidth={2} className="shrink-0 text-[#4b5260]" />
        </a>
      ) : null}

      {!current && !item.link ? (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl bg-[linear-gradient(145deg,#dfe6f4,#eef1f6)]" style={{ color: type.color }}>
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
