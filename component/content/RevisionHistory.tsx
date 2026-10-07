import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock, MessageSquareText, RotateCcw } from "lucide-react";
import type { ContentComment, ContentPiece, ContentRevision } from "@/app/actions/content";
import { AttachmentView, Card, StatusBadge } from "./contentParts";
import { revisionsOf, typeOf } from "./contentUi";
import DateTime from "./DateTime";

// Where a piece's page opens when it is reached from here: at its preview — the image, video
// or document itself — rather than at the very top of the page. ContentDetails puts this id
// on the preview card.
export const REVIEW_ANCHOR = "review";

// Where one revision stands. Only a piece's latest can still be open: under way, or done and
// back with the client. An earlier one — or one the client closed by approving the piece as
// it was — is finished.
const stateOf = (revision: ContentRevision, latest: boolean, piece: ContentPiece) => {
  if (latest && piece.status === "revision_requested") return { label: "In progress", color: "#b91c1c", background: "#f8dcdc", dot: "#dc2626" };
  if (latest && piece.status === "pending_approval") {
    return { label: "Updated — waiting for your review", color: "#a35a12", background: "#fbecd3", dot: "#d99136" };
  }
  if (latest && piece.status === "approved" && !revision.submittedAt && revision.requests.length > 0) {
    return { label: "Closed — approved as it was", color: "#4b5260", background: "#eceef1", dot: "#9aa3af" };
  }
  return { label: "Completed", color: "#15803d", background: "#d6eadb", dot: "#16a34a" };
};

