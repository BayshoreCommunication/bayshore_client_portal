"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import GroupPieces, { useHeadingPieces } from "@/component/content/GroupPieces";
import { StatusBadge } from "@/component/content/contentParts";
import { typeOf } from "@/component/content/contentUi";
import { poppins } from "@/component/shared/fonts";

// A single piece's shape while it loads — same heading, preview, text, comments and side
// cards as component/content/ContentDetails.tsx, so nothing jumps when it arrives.
// Without this file, a piece would borrow the list's skeleton from ../loading.tsx.
//
// Stepping between the pieces of a group is the special case: the group's card and the
// piece's title are already known, so they stay as they are and only the piece itself —
// what is really still loading — is a skeleton.

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";

// Each bone pulses a little after the one before it, so the page shimmers top to
// bottom instead of blinking all at once.
const Bone = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <div className={`animate-pulse rounded-md bg-[#eceef1] ${className}`} style={{ animationDelay: delay ? `${delay}ms` : undefined }} />
);

// A section: icon + title header, then the body.
const Card = ({ delay, aside = false, children }: { delay: number; aside?: boolean; children: React.ReactNode }) => (
  <div className={cardClass}>
    <div className="flex items-center justify-between gap-3 px-5 pt-4.5">
      <div className="flex items-center gap-3">
        <Bone className="h-8 w-8 shrink-0 rounded-lg" delay={delay} />
        <Bone className="h-3.5 w-28" delay={delay} />
      </div>
      {aside ? <Bone className="h-6 w-20" delay={delay} /> : null}
    </div>
    <div className="px-5 pt-4 pb-5">{children}</div>
  </div>
);

const ContentPieceLoading = () => {
  const pathname = usePathname();
  const heading = useHeadingPieces();
  // Only when it is this page that a group's card sent us to.
  const group = heading && pathname.endsWith(`/${heading.targetId}`) ? heading : null;
  const piece = group?.pieces.find((entry) => entry._id === group.targetId);
  const kind = piece ? typeOf(piece) : null;

  return (
    <div className={`${poppins.className} flex flex-col gap-4.5`} role="status" aria-live="polite" aria-label="Loading content">
      <div className="flex flex-wrap items-end justify-between gap-4">
        {piece && kind ? (
          <div className="min-w-0">
            <h1 className="text-[28px] leading-tight font-bold text-[#0b0c24]">{piece.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={piece.status} />
              <span className="rounded-md px-2.5 py-1 text-[10.5px] font-medium" style={{ background: kind.background, color: kind.color }}>
                {kind.label}
              </span>
              <Bone className="h-3 w-72 max-w-full" />
            </div>
          </div>
        ) : (
          <div>
            <Bone className="h-8 w-96 max-w-full" />
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <Bone className="h-5.5 w-28" />
              <Bone className="h-5.5 w-20" />
              <Bone className="h-3 w-72 max-w-full" />
            </div>
          </div>
        )}
        {group ? (
          <Link
            href="/content"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e2e5e9] bg-white px-4 text-[12.5px] font-medium text-[#1f2530] no-underline shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-[#f9fafb]"
          >
            <ArrowLeft size={14} strokeWidth={2} /> Content List
          </Link>
        ) : (
          <Bone className="h-10 w-34 rounded-lg bg-white" />
        )}
      </div>

      {group ? <GroupPieces pieces={group.pieces} currentId={group.targetId} /> : null}

      <div className="grid items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="flex flex-col gap-4.5">
          {/* Preview: the image, video or document. */}
          <Card delay={80}>
            <Bone className="h-90 w-full rounded-xl" delay={140} />
          </Card>

          {/* Text & Details: the caption and its tags. */}
          <Card delay={220} aside>
            {["w-full", "w-11/12", "w-3/5"].map((width, index) => (
              <Bone key={index} className={`${index ? "mt-3" : ""} h-3 ${width}`} delay={260 + index * 50} />
            ))}
            <div className="mt-4 flex gap-2">
              <Bone className="h-6 w-18" delay={420} />
              <Bone className="h-6 w-24" delay={420} />
              <Bone className="h-6 w-16" delay={420} />
            </div>
          </Card>

          {/* Comments: two in the thread, then the box to write one. */}
          <Card delay={480} aside>
            <div className="flex flex-col gap-4">
              {[0, 1].map((row) => (
                <div key={row} className="flex gap-3">
                  <Bone className="h-8 w-8 shrink-0 rounded-full" delay={520 + row * 80} />
                  <div className="flex-1">
                    <Bone className="h-3 w-40" delay={520 + row * 80} />
                    <Bone className={`mt-2 h-10 rounded-xl ${row ? "w-1/2" : "w-2/3"}`} delay={520 + row * 80} />
                  </div>
                </div>
              ))}
            </div>
            <Bone className="mt-5 h-24 w-full rounded-xl" delay={700} />
          </Card>
        </div>

        <div className="flex flex-col gap-4.5">
          {/* Your Review: the status, a line about it, and the two buttons. */}
          <Card delay={160}>
            <div className="flex items-center justify-between">
              <Bone className="h-3 w-12" delay={200} />
              <Bone className="h-5.5 w-28" delay={200} />
            </div>
            <Bone className="mt-4 h-3 w-full" delay={240} />
            <Bone className="mt-2 h-3 w-4/5" delay={240} />
            <Bone className="mt-5 h-10 w-full rounded-lg bg-[#d9dce1]" delay={300} />
            <Bone className="mt-2 h-10 w-full rounded-lg" delay={340} />
          </Card>

          {/* Details: type, batch, sent, sent by. */}
          <Card delay={380}>
            {Array.from({ length: 4 }, (_, row) => (
              <div key={row} className="flex items-center justify-between gap-3 border-b border-[#eef0f2] py-3 first:pt-0 last:border-b-0 last:pb-0">
                <Bone className="h-3 w-16" delay={420 + row * 60} />
                <Bone className="h-3 w-24" delay={420 + row * 60} />
              </div>
            ))}
          </Card>
        </div>
      </div>
      <span className="sr-only">Loading content…</span>
    </div>
  );
};

export default ContentPieceLoading;
