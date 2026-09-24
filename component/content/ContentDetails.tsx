"use client";

import { useRef, useState, useTransition, type DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Globe,
  Info,
  Layers,
  Loader2,
  Mail,
  Megaphone,
  MessageSquare,
  MousePointerClick,
  Pencil,
  SendHorizontal,
  Tag,
  User,
} from "lucide-react";
import { approveMyContentAction, type ContentCommentResponse, type ContentItem } from "@/app/actions/content";
import { useSessionUser } from "@/component/shared/SessionUser";
import { poppins } from "@/component/shared/fonts";
import {
  AttachmentPickers,
  AttachmentView,
  BLUE,
  Card,
  DetailRow,
  GRAY,
  IconBadge,
  PendingChip,
  Preview,
  StatusBadge,
  useAttachments,
} from "./contentParts";
import { CONTENT_STATUSES, batchLabelOf, formatDate, personNameOf, shortDate, typeOf } from "./contentUi";

// Sends feedback to the upload route, reporting progress (0–100) as files go up.
const postFeedback = (id: string, form: FormData, onProgress: (percent: number) => void) =>
  new Promise<{ status: number; body: ContentCommentResponse }>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `/api/content/${id}/comments`);
    request.responseType = "json";
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () =>
      resolve({
        status: request.status,
        body: (request.response as ContentCommentResponse | null) ?? { success: false, message: "The server sent an unexpected response." },
      });
    request.onerror = () => reject(new Error("Network error"));
    request.send(form);
  });

const STATUS_HELP = {
  pending_approval: "BayShore is waiting for your review. Approve it, or tell the team what to change.",
  revision_requested: "You asked for changes — the team is working on them. You can add more feedback, or approve it as it is.",
  approved: "You approved this piece. It's final and ready to publish.",
} as const;

