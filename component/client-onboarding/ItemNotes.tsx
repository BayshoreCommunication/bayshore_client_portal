"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, MessageSquareWarning, Send } from "lucide-react";
import type { OnboardingComment } from "@/app/actions/onboarding";
import { Files, initialsOf, sendWithProgress, timeOf } from "./StepComments";

// On one item of the onboarding form: what the BayShore team asked the client to fix on just this
// item (company-portal: ItemComments), and the client's answers — written right here. Each is an
// onboarding comment on the step, with the item named, so it shows in the step's comments too.

const MAX_LENGTH = 1000;

type Props = {
  // The step it is on ("social"), and the item as the team's controls name it ("social.facebook").
  step: string;
  item: { id: string; label: string };
  comments: OnboardingComment[];
  // The team asked them to update it, and that is still to do (backend: onboarding.updateAsked).
  asked: boolean;
  // The team has approved the item since: the notes stay, but no longer ask for anything.
  approved: boolean;
  name: string;
  onPosted: (comment: OnboardingComment) => void;
};

const ItemNotes = ({ step, item, comments, asked, approved, name, onPosted }: Props) => {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!comments.some((comment) => comment.side === "team")) return null;

  const waiting = asked && !approved;
  const ready = draft.trim() !== "" && !sending;

  const post = async () => {
    if (!ready) return;
    setSending(true);
    setError(null);
    setDone(false);
    const form = new FormData();
    form.append("step", step);
    form.append("item", item.id);
    form.append("itemLabel", item.label);
    form.append("text", draft.trim());
    try {
      const { ok, body } = await sendWithProgress("/api/onboarding/comments", form, () => undefined);
      if (!ok || !body?.data) {
        setError(body?.message || "Couldn't send your reply. Please try again.");
        return;
      }
      onPosted(body.data as OnboardingComment);
      setDraft("");
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`mb-3 overflow-hidden rounded-xl border ${waiting ? "border-[#fcd98f] bg-[#fffbeb]" : "border-[#e6e8eb] bg-[#fafbfc]"}`}>
      <div className="flex items-center gap-2.5 px-3.5 pt-3">
        <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${waiting ? "bg-[#fef3c7] text-[#b45309]" : "bg-[#eef0f3] text-[#6b7280]"}`}>
          {waiting ? <MessageSquareWarning size={15} strokeWidth={2} /> : <CheckCircle2 size={15} strokeWidth={2} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-[#0b0c24]">{waiting ? "BayShore asked you to update this" : approved ? "Sorted. Thank you!" : "Submitted. We'll check it."}</div>
          {waiting ? <div className="text-[11.5px] text-[#92400e]">Make the change below and save, or reply here to let us know.</div> : null}
        </div>
      </div>

      <ul className="flex list-none flex-col gap-2.5 px-3.5 pt-3">
        {comments.map((comment) => {
          const team = comment.side === "team";
          return (
            <li key={comment._id} className="flex gap-2.5">
              <span className={`grid size-6.5 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white ${team ? "bg-[#b45309]" : "bg-[#0b0c24]"}`}>
                {team ? initialsOf(comment.authorName, "B") : initialsOf(comment.authorName || name, "Y")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-1.5 text-[12px]">
                  <span className="font-semibold text-[#0b0c24]">{team ? comment.authorName : "You"}</span>
                  {team ? <span className="rounded bg-[#fef3c7] px-1.5 py-px text-[9.5px] font-semibold tracking-wide text-[#92400e] uppercase">BayShore team</span> : null}
                  <span className="text-[11px] text-[#9ca3af]">{timeOf(comment.createdAt)}</span>
                </div>
                {comment.text ? (
                  <p className={`mt-0.5 rounded-lg rounded-tl-sm px-3 py-2 text-[12.5px] leading-normal break-words whitespace-pre-wrap text-[#1f2530] ${team ? "bg-white ring-1 ring-[#fde2b3]" : "bg-[#f1f3f5]"}`}>
                    {comment.text}
                  </p>
                ) : null}
                <Files files={comment.files} />
                {comment.replies.map((reply) => (
                  <div key={reply._id} className="mt-2 border-l-2 border-[#fde2b3] pl-2.5">
                    <div className="flex flex-wrap items-baseline gap-x-1.5 text-[11.5px]">
                      <span className="font-semibold text-[#0b0c24]">{reply.authorName}</span>
                      <span className="text-[10.5px] text-[#9ca3af]">{timeOf(reply.createdAt)}</span>
                    </div>
                    {reply.text ? <p className="mt-0.5 text-[12px] leading-normal break-words whitespace-pre-wrap text-[#1f2530]">{reply.text}</p> : null}
                    <Files files={reply.files} />
                  </div>
                ))}
              </div>
            </li>
          );
        })}
      </ul>

      {approved ? (
        <div className="h-3" />
      ) : (
        <div className="p-3.5">
          <div className="flex items-end gap-2 rounded-lg border border-[#e2e5e9] bg-white p-1.5 pl-3 focus-within:border-[#f59e0b] focus-within:ring-3 focus-within:ring-[#f59e0b]/15">
            <textarea
              rows={1}
              value={draft}
              maxLength={MAX_LENGTH}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  void post();
                }
              }}
              placeholder="Reply to BayShore…"
              aria-label={`Reply about ${item.label}`}
              className="block min-h-8 w-full resize-none bg-transparent py-1.5 text-[12.5px] text-[#1f2530] outline-none placeholder:text-[#9ca3af]"
            />
            <button
              type="button"
              onClick={() => void post()}
              disabled={!ready}
              className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-[#0b0c24] px-3 text-[12px] font-semibold text-white transition-colors hover:bg-[#1e2140] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} strokeWidth={2.25} />} {sending ? "Sending…" : "Reply"}
            </button>
          </div>
          {done ? (
            <p role="status" className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#15803d]">
              <CheckCircle2 size={13} strokeWidth={2.5} /> Sent to BayShore.
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="mt-2 text-[12px] font-medium text-[#b42318]">
              {error}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ItemNotes;
