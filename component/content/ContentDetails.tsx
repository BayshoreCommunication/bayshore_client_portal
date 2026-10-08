"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
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
  MessagesSquare,
  MousePointerClick,
  Pencil,
  RotateCcw,
  Tag,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  approveMyContentAction,
  updateMyContentAction,
  type ContentCommentResponse,
  type ContentItem,
  type ContentPiece,
} from "@/app/actions/content";
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
import {
  CONTENT_STATUSES,
  MAX_ATTACHMENTS,
  batchLabelOf,
  batchTypeLabelOf,
  formatDate,
  personNameOf,
  piecesOf,
  revisionNoteOf,
  threadOf,
  typeOf,
} from "./contentUi";
import ReviewDialog from "./ReviewDialog";
import RevisionHistory, { REVIEW_ANCHOR } from "./RevisionHistory";
import DateTime from "./DateTime";
import GroupPieces, { arrivalNotice, forgetPieces, nextWaiting, rememberPieces } from "./GroupPieces";
import MessageBox from "./MessageBox";

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

// One piece the team sent: the files, the text, and the conversation. The client
// approves it or asks for changes here, each in its own dialog — asking always goes with a
// comment, which moves the piece to "In Revision" (each time that happens is one more
// revision, and the page says how many there have been), an approved piece included. A
// message from the Messages box is only a message: the piece stays where it is.
// ── Caption and tags, which the client can rewrite ───────────────────────────

// The backend's limits (validators/content.validator.ts).
const CAPTION_MAX = 2000;
const TAGS_MAX = 20;
const TAG_MAX = 50;

const fieldClass =
  "w-full rounded-lg border border-[#e2e5e9] bg-white px-3 py-2.5 text-[12.5px] text-[#1f2530] outline-none placeholder:text-[#9ca3af] focus:border-[#2f5fd8] focus:ring-3 focus:ring-[#2f5fd8]/15";
const fieldLabel = "mb-1.5 flex items-baseline justify-between text-[12px] font-semibold text-[#0b0c24]";

