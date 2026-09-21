"use client";

import { useState } from "react";
import { FileText, Mail, Play, Plus } from "lucide-react";
import { UserBadge, useSessionUser } from "@/component/shared/SessionUser";
import StatusPill from "@/component/shared/StatusPill";
import { useLocalStore } from "@/lib/local-store";
import {
  INDIVIDUAL_CONTENT,
  MONTH_OPTIONS,
  contentBatches,
  type ContentComment,
  type ContentItem,
} from "./data";

type ItemState = {
  status: "approved" | "revision";
  approvedOn?: string;
  comments?: ContentComment[];
};

const INITIAL_STATE: Record<string, ItemState> = {};

const todayLabel = () =>
  new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const shortToday = () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

const ApprovalItem = ({
  item,
  state,
  onApprove,
  onRequestEdit,
}: {
  item: ContentItem;
  state?: ItemState;
  onApprove: () => void;
  onRequestEdit: (comment: string) => void;
}) => {
  const { name, initials } = useSessionUser();
  const [comment, setComment] = useState("");
  const [missingComment, setMissingComment] = useState(false);

  const isApproved = item.status === "approved" || state?.status === "approved";
  const status = isApproved ? "approved" : state?.status === "revision" ? "revision" : "waiting";
  const comments = [...(item.comments ?? []), ...(state?.comments ?? [])];
  const approvedFooter = item.approvedFooter ?? `Approved by ${name} on ${state?.approvedOn ?? todayLabel()}`;

  const submitEdit = () => {
    if (!comment.trim()) {
      setMissingComment(true);
      return;
    }
    onRequestEdit(comment.trim());
    setComment("");
    setMissingComment(false);
  };

  return (
    <div className="approval-item">
      <div className="approval-item-header">
        <div>
          <div className="approval-title">{item.title}</div>
          <div className="approval-meta">{item.meta}</div>
        </div>
        <StatusPill status={status} />
      </div>

      {item.sentReason ? (
        <div
          className="reassigned-note"
          style={{ marginLeft: 0, marginTop: 2, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}
        >
          <Mail size={13} strokeWidth={2} /> Sent outside the regular batch: {item.sentReason}
        </div>
      ) : null}

      <div className="approval-body">
        {item.type === "image" ? (
          <>
            <div className="approval-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.img} alt={item.imgAlt} />
            </div>
            <div>
              <p className="approval-caption">{item.caption}</p>
              <div className="tag-row">
                {item.tags.map((tag) => (
                  <span className="tag-chip" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {item.type === "video" ? (
          <>
            <div className="approval-media video-tile">
              <div className="video-play">
                <Play size={22} strokeWidth={2} fill="currentColor" />
              </div>
            </div>
            <div>
              <p className="approval-caption">{item.caption}</p>
              <div className="tag-row">
                {item.tags.map((tag) => (
                  <span className="tag-chip" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {item.type === "blog" ? (
          <>
            <div
              className="doc-card"
              style={{ minHeight: 150, alignItems: "flex-start", flexDirection: "column", justifyContent: "center" }}
            >
              <div className="doc-icon" style={{ width: 40, height: 40 }}>
                <FileText size={18} strokeWidth={2} />
              </div>
              <div>
                <div className="doc-name">{item.docName}</div>
                <div className="doc-size">Google Doc</div>
              </div>
            </div>
            <div className="blog-doc-card">
              <div className="blog-doc-title">{item.docTitle}</div>
              <a className="blog-doc-link" href={item.docLink} target="_blank" rel="noopener noreferrer">
                {item.docLink?.replace("https://", "")}
              </a>
              <div className="tag-row">
                {item.tags.map((tag) => (
                  <span className="tag-chip" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {comments.length > 0 ? (
        <div className="comment-thread">
          {comments.map((entry, index) => (
            <div className="comment-row" key={`${entry.date}-${index}`}>
              <div className={`comment-avatar ${entry.author === "client" ? "blue" : "dark"}`}>
                {entry.author === "client" ? initials : (entry.name ?? "B")[0]}
              </div>
              <div>
                <div className="comment-name">
                  {entry.author === "client" ? name : entry.name} <span>{entry.date}</span>
                </div>
                <div className="comment-text">{entry.text}</div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {isApproved ? (
        <div className="approved-footnote">{approvedFooter}</div>
      ) : (
        <div className="approval-footer">
          <input
            type="text"
            className="comment-input"
            placeholder={missingComment ? "Add a comment describing the change you need" : "Leave a comment or requested change..."}
            value={comment}
            style={missingComment ? { borderColor: "#dc2626" } : undefined}
            onChange={(event) => {
              setComment(event.target.value);
              setMissingComment(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitEdit();
            }}
          />
          <button className="btn-request-edit" onClick={submitEdit}>
            Request Edit
          </button>
          <button className="btn-approve" onClick={onApprove}>
            Approve
          </button>
        </div>
      )}
    </div>
  );
};

const ContentApproval = () => {
  const [batch, setBatch] = useState("September 2026");
  const [states, setStates] = useLocalStore("bayshore_content_approvals", INITIAL_STATE);

  const isIndividual = batch === INDIVIDUAL_CONTENT;
  const items = contentBatches[batch] ?? [];
  const isApproved = (item: ContentItem) => item.status === "approved" || states[item.id]?.status === "approved";
  const approvedCount = items.filter(isApproved).length;
  const waitingCount = items.length - approvedCount;
  const percent = items.length === 0 ? 0 : Math.round((approvedCount / items.length) * 100);
  const plural = (count: number) => (count === 1 ? "" : "s");

  const description = isIndividual
    ? waitingCount === 0
      ? `All ${items.length} individually-sent item${plural(items.length)} have been reviewed.`
      : `${waitingCount} item${plural(waitingCount)} sent outside the regular monthly batch ${
          waitingCount === 1 ? "needs" : "need"
        } your review.`
    : waitingCount === 0
      ? `All ${items.length} item${plural(items.length)} from BayShore Communication for ${batch} have been reviewed.`
      : `${waitingCount} item${plural(waitingCount)} from BayShore Communication need your review for ${batch}.`;

  const { name } = useSessionUser();

  return (
    <>
      <div className="breadcrumb-row">
        <div className="breadcrumbs">
          Content / <b>Approval Queue</b>
        </div>
        <UserBadge />
      </div>

      <div className="headline-row">
        <div>
          <div className="page-title">Content Approval</div>
          <div className="page-desc">{description}</div>
        </div>
        <div>
          <label className="field-label" style={{ textAlign: "right", display: "block" }}>
            Viewing content for
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <select
              className="month-select"
              value={isIndividual ? "September 2026" : batch}
              onChange={(event) => setBatch(event.target.value)}
            >
              {MONTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              className="btn-individual-content"
              onClick={() => setBatch(INDIVIDUAL_CONTENT)}
              title="Content sent outside the regular monthly batch"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                ...(isIndividual ? { background: "#eff6ff", borderColor: "#2563eb" } : {}),
              }}
            >
              <Plus size={13} strokeWidth={2.5} /> Individual Content
            </button>
          </div>
        </div>
      </div>

      <div className="progress-card">
        <div className="progress-top">
          <span>
            {approvedCount} of {items.length} approved
          </span>
          <span>{percent}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="content-stack">
        {items.map((item) => (
          <ApprovalItem
            key={item.id}
            item={item}
            state={states[item.id]}
            onApprove={() =>
              setStates((previous) => ({
                ...previous,
                [item.id]: { ...previous[item.id], status: "approved", approvedOn: todayLabel() },
              }))
            }
            onRequestEdit={(comment) =>
              setStates((previous) => ({
                ...previous,
                [item.id]: {
                  ...previous[item.id],
                  status: "revision",
                  comments: [
                    ...(previous[item.id]?.comments ?? []),
                    { author: "client", name, date: shortToday(), text: comment },
                  ],
                },
              }))
            }
          />
        ))}
      </div>
    </>
  );
};

export default ContentApproval;
