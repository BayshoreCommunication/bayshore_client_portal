"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, FileText, Loader2, MessageSquare, Paperclip, Send, X } from "lucide-react";
import { listMyOnboardingCommentsAction, type OnboardingComment, type OnboardingCommentFile } from "@/app/actions/onboarding";
import { formatFileSize } from "@/component/projects/projectUi";
import { useRealtime, useRefreshing } from "@/lib/realtime";

// Beside the onboarding form: comments on the step that is open — a question for the team, or a
// note about an answer, with files if they like — and, under each, the team's replies from the
// company portal. A comment with no reply shows on its own. Saved on the backend
// (/onboarding/me/comments); a new one goes up through app/api/onboarding/comments.

// At most this many files on one comment (backend: ONBOARDING_COMMENT_MAX_FILES).
const MAX_FILES = 5;
const MAX_LENGTH = 1000;

const initialsOf = (name: string, fallback: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || fallback;

const timeOf = (iso: string) => {
  const at = new Date(iso);
  const sameDay = at.toDateString() === new Date().toDateString();
  return sameDay
    ? at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : at.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Sends a form, reporting how much of it has gone up (0–100) as it does.
const sendWithProgress = (url: string, form: FormData, onProgress: (percent: number) => void) =>
  new Promise<{ ok: boolean; body: { data?: unknown; message?: string } | null }>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", url);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };
    request.onload = () => {
      onProgress(100);
      let body = null;
      try {
        body = JSON.parse(request.responseText);
      } catch {
        // Not JSON: said as a failure below.
      }
      resolve({ ok: request.status >= 200 && request.status < 300, body });
    };
    request.onerror = () => reject(new Error("network"));
    request.send(form);
  });

const isImage = (file: { name: string; mimeType?: string; type?: string }) =>
  (file.mimeType ?? file.type ?? "").startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(file.name);

