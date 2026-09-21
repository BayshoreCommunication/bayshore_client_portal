"use client";

import Link from "next/link";
import { CalendarDays, FolderOpen, Paperclip, Plus } from "lucide-react";
import { useHydrated } from "@/lib/local-store";
import { PRIORITY_COLORS, formatTargetDate, useProjects } from "./store";

const Projects = () => {
  const { projects } = useProjects();
  const hydrated = useHydrated();

  return (
    <>
      <div className="breadcrumb-row">
        <div className="breadcrumbs">
          <b>Projects</b>
        </div>
      </div>

      <div className="projects-centered-wrap">
        <div className="headline-row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="page-title">Projects</div>
            <div className="page-desc">
              Track larger initiatives with BayShore, from website redesigns to campaign launches.
            </div>
          </div>
          <Link
            href="/projects/add"
            className="btn-add-client"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
          >
            <Plus size={14} strokeWidth={2.5} /> Add Project
          </Link>
        </div>

        {!hydrated ? null : projects.length === 0 ? (
          <div className="empty-state-fullpage">
            <FolderOpen size={56} strokeWidth={1.5} color="#8ea0ad" style={{ marginBottom: 18 }} />
            <div className="empty-title-lg">Add a project to get started!</div>
          </div>
        ) : (
          <div className="dash-side-col">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="section-card new-item"
                style={{ display: "block", textDecoration: "none", color: "inherit" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <div className="section-title">{project.name}</div>
                    {project.description ? (
                      <div className="dash-pending-sub" style={{ marginTop: 4, maxWidth: 520 }}>
                        {project.description}
                      </div>
                    ) : null}
                  </div>
                  <span
                    className="lead-status"
                    style={{ background: `${PRIORITY_COLORS[project.priority]}1a`, color: PRIORITY_COLORS[project.priority] }}
                  >
                    {project.priority}
                  </span>
                </div>
                {project.targetDate ? (
                  <div className="dash-pending-sub" style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <CalendarDays size={13} strokeWidth={2} /> Target: {formatTargetDate(project.targetDate)}
                  </div>
                ) : null}
                {project.files.length > 0 ? (
                  <div className="dash-pending-sub" style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <Paperclip size={13} strokeWidth={2} /> Attached: {project.files.map((file) => file.name).join(", ")}
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Projects;