// One piece the team sent: the files, the text, and the conversation. The client
// approves it or asks for changes here — asking always goes with a comment, which
// moves the piece to "In Revision".
const ContentDetails = ({ item, related }: { item: ContentItem; related: ContentItem[] }) => {
  const router = useRouter();
  const { name, initials } = useSessionUser();
  const [isRefreshing, startTransition] = useTransition();

  const [confirming, setConfirming] = useState(false);
  const [approving, setApproving] = useState(false);
  const [draft, setDraft] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  // The last thing submitted, so its button keeps spinning while the page reloads.
  const [action, setAction] = useState<"approve" | "send" | null>(null);
  const attachments = useAttachments();
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  const { status, comments } = item;
  const type = typeOf(item);
  const isApproved = status === "approved";
  const batch = batchLabelOf(item);
  const sending = progress !== null;
  const busy = approving || sending || isRefreshing;
  const approveLoading = approving || (isRefreshing && action === "approve");
  const sendLoading = sending || (isRefreshing && action === "send");
  const hasFeedback = draft.trim() !== "" || attachments.files.length > 0;
  const canSend = hasFeedback && !busy;

  const refresh = () => startTransition(() => router.refresh());

  const approve = async () => {
    setError(null);
    setAction("approve");
    setApproving(true);
    const result = await approveMyContentAction(item._id);
    setApproving(false);
    setConfirming(false);
    if (!result.ok) {
      setError(result.error ?? "Couldn't approve this piece. Please try again.");
      return;
    }
    setNotice("Approved — thank you! BayShore has been notified.");
    refresh();
  };

  // Point the client at the feedback box.
  const requestChanges = () => {
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    boxRef.current?.focus({ preventScroll: true });
  };

  const send = async () => {
    if (!canSend) return;
    setError(null);
    setAction("send");
    const form = new FormData();
    form.set("text", draft.trim());
    for (const entry of attachments.files) form.append("files", entry.file, entry.file.name);

    setProgress(0);
    try {
      const { status: code, body } = await postFeedback(item._id, form, setProgress);
      if (code < 200 || code >= 300) {
        setError([body.message, ...(body.errors ?? [])].filter(Boolean).join(" — "));
        return;
      }
      setDraft("");
      attachments.clear();
      setNotice(status === "pending_approval" ? "Feedback sent — the team will make the changes." : "Feedback sent.");
      refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setProgress(null);
    }
  };

  const dropProps = isApproved
    ? {}
    : {
        onDragOver: (event: DragEvent) => {
          event.preventDefault();
          setDragging(true);
        },
        onDragLeave: () => setDragging(false),
        onDrop: (event: DragEvent) => {
          event.preventDefault();
          setDragging(false);
          attachments.add(Array.from(event.dataTransfer.files));
        },
      };

  const extras = [
    item.pageName ? { icon: Globe, label: "Page", value: item.pageUrl ? `${item.pageName} · ${item.pageUrl}` : item.pageName } : null,
    item.subject ? { icon: Mail, label: "Subject line", value: item.subject } : null,
    item.headline ? { icon: Megaphone, label: "Headline", value: item.headline } : null,
    item.cta ? { icon: MousePointerClick, label: "Button", value: item.cta } : null,
  ].filter((entry) => entry !== null);

  return (
    <div className={`${poppins.className} flex flex-col gap-4.5`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 text-[12px] text-[#4b5260]">
            <Link href="/content" className="hover:underline">
              Content
            </Link>{" "}
            / <span className="font-semibold text-[#0b0c24]">{item.title}</span>
          </div>
          <h1 className="text-[28px] leading-tight font-bold text-[#0b0c24]">{item.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[#4b5563]">
            <StatusBadge status={status} />
            <span className="rounded-md px-2.5 py-1 text-[10.5px] font-medium" style={{ background: type.background, color: type.color }}>
              {type.label}
            </span>
            <span>
              Sent {formatDate(item.submittedAt)} by {personNameOf(item.createdBy) ?? "BayShore Communication"}
            </span>
            <span className="text-[#c4c8ce]">•</span>
            <span>{batch}</span>
          </div>
        </div>
        <Link
          href="/content"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e2e5e9] bg-white px-4 text-[12.5px] font-medium text-[#1f2530] no-underline shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-[#f3f4f6]"
        >
          <ArrowLeft size={14} strokeWidth={2} /> Content List
        </Link>
      </div>

      {notice ? (
        <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-[#bfe3c9] bg-[#ecf8ef] px-4 py-3 text-[12.5px] font-medium text-[#15803d]">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} strokeWidth={2} /> {notice}
          </span>
          <button type="button" onClick={() => setNotice(null)} className="cursor-pointer text-[11.5px] font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      ) : null}

      {error ? (
        <div role="alert" className="rounded-xl border border-[#f5c2c2] bg-[#fdecec] px-4 py-3 text-[12.5px] font-medium text-[#b42318]">
          {error}
        </div>
      ) : null}

      {item.sentReason ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-[#f1dfbf] bg-[#fdf6ea] px-4 py-3 text-[12px] text-[#7a4b0f]">
          <Mail size={15} strokeWidth={2} className="mt-0.5 shrink-0" />
          <span>
            <b className="font-semibold">Sent outside the regular batch:</b> {item.sentReason}
          </span>
        </div>
      ) : null}

      <div className="grid items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="flex flex-col gap-4.5">
          <Card badge={type} title="Preview">
            <Preview item={item} />
          </Card>

          {item.caption || item.tags.length > 0 || extras.length > 0 ? (
            <Card badge={{ icon: Tag, ...BLUE }} title="Text & Details">
              {extras.length ? (
                <div className="mb-4 grid gap-2.5 sm:grid-cols-2">
                  {extras.map((entry) => (
                    <div key={entry.label} className="rounded-lg border border-[#eceef1] bg-[#fafbfc] px-3 py-2.5">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-[#6b7280] uppercase">
                        <entry.icon size={12} strokeWidth={2} /> {entry.label}
                      </div>
                      <div className="mt-1 text-[12.5px] font-medium break-words text-[#1f2530]">{entry.value}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              {item.caption ? <p className="text-[13px] leading-[1.7] whitespace-pre-line text-[#374151]">{item.caption}</p> : null}
              {item.tags.length > 0 ? (
                <div className={`flex flex-wrap gap-2 ${item.caption ? "mt-4" : ""}`}>
                  {item.tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-[#f3f4f6] px-2.5 py-1 text-[11px] font-medium text-[#4b5260]">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </Card>
          ) : null}

          <Card
            badge={{ icon: MessageSquare, ...BLUE }}
            title="Comments"
            aside={<span className="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-[10.5px] font-medium text-[#4b5260]">{comments.length}</span>}
          >
            {comments.length > 0 ? (
              <div className="flex flex-col gap-4">
                {comments.map((entry, index) => {
                  const fromClient = entry.author === "client";
                  const author = entry.name ?? personNameOf(entry.user) ?? (fromClient ? name : "BayShore");
                  return (
                    <div className="flex gap-3" key={`${entry.createdAt}-${index}`}>
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${
                          fromClient ? "bg-[#2f5fd8]" : "bg-[#0b0c24]"
                        }`}
                      >
                        {fromClient && !entry.name ? initials : author.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-semibold text-[#0b0c24]">
                          {author}
                          <span
                            className={`ml-1.5 rounded px-1.5 py-px text-[9.5px] font-semibold ${
                              fromClient ? "bg-[#d9e0ef] text-[#2f5fd8]" : "bg-[#eceef1] text-[#4b5260]"
                            }`}
                          >
                            {fromClient ? "You" : "BayShore"}
                          </span>
                          <span className="ml-1.5 font-normal text-[#9ca3af]">{shortDate(entry.createdAt)}</span>
                        </div>
                        {entry.text ? (
                          <div className="mt-1 w-fit max-w-full rounded-xl rounded-tl-sm bg-[#f5f6f8] px-3.5 py-2.5 text-[12.5px] leading-normal break-words whitespace-pre-line text-[#374151]">
                            {entry.text}
                          </div>
                        ) : null}
                        {entry.attachments?.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {entry.attachments.map((file) => (
                              <AttachmentView key={file.url} file={file} />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-3 text-center text-[12px] text-[#6b7280]">No comments yet.</div>
            )}

            {!isApproved ? (
              <div
                ref={composerRef}
                {...dropProps}
                className={`mt-4 rounded-xl border p-2.5 transition-colors ${
                  dragging ? "border-dashed border-[#2f5fd8] bg-[#f3f6fd]" : "border-[#e2e5e9] bg-white focus-within:border-[#9aa3af]"
                }`}
              >
                {attachments.files.length > 0 ? (
                  <div className="mb-2.5 flex flex-wrap gap-2">
                    {attachments.files.map((file) => (
                      <PendingChip key={file.id} file={file} disabled={sending} onRemove={() => attachments.remove(file.id)} />
                    ))}
                  </div>
                ) : null}
                <textarea
                  ref={boxRef}
                  rows={3}
                  value={draft}
                  readOnly={sending}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      send();
                    }
                  }}
                  onPaste={(event) => {
                    const files = Array.from(event.clipboardData.files);
                    if (files.length) {
                      event.preventDefault();
                      attachments.add(files);
                    }
                  }}
                  placeholder={dragging ? "Drop files to attach them" : "What would you like changed? Attach a screenshot, video or document if it helps..."}
                  className="block w-full resize-none border-none bg-transparent px-1 text-[12.5px] text-[#1f2530] outline-none placeholder:text-[#9ca3af]"
                />
                <div className="mt-2 flex items-center justify-between gap-2 border-t border-[#f0f1f3] pt-2.5">
                  <AttachmentPickers onPick={attachments.add} disabled={attachments.full || sending} />
                  <button
                    type="button"
                    onClick={send}
                    disabled={!canSend}
                    aria-busy={sendLoading}
                    className={`inline-flex h-9 min-w-34 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#0b0c24] px-3.5 text-[12px] font-medium text-white ${
                      sendLoading ? "cursor-wait" : "cursor-pointer hover:bg-[#1e2140] disabled:cursor-not-allowed disabled:opacity-40"
                    }`}
                  >
                    {sendLoading ? (
                      <>
                        <Loader2 size={14} strokeWidth={2.25} className="animate-spin" />
                        {sending && attachments.files.length && (progress ?? 0) < 100 ? `Uploading ${progress}%` : "Sending…"}
                      </>
                    ) : (
                      <>
                        <SendHorizontal size={14} strokeWidth={2} /> Send feedback
                      </>
                    )}
                  </button>
                </div>
                {attachments.error ? <div className="mt-2 px-1 text-[11px] font-medium text-[#b91c1c]">{attachments.error}</div> : null}
                <div className="mt-2 px-1 text-[11px] text-[#6b7280]">
                  Sending feedback asks BayShore for changes and marks this piece <b className="font-semibold">In Revision</b>.
                </div>
              </div>
            ) : null}
          </Card>
        </div>

        <div className="flex flex-col gap-4.5 lg:sticky lg:top-4">
          {/* Where the piece stands, and the client's decision */}
          <Card badge={{ icon: CheckCircle2, color: CONTENT_STATUSES[status].color, background: CONTENT_STATUSES[status].background }} title="Your Review">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11.5px] text-[#6b7280]">Status</span>
              <StatusBadge status={status} />
            </div>
            <p className="mt-3 text-[12px] leading-normal text-[#4b5563]">{STATUS_HELP[status]}</p>

            {isApproved ? (
              <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-[#ecf8ef] px-3 py-2.5 text-[12px] text-[#15803d]">
                <CheckCircle2 size={18} strokeWidth={2} className="shrink-0" />
                <span>
                  Approved{item.approvedAt ? ` on ${formatDate(item.approvedAt)}` : ""}
                  {personNameOf(item.approvedBy) ? ` by ${personNameOf(item.approvedBy)}` : ""}
                </span>
              </div>
            ) : confirming ? (
              <div className="mt-4 rounded-lg border border-[#bfe3c9] bg-[#f4fbf6] p-3">
                <div className="text-[12.5px] font-semibold text-[#0b0c24]">Approve “{item.title}”?</div>
                <div className="mt-1 text-[11.5px] text-[#4b5563]">Once approved it&apos;s final — you won&apos;t be able to ask for changes.</div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={approve}
                    disabled={busy}
                    aria-busy={approveLoading}
                    className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#16a34a] text-[12px] font-medium text-white hover:bg-[#15803d] disabled:cursor-wait"
                  >
                    {approveLoading ? (
                      <>
                        <Loader2 size={14} strokeWidth={2.25} className="animate-spin" /> Approving…
                      </>
                    ) : (
                      <>
                        <Check size={14} strokeWidth={2.5} /> Yes, approve
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={approveLoading}
                    className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-[#e2e5e9] bg-white px-3.5 text-[12px] font-medium text-[#1f2530] hover:bg-[#f3f4f6]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  disabled={busy}
                  className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#16a34a] text-[12.5px] font-medium text-white hover:bg-[#15803d] disabled:cursor-not-allowed"
                >
                  <Check size={15} strokeWidth={2.5} /> {status === "revision_requested" ? "Approve as it is" : "Approve"}
                </button>
                <button
                  type="button"
                  onClick={requestChanges}
                  disabled={busy}
                  className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#e2e5e9] bg-white text-[12.5px] font-medium text-[#1f2530] hover:bg-[#f3f4f6] disabled:cursor-not-allowed"
                >
                  <Pencil size={14} strokeWidth={2} /> {status === "revision_requested" ? "Add more feedback" : "Request Changes"}
                </button>
              </div>
            )}
          </Card>

          <Card badge={{ icon: Info, ...GRAY }} title="Details">
            <DetailRow icon={type.icon} label="Type">
              {type.label}
            </DetailRow>
            <DetailRow icon={CalendarDays} label="Batch">
              {batch}
            </DetailRow>
            <DetailRow icon={Clock} label="Sent">
              {formatDate(item.submittedAt)}
            </DetailRow>
            <DetailRow icon={User} label="Sent by">
              {personNameOf(item.createdBy) ?? "BayShore Communication"}
            </DetailRow>
            {isApproved ? (
              <DetailRow icon={Check} label="Approved">
                {formatDate(item.approvedAt)}
              </DetailRow>
            ) : null}
          </Card>

          {related.length > 0 ? (
            <Card badge={{ icon: Layers, ...GRAY }} title={`More from ${batch}`}>
              <div className="flex flex-col gap-1">
                {related.map((other) => (
                  <Link
                    key={other._id}
                    href={`/content/${other._id}`}
                    className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 text-inherit no-underline hover:bg-[#f5f6f8]"
                  >
                    <IconBadge badge={typeOf(other)} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-medium text-[#1f2530] group-hover:text-[#2f5fd8]">{other.title}</span>
                      <span className="block text-[10.5px] text-[#6b7280]">{CONTENT_STATUSES[other.status].label}</span>
                    </span>
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CONTENT_STATUSES[other.status].dot }} />
                  </Link>
                ))}
              </div>
              <Link
                href="/content"
                className="mt-3 flex h-9 items-center justify-center rounded-lg bg-[#f3f4f6] text-[12px] font-medium text-[#1f2530] no-underline hover:bg-[#e9ebee]"
              >
                View all content
              </Link>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ContentDetails;
