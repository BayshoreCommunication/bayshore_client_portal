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
      <div className="flex items-center justify-between">
        <div className="text-[13px] text-[#6a7b8a]">
          <b className="text-[#18232c]">Projects</b>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-205 flex-col gap-4.5 self-center">
        <div className="flex items-end justify-between">
          <div className="min-w-0 flex-1">
            <div className="font-serif text-[26px] font-bold text-[#0b1a26]">Projects</div>
            <div className="mt-1 text-[13px] text-[#657787]">
              Track larger initiatives with BayShore, from website redesigns to campaign launches.
            </div>
          </div>
          <Link
            href="/projects/add"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border-none bg-[#2563eb] px-5 py-2.75 text-[13px] font-bold whitespace-nowrap text-white no-underline"
          >
            <Plus size={14} strokeWidth={2.5} /> Add Project
          </Link>
        </div>

        {!hydrated ? null : projects.length === 0 ? (
          <div className="flex min-h-105 flex-1 flex-col items-center justify-center text-center">
            <FolderOpen size={56} strokeWidth={1.5} color="#8ea0ad" className="mb-4.5" />
            <div className="text-lg font-bold text-[#556977]">Add a project to get started!</div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block animate-[sc-fade-in_0.4s_ease] rounded-lg border border-[#dbe3de] bg-white p-5 text-inherit no-underline"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[15px] font-bold text-[#0d1e2c]">{project.name}</div>
                    {project.description ? (
                      <div className="mt-1 max-w-130 text-[11px] text-[#7a8e9b]">{project.description}</div>
                    ) : null}
                  </div>
                  <span
                    className="rounded-xl px-2.75 py-1 text-[10.5px] font-bold whitespace-nowrap"
                    style={{ background: `${PRIORITY_COLORS[project.priority]}1a`, color: PRIORITY_COLORS[project.priority] }}
                  >
                    {project.priority}
                  </span>
                </div>
                {project.targetDate ? (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#7a8e9b]">
                    <CalendarDays size={13} strokeWidth={2} /> Target: {formatTargetDate(project.targetDate)}
                  </div>
                ) : null}
                {project.files.length > 0 ? (
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#7a8e9b]">
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
