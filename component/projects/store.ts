"use client";

import { useCallback } from "react";
import { useLocalStore } from "@/lib/local-store";

export type ProjectPriority = "Normal" | "High" | "Low";

export type ProjectFile = { name: string; size: number };

export type Project = {
  id: string;
  name: string;
  description: string;
  targetDate: string;
  priority: ProjectPriority;
  files: ProjectFile[];
  createdAt: string;
};

const INITIAL_PROJECTS: Project[] = [];

export const PRIORITY_COLORS: Record<ProjectPriority, string> = {
  High: "#dc2626",
  Normal: "#2563eb",
  Low: "#8496a3",
};

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const fileBadgeFor = (name: string) => {
  const ext = (name.split(".").pop() ?? "").toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return { label: "IMG", color: "#2563eb" };
  if (["mp4", "mov", "avi", "webm"].includes(ext)) return { label: "VID", color: "#7c3aed" };
  if (ext === "pdf") return { label: "PDF", color: "#dc2626" };
  if (["doc", "docx"].includes(ext)) return { label: "DOC", color: "#2563eb" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { label: "XLS", color: "#15803d" };
  if (["zip", "rar", "7z"].includes(ext)) return { label: "ZIP", color: "#a35a12" };
  return { label: (ext || "FILE").toUpperCase().slice(0, 4), color: "#556977" };
};

export const formatTargetDate = (value: string) => {
  if (!value) return "";
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const useProjects = () => {
  const [projects, setProjects] = useLocalStore("bayshore_projects", INITIAL_PROJECTS);

  const addProject = useCallback(
    (project: Project) => setProjects((previous) => [project, ...previous]),
    [setProjects]
  );

  const removeProject = useCallback(
    (id: string) => setProjects((previous) => previous.filter((project) => project.id !== id)),
    [setProjects]
  );

  return { projects, addProject, removeProject };
};
