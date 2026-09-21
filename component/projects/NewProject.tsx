"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Paperclip, X } from "lucide-react";
import {
  fileBadgeFor,
  formatFileSize,
  useProjects,
  type ProjectFile,
  type ProjectPriority,
} from "./store";

const PRIORITIES: ProjectPriority[] = ["Normal", "High", "Low"];

const NewProject = () => {
  const router = useRouter();
  const { addProject } = useProjects();
  const fileInput = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState<ProjectPriority>("Normal");
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [nameMissing, setNameMissing] = useState(false);

  const onFilesChosen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(event.target.files ?? []).map((file) => ({ name: file.name, size: file.size }));
    setFiles((previous) => [...previous, ...chosen]);
    event.target.value = "";
  };

  const submit = () => {
    if (!name.trim()) {
      setNameMissing(true);
      return;
    }
    addProject({
      id: `p${Date.now().toString(36)}`,
      name: name.trim(),
      description: description.trim(),
      targetDate,
      priority,
      files,
      createdAt: new Date().toISOString(),
    });
    router.push("/projects");
  };

  return (
    <>
      <div className="breadcrumb-row">
        <div className="breadcrumbs">
          <Link href="/projects" className="breadcrumb-link">
            Projects
          </Link>{" "}
          / <b>New Project</b>
        </div>
      </div>

      <div className="projects-centered-wrap">
        <div>
          <div className="page-title">New Project</div>
          <div className="page-desc">
            Tell us about the initiative — your BayShore team will review it and reach out with next steps.
          </div>
        </div>

        <div className="section-card">
          <label className="field-label">
            Project Name <span className="required-star">*</span>
          </label>
          <input
            type="text"
            className="input-text"
            placeholder="e.g. Website Redesign"
            value={name}
            style={nameMissing ? { borderColor: "#dc2626" } : undefined}
            onChange={(event) => {
              setName(event.target.value);
              setNameMissing(false);
            }}
          />
          {nameMissing ? (
            <div className="field-hint" style={{ color: "#dc2626", fontStyle: "normal" }}>
              Give your project a name to continue.
            </div>
          ) : null}

          <div style={{ marginTop: 14 }}>
            <label className="field-label">Description</label>
            <textarea
              className="textarea-caption"
              style={{ height: 84 }}
              placeholder="What is this project about?"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="form-grid-2" style={{ marginTop: 14 }}>
            <div>
              <label className="field-label">Target Completion</label>
              <input
                type="date"
                className="input-text"
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Priority</label>
              <select
                className="input-text"
                value={priority}
                onChange={(event) => setPriority(event.target.value as ProjectPriority)}
              >
                {PRIORITIES.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label className="field-label">Attach a File (optional)</label>
            <input ref={fileInput} type="file" multiple style={{ display: "none" }} onChange={onFilesChosen} />
            <div className="upload-dropzone" onClick={() => fileInput.current?.click()}>
              <Paperclip size={22} strokeWidth={2} color="#2563eb" style={{ display: "block", margin: "0 auto 4px" }} />
              <div className="upload-text">Click to upload a file</div>
              <div className="upload-sub">Any file type · up to 25MB each · multiple files supported</div>
            </div>

            {files.map((file, index) => {
              const badge = fileBadgeFor(file.name);
              return (
                <div className="doc-preview-tile" style={{ marginTop: 8 }} key={`${file.name}-${index}`}>
                  <div className="doc-badge-icon" style={{ background: badge.color }}>
                    {badge.label}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="doc-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {file.name}
                    </div>
                    <div className="doc-size">{formatFileSize(file.size)}</div>
                  </div>
                  <button
                    className="btn-remove-preview"
                    onClick={() => setFiles((previous) => previous.filter((_, i) => i !== index))}
                    style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                  >
                    <X size={13} strokeWidth={2.5} /> Remove
                  </button>
                </div>
              );
            })}
          </div>

          <div className="add-client-actions">
            <Link href="/projects" className="btn-draft" style={{ textDecoration: "none" }}>
              Cancel
            </Link>
            <button className="btn-save-client" onClick={submit}>
              Create Project
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewProject;
