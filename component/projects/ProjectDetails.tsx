"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  Download,
  Flag,
  Loader2,
  MessageCircle,
  Paperclip,
  Pencil,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { deleteMyProjectAction, type MyProject } from "@/app/actions/project";
import { poppins } from "@/component/shared/fonts";
import {
  PROJECT_PRIORITIES as PRIORITIES,
  PROJECT_STATUSES as STATUSES,
  canDeleteProject,
  canEditProject,
  dueNote,
  fileBadgeFor,
  formatDate,
  formatFileSize,
  formatTargetDate,
  subscribeNever,
  todayValue,
} from "./projectUi";

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";
const outlineButtonClass =
  "flex h-9.5 items-center gap-1.5 rounded-lg border border-[#e2e5e9] bg-white px-4 text-[12.5px] font-medium text-[#1f2530] no-underline hover:bg-[#f3f4f6]";

const DetailRow = ({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 border-b border-[#eef0f2] py-2.5 text-[12.5px] last:border-b-0">
    <span className="inline-flex shrink-0 items-center gap-1.5 text-[#6b7280]">
      <Icon size={13} strokeWidth={2} /> {label}
    </span>
    <span className="text-right font-medium text-[#1f2530]">{children}</span>
  </div>
);

// Asks once in place before deleting; on success goes back to the list. A refusal
// (the team has started on it since this page loaded) is shown where it happened.
const DeleteProject = ({ project }: { project: MyProject }) => {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteMyProjectAction(project._id);
      if (!result.ok) {
        setError(result.error ?? "Failed to delete project.");
        setConfirming(false);
        return;
      }
      router.push("/projects");
    });
  };

  if (error) {
    return (
      <span role="alert" className="max-w-80 text-[12px] font-medium text-[#b42318]">
        {error}
      </span>
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        className="flex h-9.5 cursor-pointer items-center gap-1.5 rounded-lg border border-[#f0b8b8] bg-white px-4 text-[12.5px] font-medium text-[#b42318] hover:bg-[#fdecec]"
        onClick={() => setConfirming(true)}
      >
        <Trash2 size={14} strokeWidth={2} /> Delete
      </button>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2 text-[12px] font-medium text-[#b42318]">
      Delete this project and its files?
      <button
        type="button"
        className="flex h-9.5 cursor-pointer items-center gap-1.5 rounded-lg bg-[#dc2626] px-4 text-[12.5px] font-medium text-white hover:bg-[#b91c1c] disabled:cursor-wait"
        disabled={isPending}
        aria-busy={isPending}
        onClick={handleDelete}
      >
        {isPending ? <Loader2 size={14} strokeWidth={2.5} className="animate-spin" /> : <Trash2 size={14} strokeWidth={2} />}
        {isPending ? "Deleting…" : "Yes, delete"}
      </button>
      <button type="button" className={`${outlineButtonClass} cursor-pointer`} disabled={isPending} onClick={() => setConfirming(false)}>
        Cancel
      </button>
    </span>
  );
};

// One of the client's projects: what they asked for, where it stands, and its files.
const ProjectDetails = ({ project }: { project: MyProject }) => {
  // "Today" depends on the visitor's timezone, so it's read in the browser only.
  const today = useSyncExternalStore(subscribeNever, todayValue, () => "");

  const priority = PRIORITIES[project.priority];
  const status = STATUSES[project.status];
  const due = dueNote(project, today);

  // The steps the team takes it through, with the day each one happened.
  const steps = [
    { label: project.requestedBy === "team" ? "Opened by your BayShore team" : "Project submitted", date: project.createdAt, done: true },
    { label: "Work started", date: project.startedAt, done: project.status !== "new" },
    { label: "Completed", date: project.completedAt, done: project.status === "completed" },
  ];

  return (
    <div className={`${poppins.className} flex flex-col gap-4.5`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[28px] leading-tight font-bold wrap-break-word text-[#0b0c24]">{project.name}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2.5 text-[12.5px] text-[#4b5563]">
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium"
              style={{ background: status.background, color: status.color }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: status.dot }} />
              {status.label}
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: priority.color }}>
              <Flag size={13} strokeWidth={2.25} /> {priority.label} priority
            </span>
            <span>Submitted {formatDate(project.createdAt)}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/projects" className={outlineButtonClass}>
            <ArrowLeft size={14} strokeWidth={2} /> Back to Projects
          </Link>
          {canEditProject(project) ? (
            <Link
              href={`/projects/${project._id}/edit`}
              className="flex h-9.5 items-center gap-1.5 rounded-lg bg-[#0b0c24] px-4 text-[12.5px] font-medium text-white no-underline hover:bg-[#1e2140]"
            >
              <Pencil size={14} strokeWidth={2} /> Edit
            </Link>
          ) : null}
          {canDeleteProject(project) ? <DeleteProject project={project} /> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-4.5">
          <div className={`${cardClass} p-5`}>
            <div className="mb-2 text-[14px] font-semibold text-[#0b0c24]">Description</div>
            <div className="text-[12.5px] leading-relaxed whitespace-pre-line text-[#384955]">
              {project.description || <span className="text-[#6b7280]">No description was added for this project.</span>}
            </div>
          </div>

          <div className={`${cardClass} p-5`}>
            <div className="mb-1 text-[14px] font-semibold text-[#0b0c24]">Details</div>
            <DetailRow icon={CalendarDays} label="Target completion">
              {formatTargetDate(project.targetDate) || "Not set"}
              {due ? (
                <span
                  className={`ml-2 text-[11.5px] font-normal ${
                    due.tone === "overdue" ? "text-[#b42318]" : due.tone === "soon" ? "text-[#b45309]" : "text-[#6b7280]"
                  }`}
                >
                  {due.text}
                </span>
              ) : null}
            </DetailRow>
            <DetailRow icon={Flag} label="Priority">
              <span style={{ color: priority.color }}>{priority.label}</span>
            </DetailRow>
            <DetailRow icon={UserRound} label="Opened by">
              {project.requestedBy === "team" ? "Your BayShore team" : "You"}
            </DetailRow>
            <DetailRow icon={Paperclip} label="Attachments">
              {project.files.length}
            </DetailRow>
          </div>

          {project.files.length > 0 ? (
            <div className={`${cardClass} p-5`}>
              <div className="mb-3 text-[14px] font-semibold text-[#0b0c24]">Attachments</div>
              <ul className="flex list-none flex-col gap-2">
                {project.files.map((file) => {
                  const badge = fileBadgeFor(file.name);
                  return (
                    <li key={file.url}>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2.5 rounded-lg border border-[#e6e8eb] bg-white px-3 py-2 no-underline hover:border-[#c9ced6] hover:bg-[#f9fafb]"
                      >
                        <span
                          className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold text-white"
                          style={{ background: badge.color }}
                        >
                          {badge.label}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-medium text-[#1f2530] group-hover:text-[#2f5fd8]" title={file.name}>
                            {file.name}
                          </span>
                          <span className="mt-px block text-[11px] text-[#6b7280]">{formatFileSize(file.size)}</span>
                        </span>
                        <Download size={15} strokeWidth={2} className="shrink-0 text-[#4b5260]" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4.5">
          <div className={`${cardClass} p-4.5`}>
            <div className="mb-3.5">
              <div className="text-[13px] font-semibold text-[#0b0c24]">Progress</div>
              <div className="mt-0.5 text-[11px] text-[#6b7280]">Your BayShore team moves it along</div>
            </div>
            <ol className="flex list-none flex-col gap-3.5">
              {steps.map((step) => (
                <li className="flex items-start gap-2.5 text-[12.5px]" key={step.label}>
                  {step.done ? (
                    <CheckCircle2 size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-[#16a34a]" />
                  ) : (
                    <Circle size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-[#b7c2cb]" />
                  )}
                  <span>
                    <span className={step.done ? "font-medium text-[#1f2530]" : "text-[#6b7280]"}>{step.label}</span>
                    {step.done && step.date ? <span className="mt-0.5 block text-[11px] text-[#6b7280]">{formatDate(step.date)}</span> : null}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className={`${cardClass} p-4.5`}>
            <div className="mb-2 text-[13px] font-semibold text-[#0b0c24]">Questions?</div>
            <div className="text-[12px] leading-normal text-[#4b5563]">
              Message your account manager if you&apos;d like to adjust the scope or timing
              {canDeleteProject(project) ? "" : ", or to cancel a project that's already under way"}.
            </div>
            <Link
              href="/messages"
              className="mt-3.5 flex items-center justify-center gap-1.5 rounded-lg bg-[#0b0c24] px-4 py-2.25 text-[12.5px] font-medium text-white no-underline hover:bg-[#1e2140]"
            >
              <MessageCircle size={14} strokeWidth={2} /> Send a Message
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
