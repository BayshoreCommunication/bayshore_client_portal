"use client";

import { useRef, useState, useSyncExternalStore, type DragEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, Flag, FolderKanban, Loader2, Paperclip, Plus, RotateCcw, Save, X } from "lucide-react";
import {
  createMyProjectAction,
  updateMyProjectAction,
  type MyProject,
  type ProjectFile,
  type ProjectPriority,
} from "@/app/actions/project";
import { poppins } from "@/component/shared/fonts";
import {
  PROJECT_DESCRIPTION_LIMIT,
  PROJECT_FILE_ACCEPT,
  PROJECT_FILE_KINDS,
  PROJECT_MAX_FILES,
  PROJECT_NAME_LIMIT,
  PROJECT_PRIORITIES as PRIORITIES,
  PROJECT_PRIORITY_KEYS,
  PROJECT_STATUSES as STATUSES,
  fileBadgeFor,
  fileProblem,
  formatFileSize,
  formatTargetDate,
  subscribeNever,
  targetDateInput,
  todayValue,
} from "./projectUi";

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";

const labelClass = "mb-1.5 block text-[12px] font-medium text-[#1f2530]";
const fieldClass =
  "h-10 w-full rounded-lg border border-[#e2e5e9] bg-white px-3 text-[12.5px] text-[#1f2530] outline-none placeholder:text-[#9aa3af] focus:border-[#9aa3af]";
const selectClass = `${fieldClass} cursor-pointer`;
const star = <span className="text-[#dc2626]">*</span>;

type Outcome = { ok: boolean; error?: string; fieldErrors?: string[] };

