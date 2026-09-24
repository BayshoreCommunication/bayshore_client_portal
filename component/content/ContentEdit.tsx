"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, Clock, Flame, Leaf, MessageSquare, Paperclip, Send } from "lucide-react";
import type { ContentItem, ContentType } from "@/app/actions/content";
import { poppins } from "@/component/shared/fonts";
import { CONTENT_TYPES, personNameOf, shortDate } from "./contentUi";
import { AttachmentPickers, BLUE, Card, PendingChip, Preview, StatusBadge, cardClass, useAttachments } from "./contentParts";

// Quick picks for what needs changing, by kind of piece.
// Kinds not listed use the image post's choices.
const CHANGE_AREAS: Partial<Record<ContentType, string[]>> = {
  image: ["Text / caption", "Design / layout", "Photo / image", "Colors & branding", "Something else"],
  video: ["Caption", "Video edit / cuts", "Music / audio", "On-screen text", "Something else"],
  blog: ["Headline", "Wording / tone", "Facts / details", "Length", "Something else"],
};

const WHERE_HINTS: Partial<Record<ContentType, string>> = {
  image: "e.g. the headline at the top of the graphic",
  video: "e.g. at 0:12, the second clip",
  blog: "e.g. the second paragraph, under “Your rights”",
};

type Urgency = "flexible" | "week" | "urgent";

const URGENCY: { value: Urgency; label: string; sub: string; icon: typeof Leaf; color: string; background: string }[] = [
  { value: "flexible", label: "No rush", sub: "Whenever it fits the schedule", icon: Leaf, color: "#16a34a", background: "#d2e7d8" },
  { value: "week", label: "This week", sub: "Before it's due to go out", icon: Clock, color: "#d97706", background: "#f8e4c6" },
  { value: "urgent", label: "Urgent", sub: "Within 24 hours", icon: Flame, color: "#dc2626", background: "#f4d7db" },
];

const DETAILS_MAX = 1000;

const fieldLabel = "mb-1.5 block text-[12px] font-semibold text-[#0b0c24]";
const input =
  "w-full rounded-lg border border-[#e2e5e9] bg-white px-3 py-2.5 text-[12.5px] text-[#1f2530] outline-none placeholder:text-[#9ca3af] focus:border-[#2f5fd8] focus:ring-3 focus:ring-[#2f5fd8]/10";

const Step = ({ number, title, sub, children }: { number: number; title: string; sub?: string; children: React.ReactNode }) => (
  <div className="border-b border-[#eef0f2] py-5 first:pt-0 last:border-b-0 last:pb-0">
    <div className="mb-3 flex items-start gap-2.5">
      <span className="mt-px flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-[#0b0c24] text-[11px] font-semibold text-white">
        {number}
      </span>
      <div>
        <div className="text-[13px] font-semibold text-[#0b0c24]">{title}</div>
        {sub ? <div className="mt-0.5 text-[11.5px] text-[#6b7280]">{sub}</div> : null}
      </div>
    </div>
    <div className="pl-8">{children}</div>
  </div>
);

