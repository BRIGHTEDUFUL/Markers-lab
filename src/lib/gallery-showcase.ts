import { Category, Project } from "../types";
import { mediaSrc } from "./media-url";

const SHOWCASE_STATUSES: Project["status"][] = ["APPROVED", "IN_PROGRESS", "COMPLETED"];

const categoryImageMap: Record<Category, string[]> = {
  Website: [
    "https://images.pexels.com/photos/5077048/pexels-photo-5077048.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  "E-commerce": [
    "https://images.pexels.com/photos/5699467/pexels-photo-5699467.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  Portfolio: [
    "https://images.pexels.com/photos/326518/pexels-photo-326518.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  "Web Application": [
    "https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  "Mobile App": [
    "https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  "Desktop Software": [
    "https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  "AI / Machine Learning": [
    "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  "Blockchain / Web3": [
    "https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  "Cloud Infrastructure": [
    "https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  Cybersecurity: [
    "https://images.pexels.com/photos/5380664/pexels-photo-5380664.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  Other: [
    "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
};

const curatedShowcaseProjects: Project[] = [];

const statusWeight: Record<Project["status"], number> = {
  COMPLETED: 4,
  IN_PROGRESS: 3,
  APPROVED: 2,
  IN_REVIEW: 1,
  PENDING: 0,
  REJECTED: -1,
};

function sortProjects(a: Project, b: Project): number {
  const featureDelta = Number(b.featured) - Number(a.featured);
  if (featureDelta !== 0) return featureDelta;

  const statusDelta = (statusWeight[b.status] || 0) - (statusWeight[a.status] || 0);
  if (statusDelta !== 0) return statusDelta;

  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function uploadedImagePath(project: Project): string | undefined {
  return project.files?.find((f) => f.mimeType?.startsWith("image/"))?.path;
}

function categoryImage(category: Category, projectId: string): string {
  const list = categoryImageMap[category] || categoryImageMap.Other;
  const index = Math.abs(projectId.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % list.length;
  return list[index];
}

function hasMeaningfulContent(project: Project): boolean {
  return project.title.trim().length > 4 && project.description.trim().length > 40;
}

export function isShowcaseReadyProject(project: Project): boolean {
  return SHOWCASE_STATUSES.includes(project.status) && hasMeaningfulContent(project);
}

export function curateShowcaseProjects(projects: Project[], minItems: number = 8): Project[] {
  const backendShowcase = projects
    .filter(isShowcaseReadyProject)
    .sort(sortProjects);

  if (backendShowcase.length >= minItems) {
    return backendShowcase;
  }

  const existingIds = new Set(backendShowcase.map((p) => p.id));
  const fallback = curatedShowcaseProjects.filter((p) => !existingIds.has(p.id));
  const merged = [...backendShowcase, ...fallback].sort(sortProjects);
  return merged.slice(0, Math.max(minItems, backendShowcase.length));
}

export function resolveProjectShowcaseImage(project: Project): string {
  const uploaded = uploadedImagePath(project);
  if (uploaded) return mediaSrc(uploaded, categoryImage(project.category, project.id));
  return categoryImage(project.category, project.id);
}

export function pickFeaturedShowcase(projects: Project[], count: number = 3): Project[] {
  const curated = curateShowcaseProjects(projects, count);
  const featuredFirst = curated.filter((p) => p.featured);
  const pool = featuredFirst.length ? featuredFirst : curated;
  return pool.slice(0, count);
}
