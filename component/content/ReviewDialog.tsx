"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, CheckCircle2, Loader2, RotateCcw, SendHorizontal, X, type LucideIcon } from "lucide-react";

// The backend's limit for a comment (models/content.model.ts).
const NOTE_MAX = 1000;

// How each decision looks: its icon tile, and its confirm button.
type Tone = "approve" | "revision";
const TONES: Record<Tone, { icon: LucideIcon; tile: string; button: string; confirmIcon: LucideIcon }> = {
  approve: { icon: CheckCircle2, tile: "bg-[#d6eadb] text-[#16a34a]", button: "bg-[#16a34a] hover:bg-[#15803d]", confirmIcon: Check },
  revision: { icon: RotateCcw, tile: "bg-[#f8dcdc] text-[#b91c1c]", button: "bg-[#0b0c24] hover:bg-[#1e2140]", confirmIcon: SendHorizontal },
};

// Where the client confirms a decision on a piece — approving it, or asking for a revision —
// with a note for the team: optional when approving, needed when asking for changes.
// Nothing happens until the confirm button is pressed; Cancel, Escape or a click outside
// closes it and leaves the piece as it was.
//
// `children` sit under the comment box (the files picked to go with it), and `onFiles`
// takes files pasted into the box or dropped on the dialog.
const ReviewDialog = ({
  tone,
  heading,
  title,
  description,
  noteLabel,
  noteRequired = false,
  notePlaceholder,
  hint,
  wide = false,
  confirmLabel,
  confirmDisabled = false,
  busyLabel,
  note,
  onNote,
  onFiles,
  busy,
  error,
  onConfirm,
  onClose,
  children,
}: {
  tone: Tone;
  heading: string;
  // The piece's title.
  title: string;
  description: string;
  noteLabel: string;
  noteRequired?: boolean;
  notePlaceholder: string;
  hint?: string;
  wide?: boolean;
  confirmLabel: string;
  confirmDisabled?: boolean;
  busyLabel: string;
  note: string;
  onNote: (note: string) => void;
  onFiles?: (files: File[]) => void;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}) => {
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const [dragging, setDragging] = useState(false);
  const look = TONES[tone];
  const takesFiles = Boolean(onFiles) && !busy;

  useEffect(() => {
    boxRef.current?.focus();
  }, []);

  // Not while the decision is on its way.
  const close = () => {
    if (!busy) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-[#0b0c24]/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-dialog-title"
        onDragOver={(event) => {
          if (!takesFiles) return;
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          if (!takesFiles) return;
          event.preventDefault();
          setDragging(false);
          onFiles?.(Array.from(event.dataTransfer.files));
        }}
        className={`max-h-[calc(100vh-2rem)] w-full overflow-y-auto rounded-2xl border bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.25)] ${
          wide ? "max-w-2xl" : "max-w-md"
        } ${dragging ? "border-dashed border-[#2f5fd8]" : "border-[#e6e8eb]"}`}
      >
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${look.tile}`}>
            <look.icon size={20} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="review-dialog-title" className="text-[15px] leading-tight font-bold text-[#0b0c24]">
              {heading}
            </h2>
            <p className="mt-1 truncate text-[12.5px] font-medium text-[#1f2530]">{title}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            disabled={busy}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#0b0c24] disabled:cursor-default disabled:opacity-50"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <p className="mt-3 text-[12px] leading-normal text-[#4b5563]">{description}</p>

        <label htmlFor="review-dialog-note" className="mt-4 mb-1.5 flex items-baseline justify-between text-[12px] font-semibold text-[#0b0c24]">
          <span>
            {noteLabel} {noteRequired ? null : <span className="font-normal text-[#6b7280]">(optional)</span>}
          </span>
          <span className="text-[10.5px] font-normal text-[#6b7280]">
            {note.length} / {NOTE_MAX}
          </span>
        </label>
        <textarea
          id="review-dialog-note"
          ref={boxRef}
          rows={noteRequired ? 4 : 3}
          maxLength={NOTE_MAX}
          value={note}
          readOnly={busy}
          onChange={(event) => onNote(event.target.value)}
          onPaste={(event) => {
            const files = Array.from(event.clipboardData.files);
            if (takesFiles && files.length) {
              event.preventDefault();
              onFiles?.(files);
            }
          }}
          placeholder={dragging ? "Drop files to attach them" : notePlaceholder}
          className="block w-full resize-y rounded-lg border border-[#e2e5e9] bg-white px-3 py-2.5 text-[12.5px] leading-normal text-[#1f2530] outline-none placeholder:text-[#9ca3af] focus:border-[#2f5fd8] focus:ring-3 focus:ring-[#2f5fd8]/15"
        />
        {children}
        {hint ? <p className="mt-1.5 text-[11px] text-[#6b7280]">{hint}</p> : null}

        {error ? (
          <div role="alert" className="mt-3 rounded-lg border border-[#f5c2c2] bg-[#fdecec] px-3 py-2 text-[12px] font-medium text-[#b42318]">
            {error}
          </div>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={close}
            disabled={busy}
            className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-[#e2e5e9] bg-white px-4 text-[12.5px] font-medium text-[#1f2530] hover:bg-[#f3f4f6] disabled:cursor-default disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || confirmDisabled}
            aria-busy={busy}
            className={`inline-flex h-10 min-w-32 items-center justify-center gap-1.5 rounded-lg px-4 text-[12.5px] font-medium text-white ${look.button} ${
              busy ? "cursor-wait" : "cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            }`}
          >
            {busy ? (
              <>
                <Loader2 size={14} strokeWidth={2.25} className="animate-spin" /> {busyLabel}
              </>
            ) : (
              <>
                <look.confirmIcon size={14} strokeWidth={2.5} /> {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewDialog;