// The client asks BayShore to change a piece: what, where, how soon, with reference
// files if they help. Design preview — nothing is sent yet; the piece would move to
// "In Revision" once it is.
const ContentEdit = ({ item }: { item: ContentItem }) => {
  const [areas, setAreas] = useState<string[]>([]);
  const [details, setDetails] = useState("");
  const [where, setWhere] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("week");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const attachments = useAttachments();

  const type = CONTENT_TYPES[item.type] ?? CONTENT_TYPES.image;
  const creator = personNameOf(item.createdBy) ?? "BayShore Communication";
  const detailsHref = `/content/${item._id}`;
  const latestTeamNote = [...item.comments].reverse().find((comment) => comment.author === "team");

  const toggleArea = (area: string) =>
    setAreas((current) => (current.includes(area) ? current.filter((other) => other !== area) : [...current, area]));

  const submit = () => {
    if (!areas.length && !details.trim()) return setError("Pick what needs changing, or describe it below.");
    if (details.trim().length < 10) return setError("Add a few words about the change, so the team knows exactly what to do.");
    setError(null);
    setSent(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const header = (
    <div>
      <div className="mb-1 text-[12px] text-[#4b5260]">
        <Link href="/content" className="hover:underline">
          Content
        </Link>{" "}
        /{" "}
        <Link href={detailsHref} className="hover:underline">
          {item.title}
        </Link>{" "}
        / <span className="font-semibold text-[#0b0c24]">Request changes</span>
      </div>
      <h1 className="text-[28px] leading-tight font-bold text-[#0b0c24]">Request changes</h1>
      <div className="mt-1 text-[12.5px] text-[#4b5563]">
        Tell {creator} what to change. They&apos;ll update the piece and send it back for your approval.
      </div>
    </div>
  );

  // An approved piece is final.
  if (item.status === "approved") {
    return (
      <div className={`${poppins.className} flex flex-col gap-4.5`}>
        {header}
        <div className={`${cardClass} flex flex-col items-center px-6 py-12 text-center`}>
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d6eadb] text-[#16a34a]">
            <CheckCircle2 size={26} strokeWidth={1.75} />
          </span>
          <div className="text-[16px] font-semibold text-[#0b0c24]">This piece is already approved</div>
          <div className="mt-1.5 max-w-100 text-[12.5px] leading-normal text-[#4b5563]">
            Approved pieces are final. If something still needs to change, leave a comment on it and the team will get in touch.
          </div>
          <Link
            href={detailsHref}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#0b0c24] px-4.5 text-[12.5px] font-medium text-white no-underline hover:bg-[#1e2140]"
          >
            <ArrowLeft size={14} strokeWidth={2} /> Back to the piece
          </Link>
        </div>
      </div>
    );
  }

  if (sent) {
    const chosen = URGENCY.find((option) => option.value === urgency)!;
    return (
      <div className={`${poppins.className} flex flex-col gap-4.5`}>
        {header}
        <div className={`${cardClass} flex flex-col items-center px-6 py-12 text-center`}>
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#d6eadb] text-[#16a34a] ring-8 ring-[#d6eadb]/40">
            <Check size={30} strokeWidth={2.5} />
          </span>
          <div className="text-[18px] font-semibold text-[#0b0c24]">Change request sent</div>
          <div className="mt-1.5 max-w-110 text-[12.5px] leading-normal text-[#4b5563]">
            {creator} will update <b className="font-semibold text-[#0b0c24]">“{item.title}”</b> and send it back for your approval. It&apos;s
            now marked <b className="font-semibold text-[#b91c1c]">In Revision</b>.
          </div>

          <div className="mt-5 flex max-w-120 flex-wrap justify-center gap-1.5">
            {areas.map((area) => (
              <span key={area} className="rounded-full bg-[#eff6ff] px-2.5 py-1 text-[11px] font-medium text-[#1d4ed8]">
                {area}
              </span>
            ))}
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{ background: chosen.background, color: chosen.color }}
            >
              <chosen.icon size={11} strokeWidth={2.25} /> {chosen.label}
            </span>
            {attachments.files.length ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f4f6] px-2.5 py-1 text-[11px] font-medium text-[#4b5260]">
                <Paperclip size={11} strokeWidth={2.25} /> {attachments.files.length} file{attachments.files.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <Link
              href="/content"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e2e5e9] bg-white px-4 text-[12.5px] font-medium text-[#1f2530] no-underline hover:bg-[#f3f4f6]"
            >
              <ArrowLeft size={14} strokeWidth={2} /> Back to content
            </Link>
            <Link
              href={detailsHref}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0b0c24] px-4.5 text-[12.5px] font-medium text-white no-underline hover:bg-[#1e2140]"
            >
              View this piece
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${poppins.className} flex flex-col gap-4.5`}>
      {header}

      <div className="grid items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* The request */}
        <section className={`${cardClass} p-5.5`}>
          <Step number={1} title="What needs changing?" sub="Pick all that apply.">
            <div className="flex flex-wrap gap-2">
              {(CHANGE_AREAS[item.type] ?? CHANGE_AREAS.image ?? []).map((area) => {
                const on = areas.includes(area);
                return (
                  <button
                    key={area}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleArea(area)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.75 text-[12px] font-medium transition-colors ${
                      on ? "border-[#2f5fd8] bg-[#eff6ff] text-[#1d4ed8]" : "border-[#e2e5e9] bg-white text-[#4b5260] hover:border-[#9aa3af]"
                    }`}
                  >
                    {on ? <Check size={12} strokeWidth={3} /> : null}
                    {area}
                  </button>
                );
              })}
            </div>
          </Step>

          <Step number={2} title="Describe the changes" sub="Be as specific as you can — it saves a round of back-and-forth.">
            <textarea
              value={details}
              maxLength={DETAILS_MAX}
              onChange={(event) => {
                setDetails(event.target.value);
                setError(null);
              }}
              rows={5}
              placeholder="e.g. Please use our new phone number (813) 555-0142 and make the logo a little bigger."
              className={`${input} resize-y leading-relaxed`}
            />
            <div className="mt-1 text-right text-[10.5px] text-[#9ca3af]">
              {details.length}/{DETAILS_MAX}
            </div>

            <label className={`${fieldLabel} mt-3`} htmlFor="where">
              Where exactly? <span className="font-normal text-[#9ca3af]">(optional)</span>
            </label>
            <input
              id="where"
              type="text"
              value={where}
              onChange={(event) => setWhere(event.target.value)}
              placeholder={WHERE_HINTS[item.type] ?? WHERE_HINTS.image}
              className={input}
            />
          </Step>

          <Step number={3} title="How soon do you need it?">
            <div className="grid grid-cols-3 gap-2.5">
              {URGENCY.map((option) => {
                const on = urgency === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setUrgency(option.value)}
                    className={`flex cursor-pointer flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors ${
                      on ? "border-[#2f5fd8] bg-[#f5f9ff] shadow-[0_0_0_1px_#2f5fd8]" : "border-[#e2e5e9] bg-white hover:border-[#9aa3af]"
                    }`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: option.background, color: option.color }}>
                      <option.icon size={15} strokeWidth={2} />
                    </span>
                    <span>
                      <span className="block text-[12.5px] font-semibold text-[#0b0c24]">{option.label}</span>
                      <span className="block text-[10.5px] text-[#6b7280]">{option.sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Step>

          <Step number={4} title="Reference files" sub="Optional — a marked-up screenshot, a new photo, the right logo…">
            {attachments.files.length ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.files.map((file) => (
                  <PendingChip key={file.id} file={file} onRemove={() => attachments.remove(file.id)} />
                ))}
              </div>
            ) : null}
            <AttachmentPickers onPick={attachments.add} />
            {attachments.error ? <div className="mt-2 text-[11px] font-medium text-[#b91c1c]">{attachments.error}</div> : null}
          </Step>

          {error ? (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-[#f5c2c2] bg-[#fdecec] px-3.5 py-2.5 text-[12px] font-medium text-[#b42318]" role="alert">
              <AlertTriangle size={14} strokeWidth={2} className="shrink-0" /> {error}
            </div>
          ) : null}

          <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-[#eef0f2] pt-4.5">
            <Link
              href={detailsHref}
              className="inline-flex h-10 items-center rounded-lg px-4 text-[12.5px] font-medium text-[#4b5260] no-underline hover:bg-[#f3f4f6]"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={submit}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-[#2f5fd8] px-5 text-[12.5px] font-semibold text-white hover:bg-[#1d4ed8]"
            >
              <Send size={14} strokeWidth={2} /> Send change request
            </button>
          </div>
        </section>

        {/* What's being changed */}
        <aside className="flex flex-col gap-4.5 lg:sticky lg:top-4">
          <Card badge={type} title="You're reviewing">
            <Preview item={item} />
            <div className="mt-3.5 text-[13px] font-semibold text-[#0b0c24]">{item.title}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#6b7280]">
              <StatusBadge status={item.status} />
              <span className="rounded-md px-2 py-0.75 text-[10.5px] font-medium" style={{ background: type.background, color: type.color }}>
                {type.label}
              </span>
              <span>{item.isIndividual ? "Individual" : item.batchMonth}</span>
            </div>
            {item.caption ? <p className="mt-3 line-clamp-4 text-[12px] leading-relaxed text-[#4b5260]">{item.caption}</p> : null}
          </Card>

          {latestTeamNote ? (
            <Card badge={{ icon: MessageSquare, ...BLUE }} title="Latest note from the team">
              <div className="text-[11px] text-[#6b7280]">
                {latestTeamNote.name ?? personNameOf(latestTeamNote.user) ?? "BayShore"} · {shortDate(latestTeamNote.createdAt)}
              </div>
              <div className="mt-1.5 rounded-xl rounded-tl-sm bg-[#f5f6f8] px-3 py-2.5 text-[12px] leading-normal text-[#374151]">
                {latestTeamNote.text}
              </div>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
};

export default ContentEdit;
