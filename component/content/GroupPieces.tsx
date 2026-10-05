"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import type { ContentPiece } from "@/app/actions/content";
import { CONTENT_STATUSES, typeOf } from "./contentUi";

// ── Where a click on a piece is heading ──────────────────────────────────────

// Stepping from one piece of a group to another is a page change, and the new page's
// loading screen knows nothing about the group. So the card says where it is going just
// before it goes: the loading screen reads that and keeps the card on screen, with the
// piece being opened already marked. The piece's page forgets it once it has arrived.
type Heading = { pieces: ContentPiece[]; targetId: string };

let heading: Heading | null = null;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const tell = () => listeners.forEach((listener) => listener());

const rememberPieces = (pieces: ContentPiece[], targetId: string) => {
  heading = { pieces, targetId };
  tell();
};

export const forgetPieces = () => {
  if (!heading) return;
  heading = null;
  tell();
};

// The group being stepped through and the piece being opened — or null when a piece was
// reached some other way (the list, a notification, a link).
export const useHeadingPieces = () =>
  useSyncExternalStore(
    subscribe,
    () => heading,
    () => null,
  );

// ── The card ─────────────────────────────────────────────────────────────────

// The step buttons beside the pieces: a link when there is a piece that way, greyed out when not.
const stepClass = "inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-[12px] font-medium no-underline";
const StepLink = ({ piece, onGo, children }: { piece?: ContentPiece; onGo: (piece: ContentPiece) => void; children: ReactNode }) =>
  piece ? (
    <Link
      href={`/content/${piece._id}`}
      onClick={() => onGo(piece)}
      className={`${stepClass} border-[#cfd8ea] bg-white text-[#1f2530] hover:border-[#2f5fd8] hover:text-[#2f5fd8]`}
    >
      {children}
    </Link>
  ) : (
    <span aria-disabled="true" className={`${stepClass} cursor-default border-[#e6e8eb] bg-white/60 text-[#b4bac4]`}>
      {children}
    </span>
  );

// When BayShore sends several pieces together, this sits at the top of each one's page and
// says so plainly: how many there are, which one is on screen, how many are approved — and
// a tile per piece to open it. Not shown for a piece sent alone.
//
// Moving to another piece is remembered (see above), so that piece's loading screen can keep
// this card where it is and put a skeleton only where the piece itself will appear.
const GroupPieces = ({ pieces, currentId }: { pieces: ContentPiece[]; currentId: string }) => {
  const position = pieces.findIndex((piece) => piece._id === currentId);
  const approved = pieces.filter((piece) => piece.status === "approved").length;
  const go = (piece: ContentPiece) => rememberPieces(pieces, piece._id);

  return (
    <section
      aria-label="Pieces in this content"
      className="overflow-hidden rounded-2xl border border-[#c5d3f0] bg-[linear-gradient(135deg,#e9f0fd_0%,#f6f9ff_45%,#ffffff_100%)] shadow-[0_2px_8px_rgba(47,95,216,0.08)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 pt-5">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2f5fd8] text-white shadow-[0_4px_10px_rgba(47,95,216,0.3)]">
            <Layers size={22} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <div className="text-[16px] leading-tight font-bold text-[#0b0c24]">This content has {pieces.length} pieces</div>
            <div className="mt-1 text-[12px] text-[#4b5563]">
              You&apos;re viewing <b className="font-semibold text-[#0b0c24]">piece {position + 1} of {pieces.length}</b>. Open each one to review it —
              every piece is approved on its own.
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="w-36">
            <div className="mb-1.5 flex items-baseline justify-between text-[11px] text-[#4b5563]">
              <span>Approved</span>
              <span className="font-semibold text-[#0b0c24]">
                {approved} of {pieces.length}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[#cfe6d6]">
              <div className="h-1.5 rounded-full bg-[#16a34a]" style={{ width: `${(approved / pieces.length) * 100}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StepLink piece={pieces[position - 1]} onGo={go}>
              <ChevronLeft size={14} strokeWidth={2.25} /> Previous
            </StepLink>
            <StepLink piece={pieces[position + 1]} onGo={go}>
              Next <ChevronRight size={14} strokeWidth={2.25} />
            </StepLink>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
        {pieces.map((piece, index) => {
          const kind = typeOf(piece);
          const state = CONTENT_STATUSES[piece.status];
          const current = piece._id === currentId;
          return (
            <Link
              key={piece._id}
              href={`/content/${piece._id}`}
              onClick={() => go(piece)}
              aria-current={current ? "page" : undefined}
              className={`group relative flex items-center gap-3 rounded-xl border bg-white p-3 text-inherit no-underline transition-shadow ${
                current
                  ? "border-[#2f5fd8] shadow-[0_0_0_3px_rgba(47,95,216,0.14)]"
                  : "border-[#e2e5e9] hover:border-[#9db3e6] hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
              }`}
            >
              {/* The piece's first image when it has one, otherwise its kind's icon — numbered either way. */}
              <span className="relative shrink-0">
                {piece.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={piece.thumbnail} alt="" className="h-14 w-14 rounded-lg bg-[#f3f4f6] object-cover" />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-lg" style={{ background: kind.background, color: kind.color }}>
                    <kind.icon size={22} strokeWidth={1.9} />
                  </span>
                )}
                <span
                  className={`absolute -top-1.5 -left-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white px-1 text-[10px] font-bold text-white ${
                    current ? "bg-[#2f5fd8]" : "bg-[#0b0c24]"
                  }`}
                >
                  {index + 1}
                </span>
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[10.5px] font-medium tracking-[0.3px] text-[#6b7280] uppercase">
                  Piece {index + 1} · {kind.label}
                </span>
                <span className="mt-0.5 block truncate text-[13px] font-semibold text-[#0b0c24]">{piece.title}</span>
                <span
                  className="mt-1.5 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: state.background, color: state.color }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: state.dot }} />
                  {state.label}
                </span>
              </span>

              {current ? (
                <span className="shrink-0 rounded-md bg-[#2f5fd8] px-2 py-1 text-[10px] font-semibold text-white">Viewing</span>
              ) : (
                <ChevronRight size={17} strokeWidth={2.25} className="shrink-0 text-[#9ca3af] group-hover:text-[#2f5fd8]" />
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default GroupPieces;
