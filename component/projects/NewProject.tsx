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
      <div className="flex items-center justify-between">
        <div className="text-[13px] text-[#6a7b8a]">
          <Link href="/projects" className="cursor-pointer font-bold text-[#18232c] hover:underline">
            Projects
          </Link>{" "}
          / <b className="text-[#18232c]">New Project</b>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-205 flex-col gap-4.5 self-center">
        <div>
          <div className="font-serif text-[26px] font-bold text-[#0b1a26]">New Project</div>
          <div className="mt-1 text-[13px] text-[#657787]">
            Tell us about the initiative — your BayShore team will review it and reach out with next steps.
          </div>
        </div>

        <div className="rounded-lg border border-[#dbe3de] bg-white p-5">
          <label className="mb-1.25 block text-[11.5px] font-bold text-[#384b59]">
            Project Name <span>*</span>
          </label>
          <input
            type="text"
            className={`w-full rounded-md border bg-[#fafcfb] px-3 py-2.25 text-[12.5px] text-[#17242f] ${
              nameMissing ? "border-[#dc2626]" : "border-[#cbd6d0]"
            }`}
            placeholder="e.g. Website Redesign"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setNameMissing(false);
            }}
          />
          {nameMissing ? (
            <div className="mt-1 text-[10.5px] text-[#dc2626]">Give your project a name to continue.</div>
          ) : null}

          <div className="mt-3.5">
            <label className="mb-1.25 block text-[11.5px] font-bold text-[#384b59]">Description</label>
            <textarea
              className="h-21 w-full resize-none rounded-md border border-[#cbd6d0] bg-[#fafcfb] px-3 py-2.25 font-[inherit] text-xs text-[#1a252c]"
              placeholder="What is this project about?"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="mt-3.5 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.25 block text-[11.5px] font-bold text-[#384b59]">Target Completion</label>
              <input
                type="date"
                className="w-full rounded-md border border-[#cbd6d0] bg-[#fafcfb] px-3 py-2.25 text-[12.5px] text-[#17242f]"
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.25 block text-[11.5px] font-bold text-[#384b59]">Priority</label>
              <select
                className="w-full rounded-md border border-[#cbd6d0] bg-[#fafcfb] px-3 py-2.25 text-[12.5px] text-[#17242f]"
                value={priority}
                onChange={(event) => setPriority(event.target.value as ProjectPriority)}
              >
                {PRIORITIES.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3.5">
            <label className="mb-1.25 block text-[11.5px] font-bold text-[#384b59]">Attach a File (optional)</label>
            <input ref={fileInput} type="file" multiple className="hidden" onChange={onFilesChosen} />
            <div
              className="cursor-pointer rounded-lg border-[1.5px] border-dashed border-[#cbd6d0] bg-[#fafcfb] px-3 py-4.5 text-center transition-all duration-150 hover:border-[#2563eb] hover:bg-[#f0f7ff]"
              onClick={() => fileInput.current?.click()}
            >
              <Paperclip size={22} strokeWidth={2} color="#2563eb" className="mx-auto mb-1 block" />
              <div className="text-xs font-semibold text-[#1e293b]">Click to upload a file</div>
              <div className="mt-0.5 text-[10px] text-[#8496a3]">Any file type · up to 25MB each · multiple files supported</div>
            </div>

            {files.map((file, index) => {
              const badge = fileBadgeFor(file.name);
              return (
                <div className="mt-2 flex items-center gap-2.5 rounded-md border border-[#cbd6d0] bg-[#f8fafc] px-3 py-2.5" key={`${file.name}-${index}`}>
                  <div
                    className="flex h-8.5 w-8.5 items-center justify-center rounded-md text-[10px] font-bold text-white"
                    style={{ background: badge.color }}
                  >
                    {badge.label}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="overflow-hidden text-xs font-bold text-ellipsis whitespace-nowrap text-[#17242f]">{file.name}</div>
                    <div className="mt-px text-[10.5px] text-[#7a8e9b]">{formatFileSize(file.size)}</div>
                  </div>
                  <button
                    className="inline-flex cursor-pointer items-center gap-1 border-none bg-none text-xs font-semibold text-[#dc2626]"
                    onClick={() => setFiles((previous) => previous.filter((_, i) => i !== index))}
                  >
                    <X size={13} strokeWidth={2.5} /> Remove
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex justify-end gap-2.5 border-t border-[#eef3ef] pt-4">
            <Link href="/projects" className="cursor-pointer rounded-md border border-[#cfdcd6] bg-white px-4.5 py-2.25 text-[13px] font-semibold text-[#273847] no-underline">
              Cancel
            </Link>
            <button
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border-none bg-[#2563eb] px-4.5 py-2.5 text-[12.5px] font-bold text-white"
              onClick={submit}
            >
              Create Project
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewProject;