// The piece's words and its other details. While the piece is still open (not approved),
// the client can rewrite the caption and tags themselves; saving leaves a note on the
// comments so the team sees it. Page, subject and the like stay as BayShore set them.
const TextAndDetails = ({
  item,
  extras,
  editable,
  onSaved,
}: {
  item: ContentItem;
  extras: { icon: LucideIcon; label: string; value: string }[];
  editable: boolean;
  onSaved: () => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [entry, setEntry] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editable && !item.caption && item.tags.length === 0 && extras.length === 0) return null;

  const startEditing = () => {
    setCaption(item.caption ?? "");
    setTags(item.tags);
    setEntry("");
    setError(null);
    setEditing(true);
  };

  // Adds what is typed in the tag box; returns the list as it then stands, or null if it can't be added.
  const withEntry = (current: string[]) => {
    const tag = entry.trim();
    if (!tag || current.includes(tag)) return current;
    if (tag.length > TAG_MAX) {
      setError(`A tag can be at most ${TAG_MAX} characters.`);
      return null;
    }
    if (current.length >= TAGS_MAX) {
      setError(`You can add at most ${TAGS_MAX} tags.`);
      return null;
    }
    return [...current, tag];
  };

  const addTag = () => {
    const next = withEntry(tags);
    if (!next) return;
    setError(null);
    setTags(next);
    setEntry("");
  };

  const onTagKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag();
    } else if (event.key === "Backspace" && !entry && tags.length) {
      setTags(tags.slice(0, -1));
    }
  };

  const save = async () => {
    // A tag still sitting in the box counts.
    const next = withEntry(tags);
    if (!next) return;
    setError(null);
    setSaving(true);
    const result = await updateMyContentAction(item._id, { caption: caption.trim(), tags: next });
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "Couldn't save your changes. Please try again.");
      return;
    }
    setEditing(false);
    onSaved();
  };

  return (
    <Card
      badge={{ icon: Tag, ...BLUE }}
      title="Text & Details"
      aside={
        editable && !editing ? (
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#e2e5e9] bg-white px-3 text-[11.5px] font-medium text-[#1f2530] hover:border-[#2f5fd8] hover:text-[#2f5fd8]"
          >
            <Pencil size={12} strokeWidth={2} /> Edit caption &amp; tags
          </button>
        ) : null
      }
    >
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

      {editing ? (
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="content-caption" className={fieldLabel}>
              Caption
              <span className="text-[10.5px] font-normal text-[#6b7280]">
                {caption.length} / {CAPTION_MAX}
              </span>
            </label>
            <textarea
              id="content-caption"
              rows={6}
              maxLength={CAPTION_MAX}
              className={`${fieldClass} resize-y leading-[1.6]`}
              placeholder="The text that goes with this piece…"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="content-tags" className={fieldLabel}>
              Tags
              <span className="text-[10.5px] font-normal text-[#6b7280]">Press Enter or comma to add</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[#e2e5e9] bg-white px-2 py-2 focus-within:border-[#2f5fd8] focus-within:ring-3 focus-within:ring-[#2f5fd8]/15">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-[#f3f4f6] py-1 pr-1 pl-2.5 text-[11px] font-medium text-[#4b5260]">
                  {tag}
                  <button
                    type="button"
                    aria-label={`Remove ${tag}`}
                    className="flex h-4 w-4 cursor-pointer items-center justify-center rounded text-[#6b7280] hover:bg-[#e2e5e9] hover:text-[#0b0c24]"
                    onClick={() => setTags(tags.filter((other) => other !== tag))}
                    disabled={saving}
                  >
                    <X size={11} strokeWidth={2.5} />
                  </button>
                </span>
              ))}
              <input
                id="content-tags"
                type="text"
                className="min-w-30 flex-1 border-none bg-transparent px-1 py-1 text-[12.5px] text-[#1f2530] outline-none placeholder:text-[#9ca3af]"
                placeholder={tags.length ? "Add another…" : "Add a tag…"}
                value={entry}
                onChange={(event) => setEntry(event.target.value)}
                onKeyDown={onTagKey}
                onBlur={addTag}
                disabled={saving}
              />
            </div>
          </div>

          {error ? (
            <div role="alert" className="rounded-lg border border-[#f5c2c2] bg-[#fdecec] px-3 py-2 text-[12px] font-medium text-[#b42318]">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-[#6b7280]">BayShore will see that you changed the text.</span>
            <div className="flex gap-2">
              <button
                type="button"
                className="h-9 cursor-pointer rounded-lg border border-[#e2e5e9] bg-white px-4 text-[12px] font-medium text-[#1f2530] hover:bg-[#f3f4f6] disabled:cursor-default disabled:opacity-50"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[#0b0c24] px-4 text-[12px] font-medium text-white hover:bg-[#1e2140] disabled:cursor-wait disabled:opacity-70"
                onClick={save}
                disabled={saving}
                aria-busy={saving}
              >
                {saving ? <Loader2 size={13} strokeWidth={2.5} className="animate-spin" /> : <Check size={13} strokeWidth={2.5} />}
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
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
          {!item.caption && item.tags.length === 0 ? (
            <p className="text-[12.5px] text-[#6b7280]">No caption or tags yet{editable ? " — you can add them." : "."}</p>
          ) : null}
        </>
      )}
    </Card>
  );
};

const ContentDetails = ({ item, related }: { item: ContentItem; related: ContentItem[] }) => {
  const router = useRouter();
  const { name } = useSessionUser();
  const [isRefreshing, startTransition] = useTransition();

  // A decision goes through a dialog: "approve", or "feedback" (a request for changes).
  // Each keeps what was typed into it, and what went wrong with the last attempt.
  const [dialog, setDialog] = useState<"approve" | "feedback" | null>(null);
  // The piece the dialog is about: the one on screen, or another of its group picked from the group card.
  const [targetId, setTargetId] = useState(item._id);
  const [approveNote, setApproveNote] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  // Files picked in the feedback dialog, and how far their upload has got (0–100).
  const feedbackFiles = useAttachments();
  const [feedbackProgress, setFeedbackProgress] = useState<number | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [sending, setSending] = useState(false);
  // Reached by approving the piece before it? Then the page opens saying so — whether it is
  // a fresh page or this one handed the next piece.
  const [notice, setNotice] = useState<string | null>(() => arrivalNotice(item._id));
  const [noticeFor, setNoticeFor] = useState(item._id);
  if (noticeFor !== item._id) {
    setNoticeFor(item._id);
    setNotice(arrivalNotice(item._id));
  }

  // The message box under the thread: plain messages, which never move the piece.
  const [messageText, setMessageText] = useState("");
  const messageFiles = useAttachments();
  const [messageProgress, setMessageProgress] = useState<number | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // The box kept open under a revision that is under way, for whatever was left out of it.
  const [moreText, setMoreText] = useState("");
  const moreFiles = useAttachments();
  const [moreProgress, setMoreProgress] = useState<number | null>(null);
  const [moreError, setMoreError] = useState<string | null>(null);

  const { status, comments } = item;
  const type = typeOf(item);
  const isApproved = status === "approved";
  const revisions = item.revisionCount ?? 0;
  const revisionNote = revisionNoteOf(item);
  const batch = batchLabelOf(item);
  const pieces = piecesOf(item);
  // Pieces sent together share one conversation: this piece's messages and the others', in one.
  const thread = threadOf(pieces, item._id, comments);
  const target = pieces.find((piece) => piece._id === targetId) ?? pieces.find((piece) => piece._id === item._id) ?? pieces[0];
  const targetRevisions = target.revisionCount ?? 0;
  const targetElsewhere = target._id !== item._id;
  // The revision request is with BayShore and they haven't answered yet — nothing more to ask for until they do.
  const awaitingTeam = status === "revision_requested" && Boolean(pieces.find((piece) => piece._id === item._id)?.awaitingTeam);
  const messaging = messageProgress !== null;
  const busy = approving || sending || messaging || moreProgress !== null || isRefreshing;
  const canMessage = (messageText.trim() !== "" || messageFiles.files.length > 0) && !messaging;

  const refresh = () => startTransition(() => router.refresh());

  // This piece is on screen now — whichever piece of its group was being headed for, it has arrived.
  useEffect(() => forgetPieces(), [item._id]);

  // Like any chat, the thread opens on its latest message and follows new ones.
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [thread.length]);

  // Opens a dialog — about the piece on screen unless another of its group is named. Nothing
  // happens to the piece until it is confirmed there.
  const openDialog = (kind: "approve" | "feedback", piece?: ContentPiece) => {
    const id = piece?._id ?? item._id;
    // What was typed about one piece must not follow the dialog to another.
    if (id !== targetId) {
      setApproveNote("");
      setFeedbackText("");
      feedbackFiles.clear();
    }
    setDialogError(null);
    setTargetId(id);
    setDialog(kind);
  };

  const approve = async () => {
    setDialogError(null);
    setApproving(true);
    const result = await approveMyContentAction(target._id, approveNote);
    setApproving(false);
    if (!result.ok) {
      // The dialog stays open, so a comment already typed isn't lost.
      setDialogError(result.error ?? "Couldn't approve this piece. Please try again.");
      return;
    }
    setDialog(null);
    setApproveNote("");

    // With a piece approved, move straight on to the next of its group still waiting for a
    // decision, so several can be gone through one after another — whether it was the piece
    // on screen or one approved from the group's card. Only a piece on screen that is itself
    // still waiting keeps the page: it is the next one to decide.
    const next = nextWaiting(pieces, target._id);
    const waitingHere = targetElsewhere && status === "pending_approval";
    if (next && !waitingHere && next._id !== item._id) {
      rememberPieces(
        pieces.map((piece) => (piece._id === target._id ? { ...piece, status: "approved" as const } : piece)),
        next._id,
        `“${target.title}” approved — thank you! Here is the next piece waiting for you.`,
      );
      startTransition(() => router.push(`/content/${next._id}`));
      return;
    }

    setNotice(targetElsewhere ? `“${target.title}” approved — thank you! BayShore has been notified.` : "Approved — thank you! BayShore has been notified.");
    refresh();
  };

  // A plain message from the box under the thread — words, files, or both. The piece stays
  // where it is; asking for changes is the dialog's job.
  const sendMessage = async () => {
    if (!canMessage) return;
    setMessageError(null);
    const form = new FormData();
    form.set("kind", "message");
    form.set("text", messageText.trim());
    for (const entry of messageFiles.files) form.append("files", entry.file, entry.file.name);

    setMessageProgress(0);
    try {
      const { status: code, body } = await postFeedback(item._id, form, setMessageProgress);
      if (code < 200 || code >= 300) {
        setMessageError([body.message, ...(body.errors ?? [])].filter(Boolean).join(" — "));
        return;
      }
      setMessageText("");
      messageFiles.clear();
      refresh();
    } catch {
      setMessageError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setMessageProgress(null);
    }
  };

  // Something more for the revision under way — words, files, or both — from the box under it.
  const addToRevision = async () => {
    const text = moreText.trim();
    if (!text && moreFiles.files.length === 0) return;
    setMoreError(null);
    const form = new FormData();
    form.set("kind", "revision");
    form.set("text", text);
    for (const entry of moreFiles.files) form.append("files", entry.file, entry.file.name);

    setMoreProgress(0);
    try {
      const { status: code, body } = await postFeedback(item._id, form, setMoreProgress);
      if (code < 200 || code >= 300) {
        setMoreError([body.message, ...(body.errors ?? [])].filter(Boolean).join(" — "));
        return;
      }
      setMoreText("");
      moreFiles.clear();
      setNotice("Added to your revision request.");
      refresh();
    } catch {
      setMoreError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setMoreProgress(null);
    }
  };

  // The dialog's request for changes — words, files, or both. It puts the piece In Revision,
  // reopening it if it was approved.
  const sendFeedback = async () => {
    const text = feedbackText.trim();
    if (!text && feedbackFiles.files.length === 0) return;
    setDialogError(null);
    setSending(true);
    setFeedbackProgress(0);
    const form = new FormData();
    form.set("kind", "revision");
    form.set("text", text);
    for (const entry of feedbackFiles.files) form.append("files", entry.file, entry.file.name);
    try {
      const { status: code, body } = await postFeedback(target._id, form, setFeedbackProgress);
      if (code < 200 || code >= 300) {
        setDialogError([body.message, ...(body.errors ?? [])].filter(Boolean).join(" — "));
        return;
      }
      setDialog(null);
      setFeedbackText("");
      feedbackFiles.clear();
      setNotice(
        target.status === "revision_requested"
          ? "Feedback sent."
          : targetElsewhere
            ? `Revision requested for “${target.title}” — the team will make the changes.`
            : "Revision requested — the team will make the changes.",
      );
      refresh();
    } catch {
      setDialogError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
      setFeedbackProgress(null);
    }
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
          <h1 className="text-[28px] leading-tight font-bold text-[#0b0c24]">{item.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[#4b5563]">
            <StatusBadge status={status} />
            {revisionNote ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#f3f4f6] px-2.5 py-1 text-[10.5px] font-medium text-[#4b5260]">
                <RotateCcw size={11} strokeWidth={2.25} /> {revisionNote}
              </span>
            ) : null}
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

      {item.sentReason ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-[#f1dfbf] bg-[#fdf6ea] px-4 py-3 text-[12px] text-[#7a4b0f]">
          <Mail size={15} strokeWidth={2} className="mt-0.5 shrink-0" />
          <span>
            <b className="font-semibold">Sent outside the regular batch:</b> {item.sentReason}
          </span>
        </div>
      ) : null}

      {pieces.length > 1 ? <GroupPieces pieces={pieces} currentId={item._id} onApprove={(piece) => openDialog("approve", piece)} onRevise={(piece) => openDialog("feedback", piece)} /> : null}

      <div className="grid items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-4.5">
          {/* Where the page opens when a piece is reached from the Revisions list. A piece sent on its
              own has no group card to decide it from, so its buttons sit in this card's heading. */}
          <div id={REVIEW_ANCHOR} className="scroll-mt-4">
            <Card
              badge={type}
              title="Preview"
              aside={
                pieces.length > 1 ? undefined : (
                  <div className="flex items-center gap-2">
                    {awaitingTeam ? null : (
                      <button
                        type="button"
                        onClick={() => openDialog("feedback")}
                        disabled={busy}
                        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#e2e5e9] bg-white px-3 text-[11.5px] font-medium text-[#1f2530] hover:bg-[#f3f4f6] disabled:cursor-not-allowed"
                      >
                        <RotateCcw size={12} strokeWidth={2} />{" "}
                        {status === "revision_requested" ? "Add more feedback" : isApproved ? "Request for Revision" : "Request a Revision"}
                      </button>
                    )}
                    {isApproved ? null : (
                      <button
                        type="button"
                        onClick={() => openDialog("approve")}
                        disabled={busy}
                        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-[#16a34a] px-3 text-[11.5px] font-medium text-white hover:bg-[#15803d] disabled:cursor-not-allowed"
                      >
                        <Check size={13} strokeWidth={2.5} /> {status === "revision_requested" ? "Approve as it is" : "Approve"}
                      </button>
                    )}
                  </div>
                )
              }
            >
              <Preview item={item} />
            </Card>
          </div>

          <TextAndDetails
            item={item}
            extras={extras}
            editable={!isApproved}
            onSaved={() => {
              setNotice("Your caption and tags are saved — BayShore can see the change.");
              refresh();
            }}
          />

          {/* This piece's revisions only — the others sent with it list theirs on their own pages — and the way to ask for another. */}
          <RevisionHistory
            pieces={pieces}
            currentId={item._id}
            comments={comments}
            addMore={
              <MessageBox
                value={moreText}
                onChange={setMoreText}
                files={moreFiles}
                progress={moreProgress}
                error={moreError}
                onSend={addToRevision}
                placeholder="Missed something? Add it here…"
                label="Add to this revision"
              />
            }
            action={
              awaitingTeam ? null : (
                <button
                  type="button"
                  onClick={() => openDialog("feedback")}
                  disabled={busy}
                  className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#e2e5e9] bg-white px-3 text-[11.5px] font-medium text-[#1f2530] hover:border-[#2f5fd8] hover:text-[#2f5fd8] disabled:cursor-not-allowed"
                >
                  <RotateCcw size={12} strokeWidth={2} />{" "}
                  {status === "revision_requested" ? "Add more feedback" : isApproved ? "Request for Revision" : "Request a Revision"}
                </button>
              )
            }
          />
        </div>

        {/* Stays in view while the piece on the left is scrolled; on a short screen it scrolls on its own. */}
        <div className="flex flex-col gap-4.5 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pb-1">
          <Card
            badge={{ icon: MessagesSquare, ...BLUE }}
            title="Messages"
            divided
            aside={<span className="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-[10.5px] font-medium text-[#4b5260]">{thread.length}</span>}
          >
            {thread.length > 0 ? (
              <div ref={threadRef} className="-mr-1.5 flex h-60 flex-col gap-3.5 overflow-y-auto pr-1.5">
                {thread.map((entry, index) => {
                  // The client's side sits on the right, BayShore's on the left.
                  const fromClient = entry.author === "client";
                  const author = entry.name ?? personNameOf(entry.user) ?? (fromClient ? name : "BayShore");
                  return (
                    <div className={`flex flex-col ${fromClient ? "items-end" : "items-start"}`} key={`${entry.createdAt}-${index}`}>
                      <div className={`mb-1 flex max-w-full flex-wrap items-center gap-1.5 text-[10.5px] ${fromClient ? "justify-end" : ""}`}>
                        <span className="font-semibold text-[#0b0c24]">{author}</span>
                        {fromClient ? null : <span className="rounded bg-[#eceef1] px-1.5 py-px text-[9.5px] font-semibold text-[#4b5260]">BayShore</span>}
                        {entry.revision ? (
                          <span className="rounded bg-[#f8dcdc] px-1.5 py-px text-[9.5px] font-semibold text-[#b91c1c]">
                            {entry.asks ? "Revision request" : "Revision"} {entry.revision}
                          </span>
                        ) : null}
                        {/* Which piece of the group the message is about; another piece's opens it. */}
                        {pieces.length < 2 ? null : entry.piece._id === item._id ? (
                          <span className="rounded bg-[#eceef1] px-1.5 py-px text-[9.5px] font-semibold text-[#4b5260]">Piece {entry.at + 1} · this piece</span>
                        ) : (
                          <Link
                            href={`/content/${entry.piece._id}`}
                            title={entry.piece.title}
                            className="max-w-44 truncate rounded bg-[#eceef1] px-1.5 py-px text-[9.5px] font-semibold text-[#4b5260] no-underline hover:bg-[#d9e0ef] hover:text-[#2f5fd8]"
                          >
                            Piece {entry.at + 1} · {entry.piece.title}
                          </Link>
                        )}
                        <span className="text-[#9ca3af]">
                          <DateTime iso={entry.createdAt} />
                        </span>
                      </div>
                      {entry.text ? (
                        <div
                          className={`max-w-[88%] rounded-2xl px-3.5 py-2 text-[12.5px] leading-normal whitespace-pre-line wrap-anywhere ${
                            fromClient ? "rounded-tr-sm bg-[#2f5fd8] text-white" : "rounded-tl-sm bg-[#f1f2f4] text-[#374151]"
                          }`}
                        >
                          {entry.text}
                        </div>
                      ) : null}
                      {entry.attachments?.length ? (
                        <div className={`mt-1.5 flex flex-wrap gap-2 ${fromClient ? "justify-end" : ""}`}>
                          {entry.attachments.map((file) => (
                            <AttachmentView key={file.url} file={file} />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-60 flex-col items-center justify-center text-center">
                {/* A chat bubble with its three dots rising in turn, as if a message is on its way. */}
                <span aria-hidden="true" className="mb-3 flex h-9 w-14 items-center justify-center gap-1.5 rounded-2xl rounded-bl-sm border-[1.5px] border-[#cfd4db]">
                  {[0, 180, 360].map((delay) => (
                    <span
                      key={delay}
                      className="h-1.5 w-1.5 animate-[typing-dot_1.3s_ease-in-out_infinite] rounded-full bg-[#9aa3af] motion-reduce:animate-none"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </span>
                <div className="text-[13px] font-semibold text-[#0b0c24]">No messages yet</div>
                <div className="mt-1 text-[12px] text-[#6b7280]">Say hello to your BayShore team.</div>
              </div>
            )}

            {/* The message box: a plain message. Asking for changes is a decision, made elsewhere on the page. */}
            <div className="mt-3.5 border-t border-[#eef0f2] pt-3.5">
              <MessageBox
                value={messageText}
                onChange={setMessageText}
                files={messageFiles}
                progress={messageProgress}
                error={messageError}
                onSend={sendMessage}
                placeholder="Type a message"
                label="Message"
              />
              <p className="mt-2 px-1 text-[11px] leading-normal text-[#6b7280]">
                {awaitingTeam ? (
                  "Your revision request is with BayShore."
                ) : (
                  <>
                    Need changes? Use{" "}
                    <b className="font-semibold">
                      {status === "revision_requested" ? "Add more feedback" : isApproved ? "Request for Revision" : "Request a Revision"}
                    </b>
                    .
                  </>
                )}
              </p>
            </div>
          </Card>

          <Card badge={{ icon: Info, ...GRAY }} title="Details">
            <DetailRow icon={Layers} label="Type">
              {batchTypeLabelOf(item)}
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
            <DetailRow icon={RotateCcw} label="Revisions">
              {revisions}
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

      {dialog === "approve" ? (
        <ReviewDialog
          tone="approve"
          heading="Approve this piece?"
          title={target.title}
          description="This tells BayShore the piece is ready to publish. You can still request a revision later if something needs changing."
          noteLabel="Message"
          notePlaceholder="Anything you'd like the team to know…"
          confirmLabel="Yes, approve"
          busyLabel="Approving…"
          note={approveNote}
          onNote={setApproveNote}
          busy={approving}
          error={dialogError}
          onConfirm={approve}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {dialog === "feedback" ? (
        <ReviewDialog
          tone="revision"
          heading={target.status === "revision_requested" ? "Add more feedback" : "Request a revision?"}
          title={target.title}
          description={
            target.status === "revision_requested"
              ? `This piece is already in revision — this adds to your feedback${targetRevisions > 0 ? ` for revision ${targetRevisions}` : ""}.`
              : target.status === "approved"
                ? `This reopens the approved piece: it goes back to BayShore and starts revision ${targetRevisions + 1}. Tell the team what to change.`
                : `This sends the piece back to BayShore and starts revision ${targetRevisions + 1}. Tell the team what to change.`
          }
          noteLabel="What should change?"
          noteRequired
          notePlaceholder="Describe the changes you'd like…"
          hint={`Attach up to ${MAX_ATTACHMENTS} images, videos or documents — pick them, paste them, or drop them here.`}
          wide
          confirmLabel={target.status === "revision_requested" ? "Send feedback" : "Request revision"}
          confirmDisabled={!feedbackText.trim() && feedbackFiles.files.length === 0}
          busyLabel={feedbackFiles.files.length && (feedbackProgress ?? 0) < 100 ? `Uploading ${feedbackProgress ?? 0}%` : "Sending…"}
          note={feedbackText}
          onNote={setFeedbackText}
          onFiles={feedbackFiles.add}
          busy={sending}
          error={dialogError}
          onConfirm={sendFeedback}
          onClose={() => setDialog(null)}
        >
          <div className="mt-2.5 flex flex-col gap-2">
            {feedbackFiles.files.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {feedbackFiles.files.map((file) => (
                  <PendingChip key={file.id} file={file} disabled={sending} onRemove={() => feedbackFiles.remove(file.id)} />
                ))}
              </div>
            ) : null}
            <AttachmentPickers onPick={feedbackFiles.add} disabled={feedbackFiles.full || sending} />
            {feedbackFiles.error ? <div className="text-[11px] font-medium text-[#b91c1c]">{feedbackFiles.error}</div> : null}
          </div>
        </ReviewDialog>
      ) : null}
    </div>
  );
};

export default ContentDetails;