// New files travel as a multipart form through the /api/projects route handlers —
// a server action caps the request at 1MB, far below one 25MB attachment.
const sendWithFiles = async (url: string, method: "POST" | "PATCH", form: FormData): Promise<Outcome> => {
  try {
    const response = await fetch(url, { method, body: form });
    const body = await response.json().catch(() => null);
    if (response.ok) return { ok: true };
    return {
      ok: false,
      error: typeof body?.message === "string" ? body.message : "Something went wrong.",
      fieldErrors: Array.isArray(body?.errors) ? body.errors : undefined,
    };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
};

const FileRow = ({
  name,
  size,
  note,
  removed = false,
  onToggle,
}: {
  name: string;
  size: number;
  note?: string;
  removed?: boolean;
  onToggle: () => void;
}) => {
  const badge = fileBadgeFor(name);

  return (
    <li className={`flex items-center gap-2.5 rounded-lg border border-[#e6e8eb] bg-white px-3 py-2 ${removed ? "opacity-55" : ""}`}>
      <span
        className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold text-white"
        style={{ background: badge.color }}
      >
        {badge.label}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[12px] font-medium text-[#1f2530] ${removed ? "line-through" : ""}`} title={name}>
          {name}
        </span>
        <span className="mt-px block text-[11px] text-[#6b7280]">
          {formatFileSize(size)}
          {note ? ` · ${note}` : ""}
        </span>
      </span>
      <button
        type="button"
        className={`inline-flex h-7.5 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-md text-[#4b5260] ${
          removed ? "px-2 text-[11.5px] font-medium hover:bg-[#f3f4f6] hover:text-[#0b0c24]" : "w-7.5 hover:bg-[#fdecec] hover:text-[#b42318]"
        }`}
        aria-label={`${removed ? "Keep" : "Remove"} ${name}`}
        onClick={onToggle}
      >
        {removed ? (
          <>
            <RotateCcw size={12} strokeWidth={2.25} /> Keep
          </>
        ) : (
          <X size={15} strokeWidth={2.25} />
        )}
      </button>
    </li>
  );
};

// Pass `project` to edit an existing one; leave it out to open a new one.
const ProjectForm = ({ project }: { project?: MyProject }) => {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(project);

  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [targetDate, setTargetDate] = useState(targetDateInput(project?.targetDate));
  const [priority, setPriority] = useState<ProjectPriority>(project?.priority ?? "normal");
  // Files already on the project stay listed; the ones marked here go when saved.
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [nameMissing, setNameMissing] = useState(false);
  // Files that couldn't be attached on the last try, and why.
  const [skipped, setSkipped] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  // "Today" depends on the visitor's timezone, so it's read in the browser only.
  const today = useSyncExternalStore(subscribeNever, todayValue, () => "");

  const existing: ProjectFile[] = project?.files ?? [];
  const keptCount = existing.length - removedUrls.length;
  const fileCount = keptCount + newFiles.length;
  const backHref = project ? `/projects/${project._id}` : "/projects";

  // Takes what fits: skips files of the wrong type, over the size limit or already
  // attached, and stops at the file count limit — saying which were left out.
  const attach = (chosen: File[]) => {
    const next = [...newFiles];
    const left: string[] = [];
    for (const file of chosen) {
      const problem = fileProblem(file);
      if (problem) left.push(problem);
      else if (next.some((added) => added.name === file.name && added.size === file.size)) continue;
      else if (keptCount + next.length >= PROJECT_MAX_FILES) left.push(`"${file.name}" wasn't added — a project can have up to ${PROJECT_MAX_FILES} files.`);
      else next.push(file);
    }
    setNewFiles(next);
    setSkipped(left);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    attach(Array.from(event.dataTransfer.files));
  };

  const toggleRemoved = (url: string) =>
    setRemovedUrls((previous) => (previous.includes(url) ? previous.filter((entry) => entry !== url) : [...previous, url]));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors([]);
    if (!name.trim()) {
      setNameMissing(true);
      return;
    }
    if (fileCount > PROJECT_MAX_FILES) {
      setError(`A project can have up to ${PROJECT_MAX_FILES} files — remove ${fileCount - PROJECT_MAX_FILES} to continue.`);
      return;
    }

    const fields = { name: name.trim(), description: description.trim(), targetDate, priority };
    setSaving(true);

    let outcome: Outcome;
    if (newFiles.length) {
      const form = new FormData();
      for (const [key, value] of Object.entries(fields)) form.append(key, value);
      for (const url of removedUrls) form.append("removeFiles", url);
      for (const file of newFiles) form.append("files", file);
      outcome = project
        ? await sendWithFiles(`/api/projects/${project._id}`, "PATCH", form)
        : await sendWithFiles("/api/projects", "POST", form);
    } else {
      outcome = project
        ? await updateMyProjectAction(project._id, { ...fields, removeFiles: removedUrls })
        : await createMyProjectAction(fields);
    }

    if (!outcome.ok) {
      setSaving(false);
      setError(outcome.error ?? "Something went wrong.");
      setFieldErrors(outcome.fieldErrors ?? []);
      return;
    }

    router.push(backHref);
    // The route handler's upload isn't a navigation, so ask for the fresh list / details.
    router.refresh();
  };

  const statusMeta = STATUSES[project?.status ?? "new"];

  return (
    <div className={`${poppins.className} flex flex-col gap-4.5`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[28px] leading-tight font-bold text-[#0b0c24]">{isEdit ? "Edit Project" : "New Project"}</div>
          <div className="mt-1 text-[12.5px] text-[#4b5563]">
            {isEdit
              ? "Update the details or the attached files. Your BayShore team sees the changes right away."
              : "Tell us about the initiative — your BayShore team will review it and reach out with next steps."}
          </div>
        </div>
        <Link
          href={backHref}
          className="flex h-9.5 items-center gap-1.5 rounded-lg border border-[#e2e5e9] bg-white px-4 text-[12.5px] font-medium text-[#1f2530] no-underline hover:bg-[#f3f4f6]"
        >
          <ArrowLeft size={14} strokeWidth={2} /> {isEdit ? "Back to Project" : "Back to Projects"}
        </Link>
      </div>

      <div className="grid grid-cols-1 items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form onSubmit={handleSubmit} className={`${cardClass} p-5`} noValidate>
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelClass} htmlFor="project-name">
                Project Name {star}
              </label>
              <input
                id="project-name"
                type="text"
                className={`${fieldClass} ${nameMissing ? "border-[#dc2626] focus:border-[#dc2626]" : ""}`}
                placeholder="e.g. Website Redesign"
                maxLength={PROJECT_NAME_LIMIT}
                aria-invalid={nameMissing}
                aria-describedby={nameMissing ? "project-name-error" : undefined}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setNameMissing(false);
                }}
              />
              {nameMissing ? (
                <div id="project-name-error" role="alert" className="mt-1 text-[11.5px] font-medium text-[#b42318]">
                  Give your project a name to continue.
                </div>
              ) : null}
            </div>

            <div>
              <label className={labelClass} htmlFor="project-description">
                Description
              </label>
              <textarea
                id="project-description"
                className={`${fieldClass} h-28 resize-y py-2.5`}
                placeholder="What is this project about?"
                maxLength={PROJECT_DESCRIPTION_LIMIT}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="project-target">
                  Target Completion
                </label>
                <input
                  id="project-target"
                  type="date"
                  className={selectClass}
                  // An existing date may already be behind us; a new one can't be.
                  min={isEdit ? undefined : today || undefined}
                  value={targetDate}
                  onChange={(event) => setTargetDate(event.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="project-priority">
                  Priority
                </label>
                <select
                  id="project-priority"
                  className={selectClass}
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as ProjectPriority)}
                >
                  {PROJECT_PRIORITY_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {PRIORITIES[key].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className={labelClass}>
                Attach Files <span className="font-normal text-[#6b7280]">(optional)</span>
              </div>
              <input
                ref={fileInput}
                type="file"
                multiple
                accept={PROJECT_FILE_ACCEPT}
                className="hidden"
                onChange={(event) => {
                  attach(Array.from(event.target.files ?? []));
                  // Clear it so picking the same file again still fires a change.
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                className={`flex w-full cursor-pointer flex-col items-center rounded-xl border-[1.5px] border-dashed px-3 py-5 text-center transition-colors ${
                  dragging ? "border-[#2f5fd8] bg-[#eef3fd]" : "border-[#d5d9df] bg-[#f9fafb] hover:border-[#2f5fd8] hover:bg-[#f3f6fd]"
                }`}
                onClick={() => fileInput.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                <Paperclip size={22} strokeWidth={2} className="mb-1.5 text-[#2f5fd8]" />
                <span className="text-[12.5px] font-medium text-[#0b0c24]">{dragging ? "Drop to attach" : "Click to upload, or drag files here"}</span>
                <span className="mt-0.5 text-[11px] text-[#6b7280]">
                  {PROJECT_FILE_KINDS} · up to 25MB each · up to {PROJECT_MAX_FILES} files
                </span>
              </button>

              {skipped.length ? (
                <div role="alert" className="mt-2.5 rounded-lg border border-[#f5c2c2] bg-[#fdecec] px-3.5 py-2.5 text-[12px] text-[#b42318]">
                  {skipped.map((message) => (
                    <div key={message}>{message}</div>
                  ))}
                </div>
              ) : null}

              {existing.length || newFiles.length ? (
                <ul className="mt-2.5 flex list-none flex-col gap-2">
                  {existing.map((file) => {
                    const removed = removedUrls.includes(file.url);
                    return (
                      <FileRow
                        key={file.url}
                        name={file.name}
                        size={file.size}
                        note={removed ? "will be removed when you save" : undefined}
                        removed={removed}
                        onToggle={() => toggleRemoved(file.url)}
                      />
                    );
                  })}
                  {newFiles.map((file, index) => (
                    <FileRow
                      key={`${file.name}-${file.size}`}
                      name={file.name}
                      size={file.size}
                      note={isEdit ? "new" : undefined}
                      onToggle={() => setNewFiles((previous) => previous.filter((_, i) => i !== index))}
                    />
                  ))}
                </ul>
              ) : null}
            </div>

            {error ? (
              <div role="alert" className="rounded-lg border border-[#f5c2c2] bg-[#fdecec] px-3.5 py-2.5 text-[12.5px] font-medium text-[#b42318]">
                {error}
                {fieldErrors.length > 0 ? (
                  <ul className="mt-1.5 list-disc pl-4.5 font-normal">
                    {fieldErrors.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2.5 border-t border-[#eef0f2] pt-4 sm:flex-row sm:justify-end">
            <Link
              href={backHref}
              className="flex h-9.5 items-center justify-center rounded-lg border border-[#e2e5e9] bg-white px-4.5 text-[12.5px] font-medium text-[#1f2530] no-underline hover:bg-[#f3f4f6]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="flex h-9.5 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#0b0c24] px-4.5 text-[12.5px] font-medium text-white hover:bg-[#1e2140] disabled:cursor-wait disabled:opacity-70"
              disabled={saving}
              aria-busy={saving}
            >
              {saving ? (
                <Loader2 size={14} strokeWidth={2.5} className="animate-spin" />
              ) : isEdit ? (
                <Save size={14} strokeWidth={2} />
              ) : (
                <Plus size={14} strokeWidth={2.5} />
              )}
              {saving ? (newFiles.length ? "Uploading…" : "Saving…") : isEdit ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </form>

        {/* How the project will look in the list, filled in live as the form is typed. */}
        <div className={`${cardClass} p-4.5`}>
          <div className="mb-3.5 flex items-center gap-2 text-[13px] font-semibold text-[#0b0c24]">
            <Eye size={15} strokeWidth={2} className="text-[#2f5fd8]" /> Preview
          </div>
          <div className="rounded-xl border border-[#eef0f2] bg-[#f9fafb] p-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#d9e0ef] text-[#2f5fd8]">
                <FolderKanban size={16} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-medium text-[#1f2530]" title={name.trim() || undefined}>
                  {name.trim() || "New project"}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-[#6b7280]">{description.trim() || "No description yet"}</div>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2 border-t border-[#eef0f2] pt-3 text-[11.5px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#6b7280]">Priority</span>
                <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: PRIORITIES[priority].color }}>
                  <Flag size={12} strokeWidth={2.25} /> {PRIORITIES[priority].label}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#6b7280]">Target date</span>
                <span className="font-medium text-[#1f2530]">{formatTargetDate(targetDate) || "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#6b7280]">Files</span>
                <span className="inline-flex items-center gap-1.25 font-medium text-[#1f2530]">
                  {fileCount ? (
                    <>
                      <Paperclip size={12} strokeWidth={2} /> {fileCount}
                    </>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#6b7280]">Status</span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium"
                  style={{ background: statusMeta.background, color: statusMeta.color }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusMeta.dot }} />
                  {statusMeta.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;