// One revision on a piece's timeline: its number on the line, what was asked for, then
// BayShore's answer once they have sent the piece back. `addMore` is the box for adding to it,
// shown while it is still under way.
const Revision = ({
  revision,
  latest,
  last,
  piece,
  addMore,
}: {
  revision: ContentRevision;
  latest: boolean;
  last: boolean;
  piece: ContentPiece;
  addMore?: ReactNode;
}) => {
  const state = stateOf(revision, latest, piece);
  const working = latest && piece.status === "revision_requested";

  return (
    <li className="relative pb-5 pl-9 last:pb-0">
      {/* The line down to the next (earlier) revision, and this one's number on it. */}
      {last ? null : <span aria-hidden="true" className="absolute top-7 bottom-0 left-[11px] w-px bg-[#e2e5e9]" />}
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 flex h-6 w-6 items-center justify-center rounded-full text-[10.5px] font-bold text-white"
        style={{ background: state.dot }}
      >
        {revision.number}
      </span>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-[#0b0c24]">Revision {revision.number}</span>
        <span className="rounded-md px-2 py-0.5 text-[10px] font-medium" style={{ background: state.background, color: state.color }}>
          {state.label}
        </span>
      </div>

      {/* What was asked for */}
      <div className="mt-2.5 rounded-xl border border-[#eceef1] bg-white p-3">
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.3px] text-[#6b7280] uppercase">
          <MessageSquareText size={12} strokeWidth={2} />
          {revision.requestedByName ? `${revision.requestedByName} asked for changes` : "Changes requested"}
          {revision.requestedAt ? (
            <span className="font-normal tracking-normal normal-case">
              · <DateTime iso={revision.requestedAt} />
            </span>
          ) : null}
        </div>
        {revision.requests.length > 0 ? (
          revision.requests.map((request, index) => (
            <div key={`${request.createdAt}-${index}`} className={index > 0 ? "mt-2.5 border-t border-[#f0f1f3] pt-2.5" : "mt-2"}>
              {index > 0 ? (
                <div className="mb-1 text-[10.5px] text-[#9ca3af]">
                  Added <DateTime iso={request.createdAt} />
                </div>
              ) : null}
              {request.text ? (
                <p className="text-[12.5px] leading-normal whitespace-pre-line text-[#374151] wrap-anywhere">{request.text}</p>
              ) : null}
              {request.attachments?.length ? (
                <div className={`flex flex-wrap gap-2 ${request.text ? "mt-2" : ""}`}>
                  {request.attachments.map((file) => (
                    <AttachmentView key={file.url} file={file} />
                  ))}
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <p className="mt-2 text-[12px] text-[#6b7280]">No note was left with this request.</p>
        )}
      </div>

      {/* What BayShore has said back so far, with anything they attached */}
      {revision.responses?.map((response, index) => (
        <div key={`${response.createdAt}-${index}`} className="mt-2 rounded-xl border border-[#d3e0f8] bg-[#f3f7fe] p-3">
          <div className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.3px] text-[#2f5fd8] uppercase">
            <MessageSquareText size={12} strokeWidth={2} />
            BayShore&apos;s update
            <span className="font-normal tracking-normal normal-case">
              · <DateTime iso={response.createdAt} />
              {response.name ? ` · ${response.name}` : ""}
            </span>
          </div>
          {response.text ? <p className="mt-2 text-[12.5px] leading-normal whitespace-pre-line text-[#374151] wrap-anywhere">{response.text}</p> : null}
          {response.attachments?.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {response.attachments.map((file) => (
                <AttachmentView key={file.url} file={file} />
              ))}
            </div>
          ) : null}
        </div>
      ))}

      {/* Still under way: room to add whatever was left out, without asking again. */}
      {working && addMore ? <div className="mt-2">{addMore}</div> : null}

      {/* BayShore's answer — or that it is still on its way */}
      {revision.submittedAt ? (
        <div className="mt-2 rounded-xl border border-[#d3e0f8] bg-[#f3f7fe] p-3">
          <div className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.3px] text-[#2f5fd8] uppercase">
            <CheckCircle2 size={12} strokeWidth={2.25} />
            BayShore sent the revised piece
            <span className="font-normal tracking-normal normal-case">
              · <DateTime iso={revision.submittedAt} />
              {revision.submittedByName ? ` · ${revision.submittedByName}` : ""}
            </span>
          </div>
          {revision.note ? (
            <p className="mt-2 text-[12.5px] leading-normal whitespace-pre-line text-[#374151] wrap-anywhere">{revision.note}</p>
          ) : null}
        </div>
      ) : working ? (
        <div className="mt-2 flex items-center gap-1.5 px-1 text-[11.5px] text-[#6b7280]">
          <Clock size={12} strokeWidth={2} /> BayShore is working on this.
        </div>
      ) : null}
    </li>
  );
};

// The revisions of the piece on screen: which piece it is (its picture, number, kind, title
// and status), then a timeline of its revisions, newest first — what the client asked for and
// what BayShore sent back. The others sent with it keep theirs on their own pages. The heading
// goes up to the preview. `action` is the button that asks for another revision, and `addMore`
// the box kept open under the revision under way.
const RevisionHistory = ({
  pieces,
  currentId,
  comments,
  action,
  addMore,
}: {
  pieces: ContentPiece[];
  currentId: string;
  // The piece's comments — its revisions are read from them when it has no record of its own.
  comments: ContentComment[];
  action?: ReactNode;
  addMore?: ReactNode;
}) => {
  const index = Math.max(0, pieces.findIndex((piece) => piece._id === currentId));
  const piece = pieces[index];
  const revisions = revisionsOf(piece, comments);
  const kind = typeOf(piece);

  // Slide up to the preview instead of jumping.
  const toPreview = (event: MouseEvent) => {
    const target = document.getElementById(REVIEW_ANCHOR);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Card
      badge={{ icon: RotateCcw, color: "#b91c1c", background: "#f8dcdc" }}
      title="Revisions"
      aside={
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-[10.5px] font-medium text-[#4b5260]">{revisions.length}</span>
          {action}
        </div>
      }
    >
      <section className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-[#fafbfc]">
        {/* Which piece — the whole heading goes up to its preview. */}
        <Link
          href={`#${REVIEW_ANCHOR}`}
          onClick={toPreview}
          className="group flex items-center gap-3 border-b border-[#eceef1] bg-white px-3.5 py-3 text-inherit no-underline hover:bg-[#f7f9fd]"
        >
          {piece.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={piece.thumbnail} alt="" className="h-11 w-11 shrink-0 rounded-lg bg-[#f3f4f6] object-cover" />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg" style={{ background: kind.background, color: kind.color }}>
              <kind.icon size={19} strokeWidth={1.9} />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[10.5px] font-medium tracking-[0.3px] text-[#6b7280] uppercase">
              {pieces.length > 1 ? `Piece ${index + 1} · ` : ""}
              {kind.label}
            </span>
            <span className="mt-0.5 block truncate text-[13.5px] font-semibold text-[#0b0c24] group-hover:text-[#2f5fd8]">{piece.title}</span>
          </span>
          <StatusBadge status={piece.status} />
          <span className="inline-flex shrink-0 items-center gap-1 text-[11.5px] font-medium text-[#6b7280] group-hover:text-[#2f5fd8]">
            View <ArrowUpRight size={13} strokeWidth={2.25} />
          </span>
        </Link>

        <div className="p-4">
          {revisions.length > 0 ? (
            <ol className="list-none">
              {revisions.map((revision, position) => (
                <Revision
                  key={revision.number}
                  revision={revision}
                  latest={position === 0}
                  last={position === revisions.length - 1}
                  piece={piece}
                  addMore={addMore}
                />
              ))}
            </ol>
          ) : (
            <p className="text-[12.5px] text-[#6b7280]">No revisions requested yet.</p>
          )}
        </div>
      </section>
    </Card>
  );
};

export default RevisionHistory;
