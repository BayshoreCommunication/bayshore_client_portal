"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, Circle, Flag, Paperclip, Trash2 } from "lucide-react";
import { useHydrated } from "@/lib/local-store";
import {
  PRIORITY_COLORS,
  fileBadgeFor,
  formatFileSize,
  formatTargetDate,
  useProjects,
} from "./store";

const NEXT_STEPS = [
  { label: "Project submitted", done: true },
  { label: "Reviewed by your account manager", done: false },
  { label: "Scope & timeline confirmed", done: false },
  { label: "Kickoff", done: false },
];

const ProjectDetails = ({ projectId }: { projectId: string }) => {
  const router = useRouter();
  const hydrated = useHydrated();
  const { projects, removeProject } = useProjects();
  const project = projects.find((entry) => entry.id === projectId);

  if (!hydrated) return null;

  if (!project) {
    return (
      <>
        <div className="breadcrumb-row">
          <div className="breadcrumbs">
            <Link href="/projects" className="breadcrumb-link">
              Projects
            </Link>{" "}
            / <b>Not found</b>
          </div>
        </div>
        <div className="empty-state-fullpage">
          <div className="empty-title-lg">We couldn&apos;t find that project.</div>
          <Link href="/projects" className="btn-view-report" style={{ marginTop: 18, textDecoration: "none" }}>
            Back to Projects
          </Link>
        </div>
      </>
    );
  }

  const priorityColor = PRIORITY_COLORS[project.priority];
  const created = new Date(project.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <div className="breadcrumb-row">
        <div className="breadcrumbs">
          <Link href="/projects" className="breadcrumb-link">
            Projects
          </Link>{" "}
          / <b>{project.name}</b>
        </div>
      </div>

      <div className="headline-row">
        <div>
          <div className="page-title">{project.name}</div>
          <div className="meta-status-line">
            <span className="lead-status" style={{ background: `${priorityColor}1a`, color: priorityColor }}>
              {project.priority} priority
            </span>
            <span>Submitted {created}</span>
          </div>
        </div>
        <button
          className="btn-draft"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#b91c1c" }}
          onClick={() => {
            removeProject(project.id);
            router.push("/projects");
          }}
        >
          <Trash2 size={14} strokeWidth={2} /> Remove Project
        </button>
      </div>

      <div className="dash-main-grid" style={{ gridTemplateColumns: "2.2fr 1fr" }}>
        <div className="dash-side-col">
          <div className="section-card">
            <div className="section-title" style={{ marginBottom: 10 }}>
              Description
            </div>
            <div className="dash-pending-sub" style={{ fontSize: 13, lineHeight: 1.6, marginTop: 0 }}>
              {project.description || "No description was added for this project."}
            </div>
          </div>

          <div className="section-card">
            <div className="section-title" style={{ marginBottom: 12 }}>
              Details
            </div>
            <div className="contract-row">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <CalendarDays size={13} strokeWidth={2} /> Target completion
              </span>
              <b>{project.targetDate ? formatTargetDate(project.targetDate) : "Not set"}</b>
            </div>
            <div className="contract-row">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Flag size={13} strokeWidth={2} /> Priority
              </span>
              <b style={{ color: priorityColor }}>{project.priority}</b>
            </div>
            <div className="contract-row">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Paperclip size={13} strokeWidth={2} /> Attachments
              </span>
              <b>{project.files.length}</b>
            </div>
          </div>

          {project.files.length > 0 ? (
            <div className="section-card">
              <div className="section-title" style={{ marginBottom: 12 }}>
                Attachments
              </div>
              {project.files.map((file, index) => {
                const badge = fileBadgeFor(file.name);
                return (
                  <div className="doc-preview-tile" style={{ marginTop: index === 0 ? 0 : 8 }} key={`${file.name}-${index}`}>
                    <div className="doc-badge-icon" style={{ background: badge.color }}>
                      {badge.label}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="doc-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {file.name}
                      </div>
                      <div className="doc-size">{formatFileSize(file.size)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="dash-side-col">
          <div className="side-card">
            <div className="side-header">
              <div className="side-title">What happens next</div>
              <div className="side-sub">Your BayShore team will follow up</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {NEXT_STEPS.map((step) => (
                <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
                  {step.done ? (
                    <CheckCircle2 size={16} strokeWidth={2} color="#16a34a" />
                  ) : (
                    <Circle size={16} strokeWidth={2} color="#b7c2cb" />
                  )}
                  <span style={{ color: step.done ? "#17242f" : "#7a8e9b", fontWeight: step.done ? 700 : 500 }}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="side-card">
            <div className="side-title" style={{ marginBottom: 8 }}>
              Questions?
            </div>
            <div className="dash-pending-sub">
              Message <b style={{ color: "#17242f" }}>Jordan Reyes</b>, your account manager, if you&apos;d like to
              adjust the scope or timing.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectDetails;
