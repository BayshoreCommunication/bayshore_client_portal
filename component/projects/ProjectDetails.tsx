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
        <div className="flex items-center justify-between">
          <div className="text-[13px] text-[#6a7b8a]">
            <Link href="/projects" className="cursor-pointer font-bold text-[#18232c] hover:underline">
              Projects
            </Link>{" "}
            / <b className="text-[#18232c]">Not found</b>
          </div>
        </div>
        <div className="flex min-h-105 flex-1 flex-col items-center justify-center text-center">
          <div className="text-lg font-bold text-[#556977]">We couldn&apos;t find that project.</div>
          <Link
            href="/projects"
            className="mt-4.5 inline-block cursor-pointer rounded-md bg-[#0d1e2e] px-4 py-2.25 text-[12.5px] font-bold whitespace-nowrap text-white no-underline"
          >
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
      <div className="flex items-center justify-between">
        <div className="text-[13px] text-[#6a7b8a]">
          <Link href="/projects" className="cursor-pointer font-bold text-[#18232c] hover:underline">
            Projects
          </Link>{" "}
          / <b className="text-[#18232c]">{project.name}</b>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="font-serif text-[26px] font-bold text-[#0b1a26]">{project.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[12.5px] text-[#657787]">
            <span
              className="rounded-xl px-2.75 py-1 text-[10.5px] font-bold whitespace-nowrap"
              style={{ background: `${priorityColor}1a`, color: priorityColor }}
            >
              {project.priority} priority
            </span>
            <span>Submitted {created}</span>
          </div>
        </div>
        <button
          className="flex cursor-pointer items-center gap-1.5 rounded-md border border-[#cfdcd6] bg-white px-4.5 py-2.25 text-[13px] font-semibold text-[#b91c1c]"
          onClick={() => {
            removeProject(project.id);
            router.push("/projects");
          }}
        >
          <Trash2 size={14} strokeWidth={2} /> Remove Project
        </button>
      </div>

      <div className="grid grid-cols-[2.2fr_1fr] items-start gap-5">
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-[#dbe3de] bg-white p-5">
            <div className="mb-2.5 text-[15px] font-bold text-[#0d1e2c]">Description</div>
            <div className="text-[13px] leading-[1.6] text-[#7a8e9b]">
              {project.description || "No description was added for this project."}
            </div>
          </div>

          <div className="rounded-lg border border-[#dbe3de] bg-white p-5">
            <div className="mb-3 text-[15px] font-bold text-[#0d1e2c]">Details</div>
            <div className="flex justify-between border-b border-[#eef3ef] py-2.25 text-[12.5px] last:border-b-0">
              <span className="inline-flex items-center gap-1.5 text-[#7a8e9b]">
                <CalendarDays size={13} strokeWidth={2} /> Target completion
              </span>
              <b className="text-[#17242f]">{project.targetDate ? formatTargetDate(project.targetDate) : "Not set"}</b>
            </div>
            <div className="flex justify-between border-b border-[#eef3ef] py-2.25 text-[12.5px] last:border-b-0">
              <span className="inline-flex items-center gap-1.5 text-[#7a8e9b]">
                <Flag size={13} strokeWidth={2} /> Priority
              </span>
              <b style={{ color: priorityColor }}>{project.priority}</b>
            </div>
            <div className="flex justify-between border-b border-[#eef3ef] py-2.25 text-[12.5px] last:border-b-0">
              <span className="inline-flex items-center gap-1.5 text-[#7a8e9b]">
                <Paperclip size={13} strokeWidth={2} /> Attachments
              </span>
              <b className="text-[#17242f]">{project.files.length}</b>
            </div>
          </div>

          {project.files.length > 0 ? (
            <div className="rounded-lg border border-[#dbe3de] bg-white p-5">
              <div className="mb-3 text-[15px] font-bold text-[#0d1e2c]">Attachments</div>
              {project.files.map((file, index) => {
                const badge = fileBadgeFor(file.name);
                return (
                  <div
                    className={`flex items-center gap-2.5 rounded-md border border-[#cbd6d0] bg-[#f8fafc] px-3 py-2.5 ${index === 0 ? "" : "mt-2"}`}
                    key={`${file.name}-${index}`}
                  >
                    <div
                      className="flex h-8.5 w-8.5 items-center justify-center rounded-md text-[10px] font-bold text-white"
                      style={{ background: badge.color }}
                    >
                      {badge.label}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="overflow-hidden text-xs font-bold text-ellipsis whitespace-nowrap text-[#17242f]">
                        {file.name}
                      </div>
                      <div className="mt-px text-[10.5px] text-[#7a8e9b]">{formatFileSize(file.size)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-[#dbe3de] bg-white px-5 py-4.5">
            <div className="mb-3.5">
              <div className="text-sm font-bold text-[#0d1e2c]">What happens next</div>
              <div className="mt-0.5 text-[11px] text-[#728492]">Your BayShore team will follow up</div>
            </div>
            <div className="flex flex-col gap-3.5">
              {NEXT_STEPS.map((step) => (
                <div className="flex items-center gap-2.5 text-[12.5px]" key={step.label}>
                  {step.done ? (
                    <CheckCircle2 size={16} strokeWidth={2} color="#16a34a" />
                  ) : (
                    <Circle size={16} strokeWidth={2} color="#b7c2cb" />
                  )}
                  <span className={step.done ? "font-bold text-[#17242f]" : "font-medium text-[#7a8e9b]"}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#dbe3de] bg-white px-5 py-4.5">
            <div className="mb-2 text-sm font-bold text-[#0d1e2c]">Questions?</div>
            <div className="text-[11px] text-[#7a8e9b]">
              Message <b className="text-[#17242f]">Jordan Reyes</b>, your account manager, if you&apos;d like to adjust the scope or
              timing.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectDetails;