// What a comment came with: each picture as a thumbnail that opens it, anything else a link
// with its name and size.
const Files = ({ files }: { files: OnboardingCommentFile[] }) =>
  files.length ? (
    <div className="mt-1.5 flex flex-col gap-1.5">
      {files.some(isImage) ? (
        <div className="flex flex-wrap gap-1.5">
          {files.filter(isImage).map((file) => (
            <a key={file.url} href={file.url} target="_blank" rel="noopener" title={file.name} className="block size-20 overflow-hidden rounded-lg border border-[#e6e8eb] bg-[#f5f6f8] hover:border-[#2f5fd8]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={file.url} alt={file.name} loading="lazy" className="size-full object-cover" />
            </a>
          ))}
        </div>
      ) : null}
      {files
        .filter((file) => !isImage(file))
        .map((file) => (
          <a
            key={file.url}
            href={file.url}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 rounded-lg border border-[#e6e8eb] bg-white px-2.5 py-1.5 text-[11.5px] no-underline hover:border-[#2f5fd8]"
          >
            <FileText size={14} strokeWidth={2} className="shrink-0 text-[#2f5fd8]" />
            <span className="min-w-0 flex-1 truncate font-medium text-[#1f2530]" title={file.name}>
              {file.name}
            </span>
            <span className="shrink-0 text-[#9ca3af]">{formatFileSize(file.size)}</span>
          </a>
        ))}
    </div>
  ) : null;

// A picked file before it is posted: its name, and a small × to take it off.
const PickedFile = ({ file, onRemove }: { file: File; onRemove: () => void }) => (
  <span className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-[#eef2fb] py-1 pr-1 pl-2 text-[11.5px] font-medium text-[#1f2530]">
    <FileText size={12} strokeWidth={2} className="shrink-0 text-[#2f5fd8]" />
    <span className="max-w-40 truncate" title={file.name}>
      {file.name}
    </span>
    <button type="button" aria-label={`Remove ${file.name}`} onClick={onRemove} className="grid size-4 shrink-0 cursor-pointer place-items-center rounded text-[#6b7280] hover:bg-white hover:text-[#b42318]">
      <X size={10} strokeWidth={2.75} />
    </button>
  </span>
);

const StepComments = ({ stepId, stepTitle, name, initial }: { stepId: string; stepTitle: string; name: string; initial: OnboardingComment[] }) => {
  const [all, setAll] = useState(initial);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  // A comment or reply from either side, live (backend → onboarding:comment): added, or updated.
  useRealtime<OnboardingComment>("onboarding:comment", (comment) =>
    setAll((now) => (now.some((entry) => entry._id === comment._id) ? now.map((entry) => (entry._id === comment._id ? comment : entry)) : [...now, comment])),
  );
  // And reloaded now and then, in case the live connection is down.
  useRefreshing(() => void listMyOnboardingCommentsAction().then((result) => result.ok && result.data && setAll(result.data)));
  const comments = all.filter((comment) => comment.step === stepId);
  const ready = (draft.trim() !== "" || files.length > 0) && !sending;

  const attach = (picked: FileList | null) => {
    if (picked?.length) setFiles((previous) => [...previous, ...Array.from(picked)].slice(0, MAX_FILES));
    if (picker.current) picker.current.value = "";
  };

  const post = async () => {
    if (!ready) return;
    setSending(true);
    setError(null);
    setDone(null);
    const form = new FormData();
    form.append("step", stepId);
    form.append("text", draft.trim());
    files.forEach((file) => form.append("files", file));
    const count = files.length;
    try {
      const { ok, body } = await sendWithProgress("/api/onboarding/comments", form, () => undefined);
      if (!ok || !body?.data) {
        setError(body?.message || "Couldn't post your comment. Please try again.");
        return;
      }
      const posted = body.data as OnboardingComment;
      setAll((previous) => (previous.some((entry) => entry._id === posted._id) ? previous : [...previous, posted]));
      setDraft("");
      setFiles([]);
      // Said for a few seconds: it went, with its files.
      setDone(count ? `Comment posted · ${count} file${count === 1 ? "" : "s"} uploaded` : "Comment posted");
      setTimeout(() => setDone(null), 4000);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#e6e8eb] bg-white p-5.5 shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e8effd] text-[#2f5fd8]">
          <MessageSquare size={16} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-[#0b0c24]">Comments</h3>
          <p className="text-[11.5px] leading-snug text-[#6b7280]">
            Questions about <b className="font-semibold text-[#4b5260]">{stepTitle}</b>? Ask here.
          </p>
        </div>
        {comments.length ? <span className="rounded-full bg-[#eef0f3] px-2 py-0.5 text-[11px] font-semibold text-[#4b5260]">{comments.length}</span> : null}
      </div>

      {comments.length ? (
        <ul className="mt-3.5 flex max-h-80 list-none flex-col gap-3.5 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {comments.map((comment) => (
              <motion.li key={comment._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
                {/* One the team started shows as theirs; the client's own, as "You". */}
                <div className="flex gap-2.5">
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full text-[10.5px] font-semibold text-white ${comment.side === "team" ? "bg-[#2f5fd8]" : "bg-[#0b0c24]"}`}
                  >
                    {comment.side === "team" ? initialsOf(comment.authorName, "B") : initialsOf(comment.authorName || name, "Y")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-1.5 text-[12px]">
                      <span className="font-semibold text-[#0b0c24]">{comment.side === "team" ? comment.authorName : "You"}</span>
                      {comment.side === "team" ? (
                        <span className="rounded bg-[#e8effd] px-1.5 py-px text-[9.5px] font-semibold tracking-wide text-[#2f5fd8] uppercase">BayShore team</span>
                      ) : null}
                      <span className="text-[11px] text-[#9ca3af]">{timeOf(comment.createdAt)}</span>
                    </div>
                    {comment.text ? (
                      <p
                        className={`mt-0.5 rounded-lg rounded-tl-sm px-3 py-2 text-[12.5px] leading-normal break-words whitespace-pre-wrap text-[#1f2530] ${comment.side === "team" ? "bg-[#eef3fd]" : "bg-[#f5f6f8]"}`}
                      >
                        {comment.text}
                      </p>
                    ) : null}
                    <Files files={comment.files} />
                  </div>
                </div>

                {/* The team's answers, tucked under the comment they answer. */}
                {comment.replies.length ? (
                  <ul className="mt-2.5 ml-3.5 flex list-none flex-col gap-2.5 border-l-2 border-[#dbe5fb] pl-3">
                    {comment.replies.map((reply) => (
                      <li key={reply._id} className="flex gap-2.5">
                        <span className="grid size-6.5 shrink-0 place-items-center rounded-full bg-[#2f5fd8] text-[10px] font-semibold text-white">{initialsOf(reply.authorName, "B")}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-1.5 text-[12px]">
                            <span className="font-semibold text-[#0b0c24]">{reply.authorName}</span>
                            <span className="rounded bg-[#e8effd] px-1.5 py-px text-[9.5px] font-semibold tracking-wide text-[#2f5fd8] uppercase">BayShore team</span>
                            <span className="text-[11px] text-[#9ca3af]">{timeOf(reply.createdAt)}</span>
                          </div>
                          {reply.text ? (
                            <p className="mt-0.5 rounded-lg rounded-tl-sm bg-[#eef3fd] px-3 py-2 text-[12.5px] leading-normal break-words whitespace-pre-wrap text-[#1f2530]">{reply.text}</p>
                          ) : null}
                          <Files files={reply.files} />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : null}

      <div className="mt-3.5 rounded-xl border border-[#e2e5e9] bg-white focus-within:border-[#2f5fd8] focus-within:ring-3 focus-within:ring-[#2f5fd8]/12">
        <textarea
          rows={2}
          value={draft}
          maxLength={MAX_LENGTH}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void post();
            }
          }}
          placeholder="Write a comment…"
          aria-label={`Comment on ${stepTitle}`}
          className="block w-full resize-none rounded-xl bg-transparent px-3 pt-2.5 text-[12.5px] text-[#1f2530] outline-none placeholder:text-[#9ca3af]"
        />
        {files.length ? (
          <div className="flex flex-wrap gap-1.5 px-2.5 pt-1.5">
            {files.map((file, index) => (
              <PickedFile key={`${file.name}-${file.lastModified}-${index}`} file={file} onRemove={() => setFiles((previous) => previous.filter((_, at) => at !== index))} />
            ))}
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-2 px-2.5 pt-1 pb-2">
          <div className="flex items-center gap-1.5">
            <input
              ref={picker}
              type="file"
              multiple
              hidden
              accept="image/*,video/mp4,video/quicktime,video/webm,.pdf,.doc,.docx,.txt"
              onChange={(event) => attach(event.target.files)}
            />
            <button
              type="button"
              aria-label="Attach files"
              title={files.length >= MAX_FILES ? `Up to ${MAX_FILES} files` : "Attach files"}
              disabled={files.length >= MAX_FILES || sending}
              onClick={() => picker.current?.click()}
              className="grid size-7 cursor-pointer place-items-center rounded-md text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#2f5fd8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Paperclip size={15} strokeWidth={2} />
            </button>
            {files.length ? (
              <span className="rounded-full bg-[#2f5fd8] px-1.5 py-px text-[10.5px] font-bold text-white">
                {files.length} file{files.length === 1 ? "" : "s"}
              </span>
            ) : (
              <span className="text-[10.5px] text-[#9ca3af]">Your team sees this</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => void post()}
            disabled={!ready}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#0b0c24] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1e2140] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} strokeWidth={2.25} />} {sending ? "Posting…" : "Comment"}
          </button>
        </div>
      </div>
      {done ? (
        <p role="status" className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[#e7f6ec] px-2.5 py-1.5 text-[12px] font-semibold text-[#15803d]">
          <CheckCircle2 size={13} strokeWidth={2.5} /> {done}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-[12px] font-medium text-[#b42318]">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default StepComments;
